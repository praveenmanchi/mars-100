import React, { useState, useRef, useEffect, useCallback } from 'react';
import L from 'leaflet';
import 'proj4leaflet';
import 'leaflet/dist/leaflet.css';
import './EnhancedNASAMarsMap.css';

// Import our NASA Trek service and mission data
import { nasaTrekService, MARS_TILE_LAYERS, selectOptimalLayer, MARS_CRS } from '../services/nasaTrekService.js';
import { getBestMarsLayer } from '../services/simpleMarsMap.js';
import { MISSION_EVENTS, getMissionPhase, generateRoverPath } from '../data/missionTimeline.js';

// Fix for default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAyNCAzNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDNjNS41MjMgMCAxMCA0LjQ3NyAxMCAxMCAwIDUuNTIzLTEwIDIwLTEwIDIwcy0xMC0xNC40NzctMTAtMjBjMC01LjUyMyA0LjQ3Ny0xMCAxMC0xMHoiIGZpbGw9IiNGRjQ0NDQiIHN0cm9rZT0iIzAwMDAiIHN0cm9rZS13aWR0aD0iMiIvPgo8Y2lyY2xlIGN4PSIxMiIgY3k9IjEzIiByPSI0IiBmaWxsPSIjRkZGRkZGIi8+Cjwvc3ZnPgo=',
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAyNCAzNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDNjNS41MjMgMCAxMCA0LjQ3NyAxMCAxMCAwIDUuNTIzLTEwIDIwLTEwIDIwcy0xMC0xNC40NzctMTAtMjBjMC01LjUyMyA0LjQ3Ny0xMCAxMC0xMHoiIGZpbGw9IiNGRjQ0NDQiIHN0cm9rZT0iIzAwMDAiIHN0cm9rZS13aWR0aD0iMiIvPgo8Y2lyY2xlIGN4PSIxMiIgY3k9IjEzIiByPSI0IiBmaWxsPSIjRkZGRkZGIi8+Cjwvc3ZnPgo=',
  shadowUrl: ''
});

// Enhanced NASA Mars Map Component with Real Trek Integration
const NASAMarsMap = ({ 
  route, 
  currentPosition, 
  selectedSol, 
  onLocationClick, 
  onEventClick,
  autoCenter = true,
  showControls = true,
  zoomLevel // Legacy prop for backward compatibility
}) => {
  // State management
  const [map, setMap] = useState(null);
  const [currentLayer, setCurrentLayer] = useState('themis_day_ir');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [mapZoomLevel, setMapZoomLevel] = useState(10);
  const [layerSwitcherOpen, setLayerSwitcherOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [routePath, setRoutePath] = useState(null);
  
  // Refs
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const tileLayersRef = useRef({});
  const markersRef = useRef([]);
  const zoomControlRef = useRef(null);

  // Generate rover path data
  const roverPath = React.useMemo(() => {
    return generateRoverPath('perseverance', selectedSol || 1000);
  }, [selectedSol]);

  // Initialize map on component mount
  useEffect(() => {
    if (mapContainerRef.current && !map) {
      // Ensure container has proper size before map creation
      const container = mapContainerRef.current;
      if (container.clientWidth === 0 || container.clientHeight === 0) {
        // Wait for container to be properly sized
        setTimeout(() => {
          if (container.clientWidth > 0 && container.clientHeight > 0) {
            // Re-trigger effect
            setMap(null);
          }
        }, 100);
        return;
      }

      const mapInstance = L.map(mapContainerRef.current, {
        crs: L.CRS.EPSG4326, // Use EPSG:4326 for NASA Trek EQ layers
        center: [18.4447, 77.4508], // Perseverance landing site
        zoom: zoomLevel || 10, // Use legacy zoomLevel prop if provided
        maxZoom: 18,
        minZoom: 3,
        maxBounds: [[-90, -180], [90, 180]], // Mars bounds in lat/lon
        noWrap: true, // Prevent world wrapping for Mars
        zoomControl: false, // We'll add custom controls
        attributionControl: true, // Enable attribution control
        // Remove preferCanvas to avoid rendering issues
        // renderer: L.canvas() // Only use if needed for performance
      });

      // Configure attribution control (already added with attributionControl: true)
      if (mapInstance.attributionControl) {
        mapInstance.attributionControl.setPrefix(false);
      }

      // Try to initialize NASA Trek layers, fall back to simple Mars map
      let layers = {};
      let initialLayer = null;
      
      try {
        layers = nasaTrekService.createLayerGroup();
        tileLayersRef.current = layers;
        initialLayer = layers[currentLayer];
      } catch (error) {
        console.warn('NASA Trek layers failed to load, using fallback Mars map');
      }
      
      // If NASA Trek fails, use simple Mars layer as fallback
      if (!initialLayer) {
        initialLayer = getBestMarsLayer();
        layers.fallback = initialLayer;
        tileLayersRef.current = layers;
        setCurrentLayer('fallback');
      }
      
      if (initialLayer) {
        mapInstance.addLayer(initialLayer);
      }

      // Add zoom control using ref-based singleton pattern (robust and canonical)
      if (showControls && !zoomControlRef.current) {
        zoomControlRef.current = L.control.zoom({
          position: 'topright'
        });
        mapInstance.addControl(zoomControlRef.current);
      }

      // Map event listeners
      mapInstance.on('zoomend', () => {
        const newZoom = mapInstance.getZoom();
        setMapZoomLevel(newZoom);
        
        // Switch to optimal layer based on zoom if auto-centering is enabled
        if (autoCenter) {
          const optimalLayer = selectOptimalLayer(newZoom);
          if (optimalLayer.id !== currentLayer) {
            switchTileLayer(optimalLayer.id);
          }
        }
      });

      mapInstance.on('click', (e) => {
        if (onLocationClick) {
          onLocationClick(e.latlng);
        }
      });

      // Removed problematic preloading that was causing console spam
      // Leaflet handles tile loading efficiently on its own

      setMap(mapInstance);
      mapRef.current = mapInstance;
    }

    return () => {
      // Clean up zoom control
      if (mapRef.current && zoomControlRef.current) {
        mapRef.current.removeControl(zoomControlRef.current);
        zoomControlRef.current = null;
      }
      
      if (mapRef.current) {
        mapRef.current.remove();
        setMap(null);
        mapRef.current = null;
      }
    };
  }, [zoomLevel, autoCenter, onLocationClick]);

  // Switch tile layers
  const switchTileLayer = useCallback((layerId) => {
    if (!map || !tileLayersRef.current[layerId] || layerId === currentLayer) {
      return;
    }

    setIsLoading(true);
    setLoadingProgress(0);

    // Animate progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 20;
      });
    }, 100);

    // Switch layers
    const success = nasaTrekService.switchLayer(map, currentLayer, layerId);
    
    if (success) {
      setCurrentLayer(layerId);
      
      // Attribution is handled by the layers themselves
      // No need to manually set prefix since layers include attribution
    }

    setTimeout(() => {
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setLoadingProgress(0);
      }, 300);
    }, 800);
  }, [map, currentLayer]);

  // Update route visualization
  useEffect(() => {
    if (!map || !roverPath?.length) return;

    // Clear existing route
    if (routePath) {
      map.removeLayer(routePath);
    }

    // Clear existing markers
    markersRef.current.forEach(marker => {
      map.removeLayer(marker);
    });
    markersRef.current = [];

    // Create route path with mission phase coloring
    const pathCoords = roverPath
      .filter(point => point.sol <= (selectedSol || 1000))
      .map(point => [point.lat, point.lon]);

    if (pathCoords.length > 1) {
      const newRoutePath = L.polyline(pathCoords, {
        color: '#00ff88',
        weight: 3,
        opacity: 0.8,
        dashArray: '10, 5',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      setRoutePath(newRoutePath);
    }

    // Add event markers
    const currentEvents = Object.entries(MISSION_EVENTS).filter(([sol]) => {
      const solNum = parseInt(sol);
      return solNum <= (selectedSol || 1000) && solNum >= 0;
    });

    currentEvents.forEach(([sol, event]) => {
      if (!event.coordinates) return;

      const solNum = parseInt(sol);
      const phase = getMissionPhase(solNum);
      
      // Create custom marker based on event type
      let markerColor = phase.color;
      let markerIcon = '●';
      
      switch(event.type) {
        case 'landing':
          markerColor = '#4CAF50';
          markerIcon = '🚀';
          break;
        case 'sample':
          markerColor = '#FF9800';
          markerIcon = '💎';
          break;
        case 'milestone':
          markerColor = '#2196F3';
          markerIcon = '🏆';
          break;
        case 'companion':
          markerColor = '#9C27B0';
          markerIcon = '🚁';
          break;
        case 'science':
          markerColor = '#00BCD4';
          markerIcon = '🔬';
          break;
        case 'exploration':
          markerColor = '#607D8B';
          markerIcon = '🗺️';
          break;
        default:
          markerColor = '#666666';
          markerIcon = '📍';
      }

      // Create custom HTML marker
      const customIcon = L.divIcon({
        html: `
          <div style="
            background: ${markerColor};
            border: 3px solid #ffffff;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: transform 0.2s ease;
          " onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'">
            ${markerIcon}
          </div>
        `,
        className: 'custom-event-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([event.coordinates.lat, event.coordinates.lon], {
        icon: customIcon,
        zIndexOffset: 1000 + (event.significance === 'historic' ? 100 : 
                              event.significance === 'high' ? 50 : 0)
      }).addTo(map);

      // Create detailed popup
      const popupContent = `
        <div style="
          font-family: 'Orbitron', monospace;
          min-width: 250px;
          padding: 8px;
        ">
          <h4 style="
            margin: 0 0 8px 0;
            color: ${markerColor};
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
          ">Sol ${sol}: ${event.title}</h4>
          
          <p style="
            margin: 8px 0;
            font-size: 12px;
            color: #333;
            line-height: 1.4;
          ">${event.description}</p>
          
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px solid #eee;
            font-size: 10px;
            color: #666;
          ">
            <span>📍 ${event.coordinates.lat.toFixed(4)}, ${event.coordinates.lon.toFixed(4)}</span>
            <span style="
              background: ${markerColor};
              color: white;
              padding: 2px 6px;
              border-radius: 3px;
              text-transform: uppercase;
              font-weight: 600;
            ">${event.type}</span>
          </div>
          
          ${event.significance ? `
            <div style="
              margin-top: 8px;
              font-size: 10px;
              color: ${event.significance === 'historic' ? '#FF6B35' : '#2196F3'};
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
            ">
              ${event.significance === 'historic' ? '🌟 Historic Significance' : 
                event.significance === 'high' ? '⭐ High Significance' : 
                '• ' + event.significance + ' Significance'}
            </div>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'nasa-event-popup'
      });

      // Handle marker click
      marker.on('click', () => {
        setSelectedEvent({ sol: solNum, ...event });
        if (onEventClick) {
          onEventClick({ sol: solNum, ...event });
        }
      });

      markersRef.current.push(marker);
    });

  }, [map, roverPath, selectedSol, onEventClick]);

  // Auto-center on current position or selected event
  useEffect(() => {
    if (!map || !autoCenter) return;

    if (selectedEvent && selectedEvent.coordinates) {
      // Center on selected event
      map.setView([selectedEvent.coordinates.lat, selectedEvent.coordinates.lon], Math.max(12, mapZoomLevel));
    } else if (currentPosition) {
      // Center on current rover position
      map.setView([currentPosition.lat, currentPosition.lon], Math.max(10, mapZoomLevel));
    } else if (roverPath && roverPath.length > 0) {
      // Center on latest position from route
      const latestPosition = roverPath[roverPath.length - 1];
      if (latestPosition) {
        map.setView([latestPosition.lat, latestPosition.lon], Math.max(10, mapZoomLevel));
      }
    }
  }, [map, selectedEvent, currentPosition, autoCenter, mapZoomLevel, roverPath]);

  // Layer switching control component
  const LayerSwitcher = () => (
    <div className="nasa-layer-control">
      <button 
        className="layer-toggle-btn"
        onClick={() => setLayerSwitcherOpen(!layerSwitcherOpen)}
        title="Switch Imagery Layer"
      >
        🛰️ {nasaTrekService.getLayerInfo(currentLayer)?.name || 'Imagery'}
      </button>
      
      {layerSwitcherOpen && (
        <div className="layer-options">
          {Object.values(MARS_TILE_LAYERS).map(layer => (
            <button
              key={layer.id}
              className={`layer-option ${currentLayer === layer.id ? 'active' : ''}`}
              onClick={() => {
                switchTileLayer(layer.id);
                setLayerSwitcherOpen(false);
              }}
            >
              <div className="layer-info">
                <span className="layer-name">{layer.name}</span>
                <span className="layer-resolution">{layer.resolution}</span>
                <span className="layer-source">{layer.dataSource}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="enhanced-nasa-mars-map nasa-mars-map">
      {/* Loading overlay */}
      {isLoading && (
        <div className="map-loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">
              <div className="loading-title">Loading NASA Trek Imagery</div>
              <div className="loading-subtitle">
                {nasaTrekService.getLayerInfo(currentLayer)?.name}
              </div>
              <div className="loading-progress">
                <div 
                  className="loading-bar" 
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map container */}
      <div 
        ref={mapContainerRef} 
        className="leaflet-map-container"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Controls overlay */}
      {showControls && (
        <div className="map-controls-overlay">
          {/* Layer switcher */}
          <LayerSwitcher />
          
          {/* Map info */}
          <div className="map-info-panel">
            <div className="info-item">
              <span className="info-label">Sol:</span>
              <span className="info-value">{selectedSol || 'Latest'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Zoom:</span>
              <span className="info-value">{mapZoomLevel}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Layer:</span>
              <span className="info-value">{nasaTrekService.getLayerInfo(currentLayer)?.resolution}</span>
            </div>
          </div>

          {/* Mission phase indicator */}
          {selectedSol && (
            <div className="mission-phase-indicator">
              {(() => {
                const phase = getMissionPhase(selectedSol);
                return (
                  <div 
                    className="phase-badge"
                    style={{ background: phase.color }}
                  >
                    {phase.name}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Selected event details */}
      {selectedEvent && (
        <div className="selected-event-panel">
          <div className="event-header">
            <h4>Sol {selectedEvent.sol}: {selectedEvent.title}</h4>
            <button 
              className="close-event-btn"
              onClick={() => setSelectedEvent(null)}
            >
              ×
            </button>
          </div>
          <div className="event-content">
            <p>{selectedEvent.description}</p>
            {selectedEvent.science_objectives && (
              <div className="science-objectives">
                <strong>Science Objectives:</strong>
                <ul>
                  {selectedEvent.science_objectives.map((obj, idx) => (
                    <li key={idx}>{obj}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NASAMarsMap;