import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import TelemetryDetailModal from './components/TelemetryDetailModal';
import NASACameraGallery from './components/NASACameraGallery';
import AdvancedMissionTimeline from './components/AdvancedMissionTimeline';
import NASAMarsMap from './components/NASAMarsMap';
import { SkeletonLoader, TelemetryCardSkeleton, MapSkeleton, ImageSkeleton } from './components/SkeletonLoaders';
import NASANotifications from './components/NASANotifications';
import LoadingScreen from './components/common/LoadingScreen';
import ErrorScreen from './components/common/ErrorScreen';
import Header from './components/layout/Header';
import TelemetryPanel from './components/telemetry/TelemetryPanel';

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
    return <LoadingScreen />;
  }
  
  if (error) {
    return <ErrorScreen error={error} onRetry={() => fetchRoverData()} />;
  }
  
  if (!roverData) return null;
  
  // Create telemetryData object to pass all data arrays
  const telemetryData = {
    tempData,
    windData,
    radiationData,
    distanceData,
    dustData,
    batteryData,
    powerData,
    pressureData,
    commData
  };
  
  return (
    <div className="nasa-app">
      {/* Real-time Notifications */}
      <NASANotifications 
        notifications={notifications} 
        onDismiss={handleNotificationDismiss} 
      />
      

      
      {/* NASA Header with Real-time Status */}
      <Header roverData={roverData} />

      {/* Main Interface */}
      <div className="nasa-main">
        {/* Left Panel - Enhanced Telemetry */}
        <TelemetryPanel
          leftPanelCollapsed={leftPanelCollapsed}
          telemetryMode={telemetryMode}
          isLiveMode={isLiveMode}
          telemetryGroup={telemetryGroup}
          setTelemetryGroup={setTelemetryGroup}
          handleTelemetryCardClick={handleTelemetryCardClick}
          telemetryData={telemetryData}
          roverData={roverData}
          loading={loading}
        />

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
          {/* {!loading && (
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
          )} */}
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