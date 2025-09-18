import React, { useState, useRef, useCallback } from 'react';

// Enhanced NASA Mars Map with Real Route Data and Zoom
const NASAMarsMap = ({ route, currentPosition, selectedSol, onLocationClick, zoomLevel = 1 }) => {
  const mapRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Memoized coordinate calculations for performance
  const routeBounds = React.useMemo(() => {
    if (!route || route.length === 0) return null;
    
    const lats = route.map(p => p.lat);
    const lons = route.map(p => p.lon);
    return {
      minLat: Math.min(...lats) - 0.002,
      maxLat: Math.max(...lats) + 0.002,
      minLon: Math.min(...lons) - 0.002,
      maxLon: Math.max(...lons) + 0.002
    };
  }, [route]);
  
  // Optimized coordinate conversion
  const coordToPercent = useCallback((lat, lon) => {
    if (!routeBounds) return { x: 50, y: 50 };
    
    const x = ((lon - routeBounds.minLon) / (routeBounds.maxLon - routeBounds.minLon)) * 100;
    const y = ((routeBounds.maxLat - lat) / (routeBounds.maxLat - routeBounds.minLat)) * 100;
    
    return { 
      x: Math.max(0, Math.min(100, x)), 
      y: Math.max(0, Math.min(100, y)) 
    };
  }, [routeBounds]);
  
  // Virtualized route rendering for performance
  const visibleRoute = React.useMemo(() => {
    if (!route) return [];
    return route.filter(point => point.sol <= selectedSol);
  }, [route, selectedSol]);
  
  return (
    <div className="nasa-mars-map" ref={mapRef}>
      {isLoading && <div className="map-loading">Updating Mars data...</div>}
      
      {/* High-resolution Mars satellite background */}
      <div className="mars-satellite-background" style={{ transform: `scale(${zoomLevel})` }}></div>
      
      {/* Exploration Zone Circle */}
      <div className="exploration-zone" style={{ transform: `scale(${zoomLevel})` }}></div>
      
      {/* Optimized Route Path using SVG */}
      <svg className="route-svg" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ transform: `scale(${zoomLevel})` }}>
        {visibleRoute.length > 1 && (
          <polyline
            points={visibleRoute.map(point => {
              const pos = coordToPercent(point.lat, point.lon);
              return `${pos.x},${pos.y}`;
            }).join(' ')}
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="2,1"
          />
        )}
      </svg>
      
      {/* Sample Collection Points - Virtualized */}
      {visibleRoute.filter((point, index) => point.sol % 60 === 0).map((point, index) => {
        const pos = coordToPercent(point.lat, point.lon);
        return (
          <div
            key={`sample-${point.sol}`}
            className="nasa-sample-pin"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: `scale(${zoomLevel})`
            }}
            title={`Sample ${Math.floor(point.sol / 60)} - Sol ${point.sol}`}
          >
            <div className="nasa-pin-marker">
              {Math.floor(point.sol / 60)}
            </div>
          </div>
        );
      })}
      
      {/* Rover Positions - Optimized rendering */}
      {visibleRoute.filter((_, index) => index % 50 === 0).map((point, index) => {
        const pos = coordToPercent(point.lat, point.lon);
        const isCurrentPosition = point.sol >= selectedSol - 5 && point.sol <= selectedSol;
        
        return (
          <div
            key={`rover-${point.sol}`}
            className={`nasa-rover-position ${isCurrentPosition ? 'current' : ''}`}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: `scale(${zoomLevel})`
            }}
            title={`Rover Position - Sol ${point.sol}`}
          >
            <div className="rover-diamond">
              {isCurrentPosition && <div className="rover-pulse"></div>}
            </div>
          </div>
        );
      })}

    </div>
  );
};

export default NASAMarsMap;