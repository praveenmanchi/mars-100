import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import TelemetryDetailModal from './components/TelemetryDetailModal';
import NASACameraGallery from './components/NASACameraGallery';
import AdvancedMissionTimeline from './components/AdvancedMissionTimeline';
import NASAMarsMap from './components/NASAMarsMap';
import NASATelemetryCard from './components/NASATelemetryCard';
import { SkeletonLoader, TelemetryCardSkeleton, MapSkeleton, ImageSkeleton } from './components/SkeletonLoaders';
import NASANotifications from './components/NASANotifications';

import './animations.css';
import { getRoverData } from './api/roverData';
import AdvancedFeaturesOverlay from './components/AdvancedFeaturesOverlay';
import unifiedCache from './api/unifiedCacheSystem.js';

// Live update interval for real-time data refreshing (30 seconds)
const LIVE_UPDATE_INTERVAL = 30000;

// Performance monitoring for App-level operations
const appPerformanceMetrics = {
  renderTime: [],
  dataFetchTime: [],
  cacheHits: 0,
  cacheMisses: 0,
  errors: 0
};






// Main App with Real-time Updates
function App() {
  const [roverData, setRoverData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSol, setSelectedSol] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [telemetryMode, setTelemetryMode] = useState('vertical'); // 'vertical' or 'horizontal'
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [telemetryGroup, setTelemetryGroup] = useState('all'); // 'all', 'environmental', 'systems', 'atmospheric'
  const [mapZoomLevel, setMapZoomLevel] = useState(1);
  const [mapZoomMemory, setMapZoomMemory] = useState({});
  
  // Modal state management
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTelemetryData, setModalTelemetryData] = useState(null);
  const [modalTelemetryType, setModalTelemetryType] = useState(null);
  
  // Handle telemetry card click to open modal
  const handleTelemetryCardClick = (telemetryData, telemetryType) => {
    setModalTelemetryData(telemetryData);
    setModalTelemetryType(telemetryType);
    setModalOpen(true);
  };
  
  // Handle modal close
  const handleModalClose = () => {
    setModalOpen(false);
    setModalTelemetryData(null);
    setModalTelemetryType(null);
  };
  
  // Optimized data fetching with unified cache and performance monitoring
  const fetchRoverData = useCallback(async (sol = null, forceRefresh = false) => {
    const startTime = Date.now();
    
    try {
      setLoading(true);
      const cacheKey = `rover-data-${sol || 'latest'}`;
      
      // Use unified cache with automatic request deduplication
      let response;
      if (forceRefresh) {
        // Force refresh: clear cache and fetch new data
        unifiedCache.invalidate(cacheKey);
        response = await getRoverData(sol);
        appPerformanceMetrics.cacheMisses++;
      } else {
        // Check unified cache first
        const cached = unifiedCache.get(cacheKey);
        if (cached) {
          response = cached;
          appPerformanceMetrics.cacheHits++;
        } else {
          response = await getRoverData(sol);
          appPerformanceMetrics.cacheMisses++;
        }
      }
      
      setRoverData(response);
      setSelectedSol(response.header.sol);
      setError(null);
      setLastUpdateTime(new Date());
      
      // Record performance metrics
      const fetchTime = Date.now() - startTime;
      appPerformanceMetrics.dataFetchTime.push({
        timestamp: Date.now(),
        duration: fetchTime,
        sol,
        cacheHit: !!unifiedCache.get(cacheKey)
      });
      
    } catch (err) {
      console.error('Error fetching rover data:', err);
      setError('Failed to load Mars rover data - Connection issues or rate limiting');
      appPerformanceMetrics.errors++;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Auto-refresh for live mode with discovery simulation  
  useEffect(() => {
    if (!isLiveMode) return;
    
    const interval = setInterval(() => {
      fetchRoverData(selectedSol, true); // Force refresh for live data
      
      // Simulate discoveries occasionally (5% chance)
      if (Math.random() < 0.05 && selectedSol) {
        const discoveries = [
          {
            type: 'discovery',
            title: 'GEOLOGICAL FORMATION DETECTED',
            message: 'Unusual rock stratification pattern identified via SUPERCAM analysis',
            sol: selectedSol
          },
          {
            type: 'sample',
            title: 'SAMPLE COLLECTION CANDIDATE',
            message: 'High-priority target identified for future drilling operation',
            sol: selectedSol
          },
          {
            type: 'data',
            title: 'ATMOSPHERIC ANOMALY',
            message: 'Unexpected methane trace detected in current atmospheric readings',
            sol: selectedSol
          }
        ];
        
        const randomDiscovery = discoveries[Math.floor(Math.random() * discoveries.length)];
        setNotifications(prev => [...prev.slice(-2), randomDiscovery]); // Keep only last 3
      }
    }, LIVE_UPDATE_INTERVAL);
    
    return () => clearInterval(interval);
  }, [selectedSol, isLiveMode, fetchRoverData]);
  
  const handleSolChange = useCallback((newSol, forceRefresh = false) => {
    if (newSol !== selectedSol) {
      // Save current zoom level for the current SOL
      if (selectedSol !== null) {
        setMapZoomMemory(prev => ({
          ...prev,
          [selectedSol]: mapZoomLevel
        }));
      }
      
      // Restore zoom level for the new SOL
      const savedZoom = mapZoomMemory[newSol];
      if (savedZoom) {
        setMapZoomLevel(savedZoom);
      }
      
      fetchRoverData(newSol, forceRefresh);
    }
  }, [selectedSol, fetchRoverData, mapZoomLevel, mapZoomMemory]);
  
  const handleLocationClick = useCallback((location) => {
    // Handle location click interaction
  }, []);
  
  const handleNotificationDismiss = useCallback((index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  // Map zoom controls
  const handleZoomIn = useCallback(() => {
    setMapZoomLevel(prev => Math.min(prev * 1.2, 3));
  }, []);
  
  const handleZoomOut = useCallback(() => {
    setMapZoomLevel(prev => Math.max(prev / 1.2, 0.5));
  }, []);
  
  const handleResetZoom = useCallback(() => {
    setMapZoomLevel(1);
  }, []);
  
  // Generate optimized telemetry data - Move all hooks before conditional returns
  const generateTelemetryData = useCallback((baseValue, variation, sols = 50) => {
    return Array.from({length: sols}, (_, i) => {
      const sol = Math.max(0, selectedSol - sols + i + 1);
      return Math.max(0, baseValue + variation * Math.sin(sol * 0.1) + (Math.random() - 0.5) * variation * 0.2);
    });
  }, [selectedSol]);
  
  const tempData = React.useMemo(() => generateTelemetryData(203, 20), [generateTelemetryData]);
  const windData = React.useMemo(() => generateTelemetryData(32, 15), [generateTelemetryData]);
  const radiationData = React.useMemo(() => generateTelemetryData(203, 30), [generateTelemetryData]);
  const distanceData = React.useMemo(() => generateTelemetryData(2, 0.5), [generateTelemetryData]);
  const dustData = React.useMemo(() => generateTelemetryData(150, 80), [generateTelemetryData]);
  const batteryData = React.useMemo(() => generateTelemetryData(92, 8), [generateTelemetryData]);
  const powerData = React.useMemo(() => generateTelemetryData(410, 50), [generateTelemetryData]);
  const pressureData = React.useMemo(() => generateTelemetryData(6.35, 0.8), [generateTelemetryData]);
  const commData = React.useMemo(() => generateTelemetryData(90, 10), [generateTelemetryData]);

  useEffect(() => {
    fetchRoverData();
  }, [fetchRoverData]);
  
  // Conditional returns AFTER all hooks
  if (loading) {
    return (
      <div className="nasa-loading">
        <div className="loading-container">
          <div className="nasa-loading-spinner"></div>
          <div className="loading-text">
            <div className="primary-text">NASA MARS MISSION CONTROL</div>
            <div className="secondary-text">Establishing real-time connection to Perseverance rover...</div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="nasa-error">
        <div className="error-container">
          <div className="error-icon">⚠</div>
          <div className="error-text">
            <div className="error-title">{error}</div>
            <div className="error-subtitle">Unable to establish communication link</div>
          </div>
          <button onClick={() => fetchRoverData()} className="nasa-button">
            RETRY CONNECTION
          </button>
        </div>
      </div>
    );
  }
  
  if (!roverData) return null;
  
  return (
    <div className="nasa-app">
      {/* Real-time Notifications */}
      <NASANotifications 
        notifications={notifications} 
        onDismiss={handleNotificationDismiss} 
      />
      

      
      {/* NASA Header with Real-time Status */}
      <header className="nasa-header">
        <div className="header-left">
          <div className="nasa-logo">NASA</div>
          <div className="mission-info">
            <div className="mission-name">MARS PERSEVERANCE</div>
            <div className="mission-location">JPL • JEZERO CRATER • MARS</div>
          </div>
        </div>
        
        <div className="header-right">
          <div className="status-group">
            <div className="status-item">
              <div className="status-label">MISSION SOL</div>
              <div className="status-value">{roverData.header.maxSol}</div>
            </div>
            <div className="status-item">
              <div className="status-label">TOTAL DISTANCE</div>
              <div className="status-value">{roverData.header.totalDistance} km</div>
            </div>
            <div className="status-item">
              <div className="status-label">SYSTEM STATUS</div>
              <div className={`status-value status-${roverData.header.status.toLowerCase()}`}>
                {roverData.header.status}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Interface */}
      <div className="nasa-main">
        {/* Left Panel - Enhanced Telemetry */}
        <div className={`nasa-left-panel ${leftPanelCollapsed ? 'collapsed' : ''} ${telemetryMode === 'horizontal' ? 'horizontal-mode' : ''}`}>
          <div className="panel-header">
            <h3>TELEMETRY DATA</h3>
            <div className={`live-indicator ${isLiveMode ? 'live' : 'offline'}`}>
              {isLiveMode ? 'LIVE' : 'OFFLINE'}
            </div>
          </div>
          
          {/* Telemetry Grouping Tabs */}
          <div className="telemetry-tabs">
            <button 
              className={`telemetry-tab ${telemetryGroup === 'all' ? 'active' : ''}`}
              onClick={() => setTelemetryGroup('all')}
            >
              ALL
            </button>
            <button 
              className={`telemetry-tab ${telemetryGroup === 'environmental' ? 'active' : ''}`}
              onClick={() => setTelemetryGroup('environmental')}
            >
              ENV
            </button>
            <button 
              className={`telemetry-tab ${telemetryGroup === 'systems' ? 'active' : ''}`}
              onClick={() => setTelemetryGroup('systems')}
            >
              SYS
            </button>
            <button 
              className={`telemetry-tab ${telemetryGroup === 'atmospheric' ? 'active' : ''}`}
              onClick={() => setTelemetryGroup('atmospheric')}
            >
              ATM
            </button>
          </div>
          
          <div className="telemetry-stack">
            {loading ? (
              <>
                <TelemetryCardSkeleton />
                <TelemetryCardSkeleton />
                <TelemetryCardSkeleton />
                <TelemetryCardSkeleton />
                <TelemetryCardSkeleton />
              </>
            ) : (
              <>
                {(telemetryGroup === 'all' || telemetryGroup === 'environmental') && (
                  <NASATelemetryCard
                title="Temperature"
                value={Math.round((roverData.overlays?.metrics?.temperature || -63) + 273)}
                unit={`K (${Math.round(roverData.overlays?.metrics?.temperature || -63)}°C)`}
                data={tempData}
                color="#00ff88"
                type="line"
                subtitle="AVERAGE 200K | RANGE 180K-220K"
                isLive={isLiveMode}
                onClick={handleTelemetryCardClick}
                telemetryType="temperature"
              />
            )}
            
            {(telemetryGroup === 'all' || telemetryGroup === 'environmental') && (
              <NASATelemetryCard
                title="Wind Speed"
                value={Math.round((roverData.overlays?.metrics?.wind_speed || 8.9) * 3.6)}
                unit="KMH"
                data={windData}
                color="#0ea5e9"
                type="bar"
                subtitle="MAX 45 KMH | DIR NE"
                isLive={isLiveMode}
                onClick={handleTelemetryCardClick}
                telemetryType="wind-speed"
              />
            )}
            
            {(telemetryGroup === 'all' || telemetryGroup === 'systems') && (
              <NASATelemetryCard
                title="Radiation"
                value={(roverData.overlays?.metrics?.radiation || 0.24).toFixed(2)}
                unit="mSv/day"
                data={radiationData}
                color="#f59e0b"
                type="bar"
                subtitle="LEVEL NORMAL | SAFE RANGE"
                isLive={isLiveMode}
                onClick={handleTelemetryCardClick}
                telemetryType="radiation"
              />
            )}
            
            {(telemetryGroup === 'all' || telemetryGroup === 'systems') && (
              <NASATelemetryCard
                title="Distance Traveled"
                value={(roverData.overlays?.metrics?.distance_traveled || 2.0).toFixed(1)}
                unit="km total"
                data={distanceData}
                color="#10b981"
                type="line"
                subtitle="CUMULATIVE DISTANCE"
                isLive={isLiveMode}
                onClick={handleTelemetryCardClick}
                telemetryType="distance-traveled"
              />
            )}
            
            {(telemetryGroup === 'all' || telemetryGroup === 'atmospheric') && (
              <NASATelemetryCard
                title="Dust Properties"
                value={Math.round(dustData[dustData.length - 1] || 0)}  
                unit="μg/m³"
                data={dustData}
                color="#8b5cf6"
                type="bar"
                subtitle="ATMOSPHERIC DUST LEVEL | OPACITY 0.8"
                isLive={isLiveMode}
                onClick={handleTelemetryCardClick}
                telemetryType="dust-properties"
              />
            )}
            
            {(telemetryGroup === 'all' || telemetryGroup === 'systems') && (
              <NASATelemetryCard
                title="Battery Charge"
                value={Math.round(roverData.overlays?.metrics?.battery_charge || 92)}
                unit="%"
                data={batteryData}
                color="#e11d48"
                type="line"
                subtitle="POWER SYSTEM NOMINAL"
                isLive={isLiveMode}
                onClick={handleTelemetryCardClick}
                telemetryType="battery-charge"
              />
            )}
            
            {(telemetryGroup === 'all' || telemetryGroup === 'systems') && (
              <NASATelemetryCard
                title="Power Generation"
                value={Math.round(roverData.overlays?.metrics?.power_generation || 410)}
                unit="Watts"
                data={powerData}
                color="#f59e0b"
                type="bar"
                subtitle="SOLAR ARRAY EFFICIENCY 98%"
                isLive={isLiveMode}
                onClick={handleTelemetryCardClick}
                telemetryType="power-generation"
              />
            )}
            
            {(telemetryGroup === 'all' || telemetryGroup === 'atmospheric') && (
              <NASATelemetryCard
                title="Atmospheric Pressure"
                value={(roverData.overlays?.metrics?.atmospheric_pressure || 6.35).toFixed(2)}
                unit="mbar"
                data={pressureData}
                color="#06b6d4"
                type="line"
                subtitle="SEASONAL VARIATION NOMINAL"
                isLive={isLiveMode}
                onClick={handleTelemetryCardClick}
                telemetryType="atmospheric-pressure"
              />
            )}
            
            {(telemetryGroup === 'all' || telemetryGroup === 'systems') && (
              <NASATelemetryCard
                title="Communications"
                value={Math.floor(Math.random() * 100 + 85)}
                unit="% Signal"
                data={commData}
                color="#10b981"
                type="bar"
                subtitle="UPLINK/DOWNLINK NOMINAL"
                isLive={isLiveMode}
                onClick={handleTelemetryCardClick}
                telemetryType="communications"
              />
            )}
              </>
            )}
          </div>
        </div>

        {/* Center Panel - NASA Mars Map */}
        <div className="nasa-center-panel">
          <div className="map-header">
            <div className="map-info">
              <div className="map-title">SURFACE OPERATIONS MAP</div>
              <div className="map-coordinates">
                {roverData?.map?.current_position?.lat?.toFixed(4) || '0.0000'}°N, {roverData?.map?.current_position?.lon?.toFixed(4) || '0.0000'}°E | Elevation: 4559 M
              </div>
            </div>
          </div>
          
          {loading ? (
            <MapSkeleton />
          ) : (
            <NASAMarsMap 
              route={roverData.map.route}
              currentPosition={roverData.map.current_position}
              selectedSol={selectedSol}
              onLocationClick={handleLocationClick}
              zoomLevel={mapZoomLevel}
            />
          )}
          
          {/* Map Zoom Controls */}
          {!loading && (
            <div className="map-zoom-controls">
              <button className="zoom-btn" onClick={handleZoomIn} title="Zoom In">
                +
              </button>
              <button className="zoom-btn" onClick={handleResetZoom} title="Reset Zoom">
                ⌂
              </button>
              <button className="zoom-btn" onClick={handleZoomOut} title="Zoom Out">
                −
              </button>
              <div className="zoom-level">
                {Math.round(mapZoomLevel * 100)}%
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Camera Systems */}
        <div className={`nasa-right-panel ${rightPanelCollapsed ? 'collapsed' : ''}`}>
          {loading ? (
            <div className="nasa-camera-section">
              <div className="section-header">
                <h3>CAMERA SYSTEMS</h3>
                <div className="image-count">Loading...</div>
              </div>
              <div className="nasa-camera-grid-enhanced">
                <ImageSkeleton />
                <ImageSkeleton />
                <ImageSkeleton />
                <ImageSkeleton />
                <ImageSkeleton />
                <ImageSkeleton />
              </div>
            </div>
          ) : (
            <NASACameraGallery cameras={roverData.cameras} />
          )}
        </div>
      </div>

      {/* ADVANCED MISSION TIMELINE - Fixed Bottom */}
      <div className="nasa-timeline-container">
        <AdvancedMissionTimeline 
          sols={roverData.timeline.sols}
          selectedSol={selectedSol}
          onSolChange={handleSolChange}
        />
      </div>

      {/* ADVANCED FEATURES OVERLAY */}
      <AdvancedFeaturesOverlay 
        roverData={roverData}
        selectedSol={selectedSol}
        onSolChange={handleSolChange}
      />
      
      {/* Attribution Footer */}
      <div className="attribution-footer" style={{
        position: 'fixed',
        bottom: '10px',
        right: '20px',
        fontSize: '12px',
        color: '#64748b',
        fontFamily: '"Orbitron", monospace',
        zIndex: 10
      }}>
        <a 
          href="https://www.linkedin.com/in/praveenmanchi/" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            color: '#3b82f6',
            textDecoration: 'none',
            opacity: 0.8
          }}
        >
          Created by Praveen Manchi
        </a>
      </div>
      
      {/* Telemetry Detail Modal */}
      <TelemetryDetailModal 
        isOpen={modalOpen}
        onClose={handleModalClose}
        telemetryData={modalTelemetryData}
        telemetryType={modalTelemetryType}
        roverData={roverData}
      />
    </div>
  );
}

export default App;