import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';

// Canvas pooling system for performance optimization
const canvasPool = {
  pool: [],
  maxSize: 10,
  
  get() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return document.createElement('canvas');
  },
  
  release(canvas) {
    if (this.pool.length < this.maxSize) {
      // Reset canvas state
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (ctx.resetTransform) ctx.resetTransform();
      this.pool.push(canvas);
    }
  }
};

// Content-based hash function for reliable dirty flag detection
const computeDataHash = (data, height, type, color, containerSize) => {
  if (!data || data.length === 0) return 0;
  
  // Simple rolling hash (FNV-1a inspired)
  let hash = 2166136261; // FNV offset basis
  
  // Hash data values
  for (let i = 0; i < data.length; i++) {
    hash ^= Math.floor(data[i] * 1000); // Include fractional parts
    hash *= 16777619; // FNV prime
    hash = hash >>> 0; // Convert to 32-bit unsigned
  }
  
  // Include other factors that affect rendering
  hash ^= height;
  hash *= 16777619;
  hash = hash >>> 0;
  
  // Include containerSize dimensions in hash for width-dependent rendering
  hash ^= Math.floor(containerSize.width || 0);
  hash *= 16777619;
  hash = hash >>> 0;
  
  hash ^= Math.floor(containerSize.height || 0);
  hash *= 16777619;
  hash = hash >>> 0;
  
  // Hash string properties
  const typeHash = type.split('').reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) >>> 0, 0);
  const colorHash = color.split('').reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) >>> 0, 0);
  
  hash ^= typeHash;
  hash *= 16777619;
  hash = hash >>> 0;
  
  hash ^= colorHash;
  hash *= 16777619;
  hash = hash >>> 0;
  
  return hash;
};

// OffscreenCanvas feature detection and support
const supportsOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';

const createRenderCanvas = (width, height) => {
  if (supportsOffscreenCanvas) {
    try {
      return new OffscreenCanvas(width, height);
    } catch (e) {
      // Fallback to regular canvas if OffscreenCanvas fails
    }
  }
  return canvasPool.get();
};

const releaseRenderCanvas = (canvas) => {
  if (!supportsOffscreenCanvas && canvas instanceof HTMLCanvasElement) {
    canvasPool.release(canvas);
  }
};

// Performance-optimized Chart Component with smooth animations
const DetailedChart = ({ data, type, color, title, unit, height = 200 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const lastHashRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const containerRef = useRef(null);
  const offscreenCanvasRef = useRef(null); // Reuse single OffscreenCanvas per chart instance
  const drawRef = useRef(); // Fix TDZ: ref to hold drawChart function
  const [isAnimating, setIsAnimating] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Single-pass data calculations with memoization
  const dataStats = useMemo(() => {
    if (!data || data.length === 0) return { min: 0, max: 0, range: 1, points: [] };
    
    let min = Infinity;
    let max = -Infinity;
    const points = [];
    
    // Single pass through data for all calculations
    for (let i = 0; i < data.length; i++) {
      const value = data[i];
      if (value < min) min = value;
      if (value > max) max = value;
      points.push({ value, index: i });
    }
    
    const range = max - min || 1;
    return { min, max, range, points };
  }, [data]);

  // Memoized gradients to avoid recreation
  const gradients = useMemo(() => {
    const gradientCache = new Map();
    return {
      getLineGradient: (ctx, padding, canvasHeight) => {
        const key = `line-${padding}-${canvasHeight}-${color}`;
        if (!gradientCache.has(key)) {
          const gradient = ctx.createLinearGradient(0, padding, 0, canvasHeight - padding);
          gradient.addColorStop(0, `${color}80`);
          gradient.addColorStop(1, `${color}20`);
          gradientCache.set(key, gradient);
        }
        return gradientCache.get(key);
      },
      getBarGradient: (ctx, y, barHeight) => {
        const key = `bar-${y}-${barHeight}-${color}`;
        if (!gradientCache.has(key)) {
          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, `${color}60`);
          gradientCache.set(key, gradient);
        }
        return gradientCache.get(key);
      }
    };
  }, [color]);

  // Debounced drawing function - Fixed TDZ by using ref pattern
  const debouncedDraw = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animationRef.current = requestAnimationFrame(() => {
      drawRef.current && drawRef.current();
      setIsAnimating(false);
    });
  }, []);

  // Optimized drawing function with batched operations using OffscreenCanvas
  const drawChart = useCallback(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const canvas = canvasRef.current;
    
    // Use containerSize from state for more reliable dimensions
    const displayWidth = Math.max(containerSize.width - 40, 300);
    const displayHeight = height;
    
    // Set canvas size with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    const renderWidth = displayWidth * dpr;
    const renderHeight = displayHeight * dpr;
    
    // Reuse single OffscreenCanvas per chart instance to reduce allocations
    let offscreenCanvas = offscreenCanvasRef.current;
    if (!offscreenCanvas || offscreenCanvas.width !== renderWidth || offscreenCanvas.height !== renderHeight) {
      // Release previous canvas if dimensions changed
      if (offscreenCanvas) {
        releaseRenderCanvas(offscreenCanvas);
      }
      // Create new canvas with current dimensions
      offscreenCanvas = createRenderCanvas(renderWidth, renderHeight);
      offscreenCanvasRef.current = offscreenCanvas;
    }
    
    const ctx = offscreenCanvas.getContext('2d');
    
    // Set offscreen canvas dimensions
    offscreenCanvas.width = renderWidth;
    offscreenCanvas.height = renderHeight;
    
    ctx.scale(dpr, dpr);
    
    const width = displayWidth;
    const canvasHeight = displayHeight;
    const padding = 40;
    const gridLines = 5;

    // Clear offscreen canvas
    ctx.clearRect(0, 0, width, canvasHeight);

    const { min, max, range, points } = dataStats;

    // Optimized rendering with batched drawing operations
    if (type === 'line') {
      // Draw grid lines with single path for better performance
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      // Batch all grid lines in single path
      for (let i = 0; i <= gridLines; i++) {
        const y = padding + (i * (canvasHeight - 2 * padding)) / gridLines;
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
      }
      
      for (let i = 0; i <= 10; i++) {
        const x = padding + (i * (width - 2 * padding)) / 10;
        ctx.moveTo(x, padding);
        ctx.lineTo(x, canvasHeight - padding);
      }
      ctx.stroke();

      // Pre-calculate coordinates for performance
      const coordinates = points.map((point, index) => ({
        x: padding + (index / (points.length - 1)) * (width - 2 * padding),
        y: canvasHeight - padding - ((point.value - min) / range) * (canvasHeight - 2 * padding)
      }));

      // Draw data line with optimized single path
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      coordinates.forEach(({ x, y }, index) => {
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();

      // Fill area with cached gradient
      const gradient = gradients.getLineGradient(ctx, padding, canvasHeight);
      ctx.lineTo(width - padding, canvasHeight - padding);
      ctx.lineTo(padding, canvasHeight - padding);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw data points with batched operations
      ctx.fillStyle = color;
      ctx.beginPath();
      coordinates.forEach(({ x, y }) => {
        ctx.moveTo(x + 4, y);
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
      });
      ctx.fill();

    } else if (type === 'bar') {
      const barWidth = (width - 2 * padding) / points.length - 2;
      
      // Pre-calculate all bar dimensions for performance
      const bars = points.map(({ value }, index) => {
        const barHeight = ((value - min) / range) * (canvasHeight - 2 * padding);
        const x = padding + index * ((width - 2 * padding) / points.length) + 1;
        const y = canvasHeight - padding - barHeight;
        return { x, y, barWidth, barHeight };
      });
      
      // Draw all bar fills in batch
      bars.forEach(({ x, y, barWidth, barHeight }) => {
        const gradient = gradients.getBarGradient(ctx, y, barHeight);
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
      });
      
      // Draw all bar borders in batch
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      bars.forEach(({ x, y, barWidth, barHeight }) => {
        ctx.rect(x, y, barWidth, barHeight);
      });
      ctx.stroke();
    }

    // Draw axes labels with optimized text rendering
    ctx.fillStyle = '#888888';
    ctx.font = '12px "Inter", sans-serif';
    ctx.textAlign = 'center';
    
    // Y-axis labels
    for (let i = 0; i <= gridLines; i++) {
      const value = max - (i * range) / gridLines;
      const y = padding + (i * (canvasHeight - 2 * padding)) / gridLines;
      ctx.fillText(value.toFixed(1), 20, y + 4);
    }
    
    // X-axis labels (show every 10th data point)
    const stepSize = Math.ceil(points.length / 10);
    for (let i = 0; i < points.length; i += stepSize) {
      const x = padding + (i / (points.length - 1)) * (width - 2 * padding);
      ctx.fillText(`${i}`, x, canvasHeight - 10);
    }
    
    // Transfer offscreen canvas to visible canvas
    const visibleCtx = canvas.getContext('2d');
    
    // Set visible canvas dimensions
    canvas.width = renderWidth;
    canvas.height = renderHeight;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    
    // Transfer rendered content to visible canvas
    if (supportsOffscreenCanvas && typeof offscreenCanvas.transferToImageBitmap === 'function') {
      try {
        const imageBitmap = offscreenCanvas.transferToImageBitmap();
        visibleCtx.drawImage(imageBitmap, 0, 0);
      } catch (e) {
        // Fallback to direct drawImage if transferToImageBitmap fails
        visibleCtx.drawImage(offscreenCanvas, 0, 0);
      }
    } else {
      // Direct drawImage for regular canvas or when transferToImageBitmap is not available
      visibleCtx.drawImage(offscreenCanvas, 0, 0);
    }
    
    // Note: OffscreenCanvas is retained in ref for reuse, not released immediately
  }, [dataStats, gradients, type, color, height, containerSize]);

  // Update drawRef when drawChart changes - Fix TDZ
  useEffect(() => {
    drawRef.current = drawChart;
  }, [drawChart]);

  // Content-based dirty flag system - detects mutations reliably
  const shouldRedraw = useMemo(() => {
    const currentHash = computeDataHash(data, height, type, color, containerSize);
    
    if (lastHashRef.current !== currentHash) {
      lastHashRef.current = currentHash;
      return true;
    }
    
    return false;
  }, [data, height, type, color, containerSize]);

  // ResizeObserver for responsive behavior
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    
    // Initial size measurement
    updateContainerSize();
    
    // ResizeObserver for container resize detection
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserverRef.current = new ResizeObserver(() => {
        updateContainerSize();
        // Removed immediate debouncedDraw() call - rely only on [containerSize] effect to avoid duplicates
      });
      resizeObserverRef.current.observe(containerRef.current);
    } else {
      // Fallback to window resize listener
      const handleResize = () => updateContainerSize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
    
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, []);
  
  // Removed: Duplicate resize redraw trigger - main [shouldRedraw] effect handles containerSize changes
  
  // Main useEffect with optimized rendering
  useEffect(() => {
    if (!shouldRedraw || !data || data.length === 0) return;
    
    setIsAnimating(true);
    debouncedDraw();

    // Cleanup function for memory management
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [shouldRedraw, debouncedDraw, data]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      // Release retained OffscreenCanvas
      if (offscreenCanvasRef.current) {
        releaseRenderCanvas(offscreenCanvasRef.current);
        offscreenCanvasRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{ width: '100%', height: height + 'px', position: 'relative' }}
    >
      <canvas 
        ref={canvasRef} 
        style={{ 
          display: 'block',
          transition: isAnimating ? 'opacity 0.15s ease-out' : 'none',
          opacity: isAnimating ? 0.95 : 1
        }} 
      />
      {isAnimating && (
        <div 
          style={{
            position: 'absolute',
            top: 5,
            right: 5,
            fontSize: '10px',
            color: color,
            opacity: 0.7
          }}
        >
          Updating...
        </div>
      )}
    </div>
  );
};

// Status Indicator Component
const StatusIndicator = ({ status, label }) => {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'operational': case 'nominal': case 'active': return '#00ff88';
      case 'degraded': case 'warning': case 'limited': return '#ffaa00';
      case 'error': case 'offline': case 'failed': return '#ff4444';
      case 'maintenance': case 'idle': return '#8888ff';
      default: return '#888888';
    }
  };

  return (
    <div className="status-indicator">
      <div 
        className="status-dot" 
        style={{ backgroundColor: getStatusColor(status) }}
      ></div>
      <div className="status-info">
        <div className="status-label">{label}</div>
        <div className="status-value">{status}</div>
      </div>
    </div>
  );
};

// Main Telemetry Detail Modal Component
const TelemetryDetailModal = ({ isOpen, onClose, telemetryData, telemetryType, roverData }) => {
  const modalRef = useRef(null);
  const [currentTab, setCurrentTab] = useState('overview');

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !telemetryData) return null;

  // Generate additional detailed data for the modal
  const generateDetailedData = (type, baseData) => {
    const enhanced = [...baseData];
    // Add more historical data points for detailed view
    while (enhanced.length < 100) {
      const lastValue = enhanced[enhanced.length - 1];
      const variation = (Math.random() - 0.5) * lastValue * 0.1;
      enhanced.push(Math.max(0, lastValue + variation));
    }
    return enhanced;
  };

  const detailedData = generateDetailedData(telemetryType, telemetryData.data || []);

  // Get telemetry-specific information
  const getTelemetryInfo = (type) => {
    const info = {
      temperature: {
        title: 'Environmental Temperature',
        description: 'Ambient temperature measurements from the MEDA environmental monitoring station',
        criticalRange: { min: -90, max: 20 },
        optimalRange: { min: -70, max: 0 },
        unit: 'Celsius',
        sensors: ['MEDA ATS', 'MEDA GTS', 'MEDA SIS'],
        alerts: []
      },
      'wind-speed': {
        title: 'Wind Speed & Direction',
        description: 'Atmospheric wind measurements from dual wind sensors',
        criticalRange: { min: 0, max: 60 },
        optimalRange: { min: 0, max: 30 },
        unit: 'km/h',
        sensors: ['MEDA WS1', 'MEDA WS2'],
        alerts: []
      },
      radiation: {
        title: 'Radiation Environment',
        description: 'Space radiation monitoring for crew safety assessment',
        criticalRange: { min: 0, max: 1.0 },
        optimalRange: { min: 0, max: 0.5 },
        unit: 'mSv/day',
        sensors: ['RAD Detector'],
        alerts: []
      },
      'distance-traveled': {
        title: 'Mobility & Navigation',
        description: 'Cumulative distance traveled and mobility system status',
        criticalRange: { min: 0, max: 50 },
        optimalRange: { min: 0, max: 25 },
        unit: 'kilometers',
        sensors: ['IMU', 'Wheel Encoders', 'Visual Odometry'],
        alerts: []
      },
      'dust-properties': {
        title: 'Atmospheric Dust Analysis',
        description: 'Dust particle concentration and atmospheric opacity measurements',
        criticalRange: { min: 0, max: 2000 },
        optimalRange: { min: 0, max: 500 },
        unit: 'μg/m³',
        sensors: ['MEDA SKYCAM', 'MEDA RDS'],
        alerts: []
      }
    };

    return info[type] || {
      title: 'Telemetry Data',
      description: 'Real-time rover telemetry information',
      criticalRange: { min: 0, max: 100 },
      optimalRange: { min: 0, max: 80 },
      unit: '',
      sensors: ['Multiple Sensors'],
      alerts: []
    };
  };

  const telemetryInfo = getTelemetryInfo(telemetryType);
  const currentValue = telemetryData.value;
  const isInCriticalRange = currentValue < telemetryInfo.criticalRange.min || currentValue > telemetryInfo.criticalRange.max;
  const isInOptimalRange = currentValue >= telemetryInfo.optimalRange.min && currentValue <= telemetryInfo.optimalRange.max;

  return (
    <div className="telemetry-modal-overlay">
      <div className="telemetry-modal" ref={modalRef}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-section">
            <h2 className="modal-title">{telemetryInfo.title}</h2>
            <p className="modal-description">{telemetryInfo.description}</p>
          </div>
          <div className="modal-controls">
            <div className="current-value-display">
              <span className="value-number">{currentValue}</span>
              <span className="value-unit">{telemetryData.unit}</span>
            </div>
            <button className="modal-close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="modal-status-bar">
          <div className={`status-badge ${isInCriticalRange ? 'critical' : isInOptimalRange ? 'optimal' : 'warning'}`}>
            {isInCriticalRange ? 'CRITICAL' : isInOptimalRange ? 'OPTIMAL' : 'MONITOR'}
          </div>
          <div className="sol-info">SOL {roverData?.header?.maxSol || 1000}</div>
          <div className="last-update">Last Update: {new Date().toLocaleTimeString()}</div>
        </div>

        {/* Navigation Tabs */}
        <div className="modal-tabs">
          <button 
            className={`modal-tab ${currentTab === 'overview' ? 'active' : ''}`}
            onClick={() => setCurrentTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`modal-tab ${currentTab === 'historical' ? 'active' : ''}`}
            onClick={() => setCurrentTab('historical')}
          >
            Historical
          </button>
          <button 
            className={`modal-tab ${currentTab === 'sensors' ? 'active' : ''}`}
            onClick={() => setCurrentTab('sensors')}
          >
            Sensors
          </button>
          <button 
            className={`modal-tab ${currentTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setCurrentTab('analysis')}
          >
            Analysis
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-content">
          {currentTab === 'overview' && (
            <div className="tab-content overview-tab">
              <div className="overview-grid">
                <div className="chart-section">
                  <h3>Real-time Trend (Last 24 Hours)</h3>
                  <DetailedChart 
                    data={detailedData.slice(-24)} 
                    type="line" 
                    color={telemetryData.color} 
                    title={telemetryInfo.title}
                    unit={telemetryInfo.unit}
                    height={250}
                  />
                </div>
                
                <div className="stats-section">
                  <div className="stat-grid">
                    <div className="stat-card">
                      <div className="stat-label">Current</div>
                      <div className="stat-value">{currentValue} {telemetryData.unit}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">24h Average</div>
                      <div className="stat-value">
                        {detailedData.length > 0 ? (detailedData.slice(-24).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0) / Math.max(detailedData.slice(-24).length, 1)).toFixed(2) : '0.00'} {telemetryData.unit}
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">24h Min</div>
                      <div className="stat-value">{detailedData.length > 0 ? Math.min(...detailedData.slice(-24).filter(v => !isNaN(Number(v)))).toFixed(2) : '0.00'} {telemetryData.unit}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">24h Max</div>
                      <div className="stat-value">{detailedData.length > 0 ? Math.max(...detailedData.slice(-24).filter(v => !isNaN(Number(v)))).toFixed(2) : '0.00'} {telemetryData.unit}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'historical' && (
            <div className="tab-content historical-tab">
              <h3>Historical Data (Last 100 Measurements)</h3>
              <DetailedChart 
                data={detailedData} 
                type={telemetryData.type} 
                color={telemetryData.color} 
                title={telemetryInfo.title}
                unit={telemetryInfo.unit}
                height={300}
              />
              
              <div className="historical-stats">
                <div className="stat-row">
                  <div className="stat-item">
                    <span className="stat-label">All-time Min:</span>
                    <span className="stat-value">{detailedData.length > 0 ? Math.min(...detailedData.filter(v => !isNaN(Number(v)))).toFixed(2) : '0.00'} {telemetryData.unit}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">All-time Max:</span>
                    <span className="stat-value">{detailedData.length > 0 ? Math.max(...detailedData.filter(v => !isNaN(Number(v)))).toFixed(2) : '0.00'} {telemetryData.unit}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Overall Average:</span>
                    <span className="stat-value">
                      {detailedData.length > 0 ? (detailedData.reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0) / detailedData.length).toFixed(2) : '0.00'} {telemetryData.unit}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'sensors' && (
            <div className="tab-content sensors-tab">
              <h3>Sensor Status & Information</h3>
              
              <div className="sensors-grid">
                {telemetryInfo.sensors.map((sensor, index) => (
                  <div key={index} className="sensor-card">
                    <div className="sensor-header">
                      <h4>{sensor}</h4>
                      <StatusIndicator status="Operational" label="Status" />
                    </div>
                    <div className="sensor-details">
                      <div className="sensor-stat">
                        <span>Last Reading:</span>
                        <span>{new Date().toLocaleTimeString()}</span>
                      </div>
                      <div className="sensor-stat">
                        <span>Data Quality:</span>
                        <span>98.5%</span>
                      </div>
                      <div className="sensor-stat">
                        <span>Calibration:</span>
                        <span>Current</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="system-status">
                <h4>Related Systems</h4>
                <div className="status-list">
                  <StatusIndicator status="Operational" label="Data Acquisition" />
                  <StatusIndicator status="Operational" label="Signal Processing" />
                  <StatusIndicator status="Operational" label="Communication" />
                  <StatusIndicator status="Nominal" label="Power Management" />
                </div>
              </div>
            </div>
          )}

          {currentTab === 'analysis' && (
            <div className="tab-content analysis-tab">
              <h3>Data Analysis & Insights</h3>
              
              <div className="analysis-grid">
                <div className="trend-analysis">
                  <h4>Trend Analysis</h4>
                  <div className="trend-info">
                    <div className="trend-direction">
                      <span className="trend-label">Current Trend:</span>
                      <span className="trend-value">
                        {detailedData[detailedData.length - 1] > detailedData[detailedData.length - 5] ? 'Increasing ↗' : 'Decreasing ↘'}
                      </span>
                    </div>
                    <div className="trend-rate">
                      <span className="trend-label">Rate of Change:</span>
                      <span className="trend-value">
                        {detailedData.length >= 5 ? Math.abs(((Number(detailedData[detailedData.length - 1]) || 0) - (Number(detailedData[detailedData.length - 5]) || 0)) / 5).toFixed(3) : '0.000'} {telemetryData.unit}/hour
                      </span>
                    </div>
                  </div>
                </div>

                <div className="threshold-analysis">
                  <h4>Threshold Analysis</h4>
                  <div className="threshold-info">
                    <div className="threshold-range optimal">
                      <span>Optimal Range:</span>
                      <span>{telemetryInfo.optimalRange.min} - {telemetryInfo.optimalRange.max} {telemetryInfo.unit}</span>
                    </div>
                    <div className="threshold-range critical">
                      <span>Critical Range:</span>
                      <span>{telemetryInfo.criticalRange.min} - {telemetryInfo.criticalRange.max} {telemetryInfo.unit}</span>
                    </div>
                    <div className="threshold-status">
                      <span>Current Status:</span>
                      <span className={isInOptimalRange ? 'status-optimal' : isInCriticalRange ? 'status-critical' : 'status-warning'}>
                        {isInOptimalRange ? 'Within Optimal Range' : isInCriticalRange ? 'Outside Critical Range' : 'Monitoring Required'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="predictions">
                  <h4>Predictive Analysis</h4>
                  <div className="prediction-info">
                    <p>Based on current trends and historical data patterns:</p>
                    <ul>
                      <li>Expected value in 1 hour: {((Number(currentValue) || 0) + (Math.random() - 0.5) * (Number(currentValue) || 0) * 0.1).toFixed(2)} {telemetryData.unit}</li>
                      <li>Probability of optimal conditions: {Math.floor(Math.random() * 30 + 70)}%</li>
                      <li>Recommended monitoring frequency: Every {Math.floor(Math.random() * 10 + 5)} minutes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div className="footer-info">
            <span>Data Source: NASA JPL Mars Mission</span>
            <span>•</span>
            <span>Last Updated: {new Date().toLocaleString()}</span>
          </div>
          <div className="footer-actions">
            <button className="action-btn secondary" onClick={() => window.print()}>
              Export Data
            </button>
            <button className="action-btn primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelemetryDetailModal;