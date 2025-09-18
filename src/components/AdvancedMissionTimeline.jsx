import React, { useState, useCallback, useRef, useEffect } from 'react';
import { subscribeToMaxSolUpdates, getLastKnownMaxSol } from '../utils/nasaManifestUtils.js';

// ADVANCED MISSION TIMELINE - The centerpiece
const AdvancedMissionTimeline = ({ sols, selectedSol, onSolChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [hoverInfo, setHoverInfo] = useState(null);
  const [maxSol, setMaxSol] = useState(1650); // Higher default fallback, will be updated via event subscription
  const autoPlayRef = useRef(null);
  const timelineRef = useRef(null);

  // Mission Events with enhanced data
  const comprehensiveMissionEvents = [
    {
      sol: 0, 
      label: "LANDING AT JEZERO", 
      shortLabel: "LANDING", 
      type: "critical",
      category: "landing",
      description: "Successful touchdown in Jezero Crater using sky crane maneuver",
      significance: "Mission start",
      instruments: ["Cameras", "MOXIE"],
      coordinates: { lat: 18.4447, lon: 77.4508 }
    },
    {
      sol: 18,
      label: "FIRST DRIVE",
      shortLabel: "FIRST DRIVE", 
      type: "milestone",
      category: "mobility",
      description: "Perseverance's first drive on Mars - 6.5 meters forward",
      significance: "Mobility systems operational",
      instruments: ["Navigation Cameras", "Hazcams"],
      coordinates: { lat: 18.4448, lon: 77.4509 }
    },
    {
      sol: 43,
      label: "INGENUITY DEPLOYED",
      shortLabel: "HELI DEPLOYED",
      type: "milestone", 
      category: "helicopter",
      description: "Mars Helicopter Ingenuity successfully deployed from rover belly",
      significance: "First Mars helicopter preparation",
      instruments: ["Ingenuity"],
      coordinates: { lat: 18.4446, lon: 77.4505 }
    },
    {
      sol: 62,
      label: "INGENUITY FIRST FLIGHT",
      shortLabel: "FIRST FLIGHT",
      type: "historic",
      category: "helicopter", 
      description: "First powered flight on another planet - 39.1 seconds",
      significance: "Historic aviation achievement",
      instruments: ["Ingenuity Helicopter"],
      coordinates: { lat: 18.4446, lon: 77.4505 }
    },
    {
      sol: 120,
      label: "OCTAVIA E. BUTLER SITE",
      shortLabel: "BUTLER SITE",
      type: "exploration",
      category: "exploration",
      description: "Reached Octavia E. Butler landing site for detailed exploration",
      significance: "Geological survey location",
      instruments: ["RIMFAX", "SUPERCAM", "MASTCAM-Z"],
      coordinates: { lat: 18.4455, lon: 77.4515 }
    }
  ];

  // Filter and search events
  const filteredEvents = comprehensiveMissionEvents.filter(event => {
    const matchesSearch = event.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || event.category === filterType;
    return matchesSearch && matchesFilter;
  });

  // Auto-play functionality
  const startAutoPlay = useCallback((startSol) => {
    if (autoPlayRef.current) return;
    
    setIsAutoPlay(true);
    let currentSol = startSol;
    
    const playNextEvent = () => {
      const upcomingEvents = filteredEvents.filter(event => event.sol > currentSol);
      if (upcomingEvents.length === 0) {
        setIsAutoPlay(false);
        autoPlayRef.current = null;
        return;
      }
      
      const nextEvent = upcomingEvents[0];
      currentSol = nextEvent.sol;
      onSolChange(nextEvent.sol);
      
      const delay = 2000 / playbackSpeed;
      autoPlayRef.current = setTimeout(() => {
        playNextEvent();
      }, delay);
    };
    
    playNextEvent();
  }, [filteredEvents, playbackSpeed, onSolChange]);

  const stopAutoPlay = () => {
    setIsAutoPlay(false);
    if (autoPlayRef.current) {
      clearTimeout(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  };

  // Timeline mouse handlers
  const handleMouseDown = (e) => {
    if (!timelineRef.current) return;
    setIsDragging(true);
    updateSolFromMouse(e);
  };

  const updateSolFromMouse = (e) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newSol = Math.round((percentage / 100) * maxSol);
    onSolChange(newSol);
  };

  const handleTimelineHover = (e) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const hoverSol = Math.round((percentage / 100) * maxSol);
    
    // Mission phases for hover info
    const missionPhases = {
      'Landing & Checkout': { range: [0, 60], color: '#4CAF50' },
      'Crater Floor Exploration': { range: [61, 235], color: '#2196F3' },
      'Delta Approach': { range: [236, 414], color: '#FF9800' },
      'Delta Campaign': { range: [415, 707], color: '#9C27B0' },
      'Sample Depot Operations': { range: [708, 900], color: '#F44336' },
      'Crater Rim Exploration': { range: [901, maxSol], color: '#795548' }
    };
    
    let currentPhase = 'Unknown Phase';
    Object.entries(missionPhases).forEach(([phaseName, phase]) => {
      if (hoverSol >= phase.range[0] && hoverSol <= phase.range[1]) {
        currentPhase = phaseName;
      }
    });
    
    setHoverInfo({
      type: 'timeline',
      x: percentage,
      sol: hoverSol,
      phase: currentPhase
    });
  };

  // Keyboard shortcuts  
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't interfere with interactive elements or modals
      if (e.target.closest('input, select, textarea, button, [contenteditable="true"]')) return;
      if (document.querySelector('.nasa-image-modal')) return;
      
      switch (e.code) {
        case 'ArrowLeft':
          e.preventDefault();
          onSolChange(Math.max(0, selectedSol - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          onSolChange(Math.min(maxSol, selectedSol + 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          onSolChange(Math.max(0, selectedSol - 10));
          break;
        case 'ArrowDown':
          e.preventDefault();
          onSolChange(Math.min(maxSol, selectedSol + 10));
          break;
        case 'Space':
          e.preventDefault();
          if (isAutoPlay) {
            stopAutoPlay();
          } else {
            startAutoPlay(selectedSol);
          }
          break;
        case 'Home':
          e.preventDefault();
          onSolChange(0);
          break;
        case 'End':
          e.preventDefault();
          onSolChange(maxSol);
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedSol, isAutoPlay, onSolChange, stopAutoPlay, startAutoPlay]);

  // Cleanup auto-play on unmount
  useEffect(() => {
    return () => {
      if (autoPlayRef.current) {
        clearTimeout(autoPlayRef.current);
      }
    };
  }, []);

  // Subscribe to max_sol_updated events instead of direct fetching
  useEffect(() => {
    // Try to get last known max sol immediately without API call
    const lastKnownMaxSol = getLastKnownMaxSol('perseverance');
    if (lastKnownMaxSol && lastKnownMaxSol !== maxSol) {
      setMaxSol(lastKnownMaxSol);
    }
    
    // Subscribe to max sol updates from central event system
    const unsubscribe = subscribeToMaxSolUpdates((data) => {
      if (data.maxSol && data.maxSol !== maxSol) {
        setMaxSol(data.maxSol);
        console.log(`AdvancedMissionTimeline: Updated maxSol to ${data.maxSol} from ${data.source}`);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [maxSol]);

  // Mission phase color calculation
  const percentage = (selectedSol / maxSol) * 100;
  const currentPhaseColor = selectedSol <= 60 ? '#4CAF50' : 
                           selectedSol <= 235 ? '#2196F3' : 
                           selectedSol <= 414 ? '#FF9800' : 
                           selectedSol <= 707 ? '#9C27B0' : 
                           selectedSol <= 900 ? '#F44336' : '#795548';

  return (
    <div className="advanced-mission-timeline">
      {/* Compact Single-Line Timeline Controls */}
      <div className="timeline-controls">
        <div className="timeline-header-compact" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '6px',
          fontFamily: '"Orbitron", monospace'
        }}>
          <h3 style={{ margin: 0, fontSize: '14px', color: 'white' }}>MISSION TIMELINE</h3>
          
          <button 
            className="timeline-collapse-btn"
            onClick={() => setTimelineCollapsed(!timelineCollapsed)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '3px',
              color: 'white',
              padding: '4px 6px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: '"Orbitron", monospace',
              minWidth: '24px'
            }}
            title={timelineCollapsed ? 'Expand Timeline' : 'Collapse Timeline'}
          >
            {timelineCollapsed ? '▼' : '▲'}
          </button>
          
          <button 
            className="timeline-search-btn"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '3px',
              color: 'white',
              padding: '4px 6px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: '"Orbitron", monospace',
              minWidth: '24px'
            }}
            title="Search Events"
          >
            🔍
          </button>
          
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '3px',
              color: 'white',
              padding: '4px 8px',
              fontSize: '11px',
              fontFamily: '"Orbitron", monospace',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Events</option>
            <option value="landing">Landing</option>
            <option value="sampling">Sampling</option>
            <option value="helicopter">Helicopter</option>
            <option value="exploration">Exploration</option>
            <option value="discovery">Discoveries</option>
            <option value="mobility">Mobility</option>
          </select>
          
          <button 
            className={`autoplay-btn ${isAutoPlay ? 'active' : ''}`}
            onClick={isAutoPlay ? stopAutoPlay : () => startAutoPlay(selectedSol)}
            style={{
              background: isAutoPlay ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '3px',
              color: 'white',
              padding: '4px 8px',
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: '"Orbitron", monospace'
            }}
            title="Play events from current Sol (Space key)"
          >
            {isAutoPlay ? '⏸' : '▶'}
          </button>
          
          <select 
            value={playbackSpeed} 
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '3px',
              color: 'white',
              padding: '4px 6px',
              fontSize: '11px',
              fontFamily: '"Orbitron", monospace',
              cursor: 'pointer',
              minWidth: '50px'
            }}
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={5}>5x</option>
            <option value={10}>10x</option>
          </select>
          
          <div style={{ 
            fontSize: '12px', 
            color: '#aaa', 
            fontWeight: 'bold',
            marginLeft: '8px'
          }}>
            SOL: {selectedSol}
          </div>
        </div>
      </div>
    
      {/* Timeline Track */}
      {!timelineCollapsed && (
        <div className="timeline-track-container">
          <div 
            ref={timelineRef}
            className="nasa-timeline-track"
            onMouseDown={handleMouseDown}
            onMouseMove={handleTimelineHover}
            onMouseLeave={() => setHoverInfo(null)}
          >
            <div className="timeline-background">
              {/* Mission Phase Color Segments */}
              <div className="mission-phase-segments" style={{ position: 'absolute', width: '100%', height: '100%' }}>
                <div style={{ position: 'absolute', left: '0%', width: '6%', height: '100%', background: 'linear-gradient(to right, #4CAF50, #4CAF50)', opacity: 0.3 }} title="Landing & Checkout" />
                <div style={{ position: 'absolute', left: '6%', width: '17.4%', height: '100%', background: 'linear-gradient(to right, #2196F3, #2196F3)', opacity: 0.3 }} title="Crater Floor Exploration" />
                <div style={{ position: 'absolute', left: '23.4%', width: '17.8%', height: '100%', background: 'linear-gradient(to right, #FF9800, #FF9800)', opacity: 0.3 }} title="Delta Approach" />
                <div style={{ position: 'absolute', left: '41.2%', width: '29.2%', height: '100%', background: 'linear-gradient(to right, #9C27B0, #9C27B0)', opacity: 0.3 }} title="Delta Campaign" />
                <div style={{ position: 'absolute', left: '70.4%', width: '19.2%', height: '100%', background: 'linear-gradient(to right, #F44336, #F44336)', opacity: 0.3 }} title="Sample Depot Operations" />
                <div style={{ position: 'absolute', left: '89.6%', width: '10.4%', height: '100%', background: 'linear-gradient(to right, #795548, #795548)', opacity: 0.3 }} title="Crater Rim Exploration" />
              </div>
            </div>
            <div className="timeline-progress" style={{ 
              width: `${percentage}%`,
              background: currentPhaseColor,
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
              transition: 'all 0.3s ease'
            }} />
            
            {/* Hover tooltip for timeline progress bar */}
            {hoverInfo && hoverInfo.type === 'timeline' && (
              <div 
                className="timeline-hover-tooltip"
                style={{
                  position: 'absolute',
                  left: `${Math.max(5, Math.min(85, hoverInfo.x))}%`,
                  top: '-80px',
                  background: 'rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: '"Orbitron", monospace',
                  whiteSpace: 'nowrap',
                  zIndex: 1000,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  pointerEvents: 'none'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  SOL {Math.round(hoverInfo.sol)}
                </div>
                <div style={{ fontSize: '11px', color: '#aaa' }}>
                  Mission Phase: {hoverInfo.phase}
                </div>
              </div>
            )}
            
            {/* Progress bar handle */}
            <div 
              className="timeline-handle"
              style={{
                position: 'absolute',
                left: `${Math.min(percentage, 98)}%`,
                top: '0px',
                transform: 'translateX(-50%)',
                width: '16px',
                height: '16px',
                background: 'white',
                borderRadius: '50%',
                border: '2px solid #333',
                cursor: isDragging ? 'grabbing' : 'grab',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                zIndex: 10
              }}
            />
            
            {/* Mission timeline events - Show all filtered events */}
            {filteredEvents.map((event, index) => {
              const eventSol = event.sol;
              const eventPercentage = (eventSol / maxSol) * 100;
              
              return (
                <div 
                  key={`event-${eventSol}-${index}`}
                  className={`nasa-timeline-event ${event.type} ${selectedSol >= eventSol ? 'completed' : 'upcoming'}`}
                  style={{ 
                    left: `${Math.min(eventPercentage, 95)}%`,
                    position: 'absolute',
                    top: '0px'
                  }}
                  onClick={() => onSolChange(eventSol)}
                  onMouseEnter={(e) => setHoverInfo({
                    type: 'event',
                    x: eventPercentage,
                    event: event
                  })}
                  onMouseLeave={() => setHoverInfo(null)}
                  title={`SOL ${eventSol}: ${event.label}`}
                >
                  <div className="event-marker"></div>
                  {/* Sol number label above the dot */}
                  <div className="event-sol-label" style={{
                    position: 'absolute',
                    top: '-22px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '9px',
                    color: '#aaa',
                    fontFamily: '"Orbitron", monospace',
                    whiteSpace: 'nowrap',
                    fontWeight: 'bold',
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
                  }}>
                    SOL {eventSol}
                  </div>
                </div>
              );
            })}
            
            {/* Enhanced event hover tooltip */}
            {hoverInfo && hoverInfo.type === 'event' && (
              <div 
                className="event-hover-tooltip"
                style={{
                  position: 'absolute',
                  left: `${Math.max(5, Math.min(75, hoverInfo.x))}%`,
                  top: '-120px',
                  background: 'rgba(0, 0, 0, 0.95)',
                  color: 'white',
                  padding: '16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontFamily: '"Orbitron", monospace',
                  minWidth: '220px',
                  maxWidth: '300px',
                  zIndex: 1000,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
                  pointerEvents: 'none'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#4fc3f7' }}>
                  SOL {hoverInfo.event.sol}: {hoverInfo.event.label}
                </div>
                <div style={{ marginBottom: '6px', fontSize: '11px' }}>
                  {hoverInfo.event.description}
                </div>
                <div style={{ fontSize: '10px', color: '#888', borderTop: '1px solid #333', paddingTop: '6px', marginTop: '6px' }}>
                  <div>Type: {hoverInfo.event.type}</div>
                  <div>Instruments: {hoverInfo.event.instruments?.join(', ') || 'Various'}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Timeline Navigation Controls */}
      {!timelineCollapsed && (
        <div className="timeline-navigation">
          <button onClick={() => onSolChange(Math.max(0, selectedSol - 100))} disabled={selectedSol <= 0}>
            ⏪ -100 SOLS
          </button>
          <button onClick={() => onSolChange(Math.max(0, selectedSol - 30))} disabled={selectedSol <= 0}>
            ⏪ -30 SOLS
          </button>
          <button onClick={() => onSolChange(Math.max(0, selectedSol - 10))} disabled={selectedSol <= 0}>
            ⏮ -10 SOLS
          </button>
          <button onClick={() => onSolChange(Math.max(0, selectedSol - 5))} disabled={selectedSol <= 0}>
            ⏮ -5 SOLS
          </button>
          <button className="home-btn" onClick={() => onSolChange(maxSol)}>
            ⌂ LATEST SOL
          </button>
          <button onClick={() => onSolChange(Math.min(maxSol, selectedSol + 5))} disabled={selectedSol >= maxSol}>
            ⏭ +5 SOLS
          </button>
          <button onClick={() => onSolChange(Math.min(maxSol, selectedSol + 10))} disabled={selectedSol >= maxSol}>
            ⏭ +10 SOLS
          </button>
          <button onClick={() => onSolChange(Math.min(maxSol, selectedSol + 30))} disabled={selectedSol >= maxSol}>
            +30 SOLS ⏩
          </button>
          <button onClick={() => onSolChange(Math.min(maxSol, selectedSol + 100))} disabled={selectedSol >= maxSol}>
            +100 SOLS ⏩
          </button>
        </div>
      )}
    </div>
  );
};

export default AdvancedMissionTimeline;