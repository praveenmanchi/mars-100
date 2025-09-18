// AdvancedMissionTimeline.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { subscribeToMaxSolUpdates, getLastKnownMaxSol } from '../utils/nasaManifestUtils.js';

// import icons from src/assets/timeline
import StartIcon from '../assets/timeline/start.svg';
import HelicopterIcon from '../assets/timeline/Helicopter.svg';
import ExplorationIcon from '../assets/timeline/Exploration.svg';
import SamplingIcon from '../assets/timeline/Sampling.svg';
import ContainerIcon from '../assets/timeline/Container.svg';
import DiscoveriesIcon from '../assets/timeline/Discoveries.svg';
import DrillingIcon from '../assets/timeline/Drilling.svg';
import WaterIcon from '../assets/timeline/water.svg';

// Main component
const AdvancedMissionTimeline = ({ sols = [], selectedSol = 0, onSolChange = () => {} }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [hoverInfo, setHoverInfo] = useState(null);
  const [maxSol, setMaxSol] = useState(1650);
  const autoPlayRef = useRef(null);
  const timelineRef = useRef(null);

  // mapping categories -> icon
  const eventIcons = {
    landing: StartIcon,
    helicopter: HelicopterIcon,
    exploration: ExplorationIcon,
    sampling: SamplingIcon,
    container: ContainerIcon,
    discovery: DiscoveriesIcon,
    drilling: DrillingIcon,
    water: WaterIcon
  };

  // comprehensive mission events (you can extend or move externally)
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
      instruments: ["Ingenuity"]
    },
    {
      sol: 62,
      label: "INGENUITY FIRST FLIGHT",
      shortLabel: "FIRST FLIGHT",
      type: "historic",
      category: "helicopter",
      description: "First powered flight on another planet - 39.1 seconds",
      significance: "Historic aviation achievement",
      instruments: ["Ingenuity Helicopter"]
    },
    {
      sol: 120,
      label: "OCTAVIA E. BUTLER SITE",
      shortLabel: "BUTLER SITE",
      type: "exploration",
      category: "exploration",
      description: "Reached Octavia E. Butler landing site for detailed exploration",
      significance: "Geological survey location",
      instruments: ["RIMFAX", "SUPERCAM", "MASTCAM-Z"]
    },
    // sample events to show other icons
    {
      sol: 300,
      label: "DELTA EXPLORATION",
      shortLabel: "DELTA",
      type: "exploration",
      category: "exploration",
      description: "Delta region detailed campaign begins",
      instruments: ["Mastcam", "SuperCam"]
    },
    {
      sol: 500,
      label: "SAMPLE DEPOT",
      shortLabel: "DEPOT",
      type: "milestone",
      category: "container",
      description: "Sample depot established for future retrieval"
    },
    {
      sol: 1000,
      label: "ANCIENT LAKE SITE",
      shortLabel: "LAKE",
      type: "discovery",
      category: "water",
      description: "Signs of ancient lake deposits discovered"
    }
  ];

  // filter and search
  const filteredEvents = comprehensiveMissionEvents.filter(event => {
    const matchesSearch = searchQuery.trim() === '' ||
      event.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterType === 'all' || event.category === filterType || event.type === filterType;
    return matchesSearch && matchesFilter;
  });

  // autoplay
  const startAutoPlay = useCallback((startSol) => {
    if (autoPlayRef.current) return;
    setIsAutoPlay(true);
    let currentSol = startSol;

    const playNextEvent = () => {
      const upcomingEvents = filteredEvents.filter(e => e.sol > currentSol).sort((a,b) => a.sol - b.sol);
      if (upcomingEvents.length === 0) {
        setIsAutoPlay(false);
        autoPlayRef.current = null;
        return;
      }
      const nextEvent = upcomingEvents[0];
      currentSol = nextEvent.sol;
      onSolChange(nextEvent.sol);

      const delay = Math.max(200, 2000 / playbackSpeed);
      autoPlayRef.current = setTimeout(() => {
        playNextEvent();
      }, delay);
    };

    playNextEvent();
  }, [filteredEvents, playbackSpeed, onSolChange]);

  const stopAutoPlay = useCallback(() => {
    setIsAutoPlay(false);
    if (autoPlayRef.current) {
      clearTimeout(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  }, []);

  // timeline interactions
  const updateSolFromMouse = (clientX) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newSol = Math.round((percentage / 100) * maxSol);
    onSolChange(newSol);
  };

  const handleMouseDown = (e) => {
    if (!timelineRef.current) return;
    setIsDragging(true);
    updateSolFromMouse(e.clientX);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    updateSolFromMouse(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  const handleTimelineHover = (e) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const hoverSol = Math.round((percentage / 100) * maxSol);

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
      const [a, b] = phase.range;
      if (hoverSol >= a && hoverSol <= b) currentPhase = phaseName;
    });

    setHoverInfo({
      type: 'timeline',
      x: percentage,
      sol: hoverSol,
      phase: currentPhase
    });
  };

  // keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.closest && e.target.closest('input, select, textarea, button, [contenteditable="true"]')) return;
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
          if (isAutoPlay) stopAutoPlay();
          else startAutoPlay(selectedSol);
          break;
        case 'Home':
          e.preventDefault();
          onSolChange(0);
          break;
        case 'End':
          e.preventDefault();
          onSolChange(maxSol);
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedSol, isAutoPlay, startAutoPlay, stopAutoPlay, maxSol, onSolChange]);

  // subscribe to maxSol updates
  useEffect(() => {
    const lastKnown = getLastKnownMaxSol && getLastKnownMaxSol('perseverance');
    if (lastKnown && lastKnown !== maxSol) setMaxSol(lastKnown);

    const unsubscribe = subscribeToMaxSolUpdates ? subscribeToMaxSolUpdates((data) => {
      if (data?.maxSol && data.maxSol !== maxSol) {
        setMaxSol(data.maxSol);
        console.log(`AdvancedMissionTimeline: maxSol updated to ${data.maxSol} (source=${data.source})`);
      }
    }) : (() => {});
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [maxSol]);

  // cleanup autoplay on unmount
  useEffect(() => {
    return () => {
      if (autoPlayRef.current) {
        clearTimeout(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    };
  }, []);

  // compute current phase color for selectedSol for the indicator
  const currentPhaseColor = selectedSol <= 60 ? '#4CAF50' :
    selectedSol <= 235 ? '#2196F3' :
    selectedSol <= 414 ? '#FF9800' :
    selectedSol <= 707 ? '#9C27B0' :
    selectedSol <= 900 ? '#F44336' : '#795548';

  // helper: event marker on mouse enter handler
  const handleEventMouseEnter = (event) => {
    const percent = (event.sol / maxSol) * 100;
    setHoverInfo({
      type: 'event',
      x: percent,
      event
    });
  };

  // render
  return (
    <div style={{ fontFamily: '"Orbitron", monospace', color: '#fff', width: '100%' }}>
      {/* Header / compact controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 14px',
        background: 'rgba(0,0,0,0.35)',
        borderRadius: 8
      }}>
        <h3 style={{ margin: 0, fontSize: 14 }}>MISSION TIMELINE</h3>
        <div style={{ margin: '4px 0 0 0', fontSize: 12, opacity: 0.7 }}>Operational Timeline FLOW & events</div>

        <button
          onClick={() => setTimelineCollapsed(!timelineCollapsed)}
          title={timelineCollapsed ? 'Expand timeline' : 'Collapse timeline'}
          style={{
            padding: '6px 8px',
            borderRadius: 6,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          {timelineCollapsed ? '▼' : '▲'}
        </button>

        <button
          onClick={() => setShowSearch(s => !s)}
          title="Search events"
          style={{
            padding: '6px',
            borderRadius: 6,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          🔍
        </button>

        {showSearch && (
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            style={{
              marginLeft: 4,
              padding: '6px 8px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(0,0,0,0.4)',
              color: '#fff',
              minWidth: 180
            }}
          />
        )}

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            marginLeft: 'auto',
            padding: '6px 8px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
            color: '#fff'
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
          onClick={() => {
            if (isAutoPlay) stopAutoPlay();
            else startAutoPlay(selectedSol);
          }}
          title="Play / Pause"
          style={{
            padding: '6px 8px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.08)',
            marginLeft: 8,
            background: isAutoPlay ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.04)',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          {isAutoPlay ? '⏸' : '▶'}
        </button>

        <select
          value={playbackSpeed}
          onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
          style={{
            padding: '6px 8px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            color: '#fff',
            marginLeft: 6
          }}
        >
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={5}>5x</option>
        </select>

        <div style={{ marginLeft: 8, fontWeight: '700', color: '#ddd' }}>
          SOL: {selectedSol}
        </div>
        Distance Travel: <strong style={{ color: '#fff' }}>12 KMs</strong> &nbsp;
        {/* <div style={{ marginLeft: 'auto', color: '#bbb', fontSize: 13 }}> 
          Distance Travel: <strong style={{ color: '#fff' }}>
            {roverData?.metrics?.totalDistance?.[selectedSol] || 0} KMs
          </strong> &nbsp;
        </div> */}
      </div>

      {/* Timeline Track */}
      {!timelineCollapsed && (
        <div style={{ marginTop: 12, position: 'relative' }}>
          <div
            ref={timelineRef}
            className="nasa-timeline-track"
            onMouseDown={handleMouseDown}
            onMouseMove={handleTimelineHover}
            onMouseLeave={() => setHoverInfo(null)}
            style={{
              height: 56,
              borderRadius: 12,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
              position: 'relative',
              padding: '10px',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
            }}
          >
            {/* Phase segments */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
              <div title="Landing & Checkout" style={{ position: 'absolute', left: '0%', width: '6%', height: '100%', background: 'linear-gradient(to right,#4CAF50,#4CAF50)', opacity: 0.18, borderRadius: 12 }} />
              <div title="Crater Floor Exploration" style={{ position: 'absolute', left: '6%', width: '17.4%', height: '100%', background: 'linear-gradient(to right,#2196F3,#2196F3)', opacity: 0.18 }} />
              <div title="Delta Approach" style={{ position: 'absolute', left: '23.4%', width: '17.8%', height: '100%', background: 'linear-gradient(to right,#FF9800,#FF9800)', opacity: 0.18 }} />
              <div title="Delta Campaign" style={{ position: 'absolute', left: '41.2%', width: '29.2%', height: '100%', background: 'linear-gradient(to right,#9C27B0,#9C27B0)', opacity: 0.18 }} />
              <div title="Sample Depot Operations" style={{ position: 'absolute', left: '70.4%', width: '19.2%', height: '100%', background: 'linear-gradient(to right,#F44336,#F44336)', opacity: 0.18 }} />
              <div title="Crater Rim Exploration" style={{ position: 'absolute', left: '89.6%', width: '10.4%', height: '100%', background: 'linear-gradient(to right,#795548,#795548)', opacity: 0.18 }} />
            </div>

            {/* Progress bar representing selectedSol */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              height: 6,
              transform: 'translateY(-50%)',
              width: `${(selectedSol / Math.max(1, maxSol)) * 100}%`,
              background: `linear-gradient(90deg, ${currentPhaseColor}, rgba(255,255,255,0.05))`,
              borderRadius: 6,
              zIndex: 2
            }} />

            {/* Full track overlay */}
            <div style={{
              position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)',
              height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.03)', zIndex: 1
            }} />

            {/* Selected Sol indicator */}
            <div style={{
              position: 'absolute',
              left: `${(selectedSol / Math.max(1, maxSol)) * 100}%`,
              top: '50%',
              transform: 'translate(-50%,-50%)',
              zIndex: 3,
              pointerEvents: 'none'
            }}>
              <div style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: currentPhaseColor,
                boxShadow: '0 0 6px rgba(0,0,0,0.6)',
                border: '2px solid rgba(255,255,255,0.06)'
              }} />
            </div>

            {/* Event markers (icons) */}
            {filteredEvents.map((event) => {
              // handle categories not matching icon map
              const iconSrc = eventIcons[event.category] || StartIcon;
              const leftPercent = Math.min(100, Math.max(0, (event.sol / Math.max(1, maxSol)) * 100));
              return (
                <div
                  key={`evt-${event.sol}-${event.label}`}
                  style={{
                    position: 'absolute',
                    left: `${leftPercent}%`,
                    bottom: 8,
                    transform: 'translateX(-50%)',
                    zIndex: 4,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={() => onSolChange(event.sol)}
                  onMouseEnter={() => handleEventMouseEnter(event)}
                  onMouseLeave={() => setHoverInfo(null)}
                >
                  <img src={iconSrc} alt={event.label} style={{ width: 20, height: 20, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }} />
                </div>
              );
            })}

            {/* Hover tooltip for timeline or events */}
            {hoverInfo && hoverInfo.type === 'timeline' && (
              <div style={{
                position: 'absolute',
                left: `${hoverInfo.x}%`,
                top: -34,
                transform: 'translateX(-50%)',
                padding: '6px 10px',
                borderRadius: 6,
                background: 'rgba(0,0,0,0.8)',
                color: '#fff',
                fontSize: 12,
                zIndex: 10,
                pointerEvents: 'none',
                whiteSpace: 'nowrap'
              }}>
                Sol {hoverInfo.sol} — {hoverInfo.phase}
              </div>
            )}

            {hoverInfo && hoverInfo.type === 'event' && (
              <div style={{
                position: 'absolute',
                left: `${hoverInfo.x}%`,
                top: -80,
                transform: 'translateX(-50%)',
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(3,3,3,0.9)',
                color: '#fff',
                fontSize: 12,
                zIndex: 20,
                pointerEvents: 'none',
                maxWidth: 260,
                textAlign: 'left',
                boxShadow: '0 6px 18px rgba(0,0,0,0.5)'
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <img src={eventIcons[hoverInfo.event.category] || StartIcon} alt="" style={{ width: 28, height: 28 }} />
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{hoverInfo.event.label}</div>
                </div>

                {hoverInfo.event.description && (
                  <div style={{ marginTop: 8, opacity: 0.9, fontSize: 12 }}>
                    {hoverInfo.event.description}
                  </div>
                )}

                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', opacity: 0.9 }}>
                  <div style={{ fontSize: 11, background: 'rgba(255,255,255,0.03)', padding: '4px 6px', borderRadius: 6 }}>
                    Sol {hoverInfo.event.sol}
                  </div>
                  {hoverInfo.event.instruments && (
                    <div style={{ fontSize: 11, background: 'rgba(255,255,255,0.03)', padding: '4px 6px', borderRadius: 6 }}>
                      {hoverInfo.event.instruments.slice(0,2).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom controls (quick jump buttons) */}
          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => onSolChange(0)} style={smallBtnStyle}>⏮ Sol 0</button>
            <button onClick={() => onSolChange(Math.max(0, selectedSol - 1))} style={smallBtnStyle}>◀ -1</button>
            <button onClick={() => onSolChange(Math.max(0, selectedSol - 10))} style={smallBtnStyle}>◀ -10</button>
            <button onClick={() => onSolChange(Math.min(maxSol, selectedSol + 1))} style={smallBtnStyle}>+1 ▶</button>
            <button onClick={() => onSolChange(Math.min(maxSol, selectedSol + 10))} style={smallBtnStyle}>+10 ▶▶</button>
            
          </div>
        </div>
      )}
    </div>
  );
};

// small button style used in multiple places
const smallBtnStyle = {
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(255,255,255,0.02)',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 12
};

export default AdvancedMissionTimeline;
