// Mission Replay System - Animated rover journey with time-lapse photography
import React, { useState, useEffect, useRef, useCallback } from 'react';
// Removed Framer Motion for stability
import { getRoverData } from '../api/roverData';

const MissionReplaySystem = ({ currentSol = 100, onSolChange = () => {}, missionData = {} }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1000); // ms per sol
  const [replayRange, setReplayRange] = useState({ start: 0, end: currentSol });
  const [replaySol, setReplaySol] = useState(currentSol);
  const [roverPath, setRoverPath] = useState([]);
  const [photosSequence, setPhotosSequence] = useState([]);
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [milestones, setMilestones] = useState([]);
  
  const intervalRef = useRef(null);
  const canvasRef = useRef(null);
  const photosSequenceRef = useRef([]);
  const milestonesRef = useRef([]);

  // Mission milestones for celebrations
  const MISSION_MILESTONES = [
    { sol: 0, name: 'Landing Success', icon: '🚀', description: 'Perseverance successfully lands in Jezero Crater' },
    { sol: 44, name: 'First Drive', icon: '🚗', description: 'First successful drive on Mars surface' },
    { sol: 60, name: 'Helicopter Deploy', icon: '🚁', description: 'Ingenuity helicopter deployment' },
    { sol: 100, name: 'Sample Collection', icon: '🔬', description: 'First rock sample collected' },
    { sol: 200, name: 'Major Discovery', icon: '💎', description: 'Evidence of ancient water activity' },
    { sol: 365, name: 'One Martian Year', icon: '🎂', description: 'Completed one full Martian year' },
    { sol: 500, name: 'Long Journey', icon: '🛤️', description: 'Covered significant distance exploring crater' },
    { sol: 687, name: 'Mission Extended', icon: '⏰', description: 'Mission officially extended' }
  ];

  // Generate rover path data
  useEffect(() => {
    const generateRoverPath = () => {
      const path = [];
      const baseLat = 18.4447; // Jezero Crater
      const baseLon = 77.4508;
      
      for (let sol = 0; sol <= currentSol; sol++) {
        // Simulate realistic rover movement with some exploration patterns
        const progress = sol / Math.max(currentSol, 1);
        const explorationRadius = progress * 0.01; // Gradual expansion
        
        // Add some realistic movement patterns
        const angle = (sol * 15) % 360; // Exploration angle
        const distance = Math.sin(sol / 20) * explorationRadius; // Varying distance
        
        const lat = baseLat + (distance * Math.cos(angle * Math.PI / 180));
        const lon = baseLon + (distance * Math.sin(angle * Math.PI / 180));
        
        path.push({
          sol,
          lat,
          lon,
          elevation: 2374 + (sol * 0.1) + (Math.sin(sol / 10) * 5), // Elevation changes
          distance: sol * 0.025 + (Math.random() * 0.01), // Cumulative distance
          activity: sol % 7 === 0 ? 'science' : sol % 3 === 0 ? 'imaging' : 'driving'
        });
      }
      
      setRoverPath(path);
    };

    generateRoverPath();
    
    // Set milestones within current range
    const currentMilestones = MISSION_MILESTONES.filter(m => m.sol <= currentSol);
    setMilestones(currentMilestones);
  }, [currentSol]);

  // Load photo sequence for time-lapse
  const loadPhotoSequence = useCallback(async (startSol, endSol) => {
    setIsLoading(true);
    const sequence = [];
    
    const step = Math.max(1, Math.floor((endSol - startSol) / 20)); // Max 20 photos for performance
    
    for (let sol = startSol; sol <= endSol; sol += step) {
      try {
        const data = await getRoverData(sol);
        if (data && data.cameras && data.cameras.length > 0) {
          const photo = data.cameras[0].images[0]; // Get first available photo
          if (photo) {
            sequence.push({
              sol,
              url: photo.url,
              camera: data.cameras[0].name,
              location: photo.location,
              timestamp: photo.timestamp
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to load photo for sol ${sol}:`, error);
      }
    }
    
    setPhotosSequence(sequence);
    setIsLoading(false);
  }, []);

  // Animation control functions
  const startReplay = useCallback(() => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    setReplaySol(replayRange.start);
    loadPhotoSequence(replayRange.start, replayRange.end);
    
    let currentReplaySol = replayRange.start;
    
    intervalRef.current = setInterval(() => {
      currentReplaySol++;
      setReplaySol(currentReplaySol);
      
      // Update current photo based on sol using ref
      const photo = photosSequenceRef.current.find(p => p.sol <= currentReplaySol);
      if (photo) {
        setCurrentPhoto(photo);
      }
      
      // Check for milestones using ref
      const milestone = milestonesRef.current.find(m => m.sol === currentReplaySol);
      if (milestone) {
        // Trigger milestone celebration
        showMilestoneCelebration(milestone);
      }
      
      if (currentReplaySol >= replayRange.end) {
        stopReplay();
      }
    }, replaySpeed);
  }, [isPlaying, replayRange, replaySpeed, photosSequence, milestones]);

  const stopReplay = useCallback(() => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const showMilestoneCelebration = (milestone) => {
    // Trigger celebration animation
    const event = new CustomEvent('milestone-celebration', { 
      detail: milestone 
    });
    window.dispatchEvent(event);
  };

  // Canvas drawing for rover path visualization
  useEffect(() => {
    if (!canvasRef.current || roverPath.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Clear canvas
    ctx.fillStyle = '#0f1419';
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * rect.width;
      const y = (i / 10) * rect.height;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }
    
    // Calculate bounds for scaling
    const lats = roverPath.map(p => p.lat);
    const lons = roverPath.map(p => p.lon);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    
    // Draw rover path
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    roverPath.forEach((point, index) => {
      const x = ((point.lon - minLon) / (maxLon - minLon)) * rect.width * 0.8 + rect.width * 0.1;
      const y = ((maxLat - point.lat) / (maxLat - minLat)) * rect.height * 0.8 + rect.height * 0.1;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      // Draw activity markers
      if (point.activity === 'science') {
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      } else if (point.activity === 'imaging') {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      // Highlight current replay position
      if (point.sol === replaySol) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw rover icon
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText('🚗', x - 6, y - 8);
      }
    });
    
    ctx.stroke();
    
    // Draw milestones
    milestones.forEach(milestone => {
      const point = roverPath.find(p => p.sol === milestone.sol);
      if (point) {
        const x = ((point.lon - minLon) / (maxLon - minLon)) * rect.width * 0.8 + rect.width * 0.1;
        const y = ((maxLat - point.lat) / (maxLat - minLat)) * rect.height * 0.8 + rect.height * 0.1;
        
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw milestone icon
        ctx.font = '16px Arial';
        ctx.fillText(milestone.icon, x - 8, y - 10);
      }
    });
    
  }, [roverPath, replaySol, milestones]);

  const speedOptions = [
    { value: 2000, label: 'Slow (2s/sol)' },
    { value: 1000, label: 'Normal (1s/sol)' },
    { value: 500, label: 'Fast (0.5s/sol)' },
    { value: 100, label: 'Very Fast (0.1s/sol)' }
  ];

  return (
    <div
      className="bg-slate-900/80 backdrop-blur-sm rounded-lg p-6 border border-slate-700"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-100 font-orbitron">
          🎮 Mission Replay System
        </h2>
        <div className="flex gap-4 items-center">
          <select
            value={replaySpeed}
            onChange={(e) => setReplaySpeed(Number(e.target.value))}
            className="bg-slate-800 text-slate-200 border border-slate-600 rounded px-3 py-1 font-orbitron text-sm"
          >
            {speedOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm text-slate-400 mb-2 font-orbitron">
            Replay Range
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={replayRange.start}
              onChange={(e) => setReplayRange(prev => ({ ...prev, start: Number(e.target.value) }))}
              min="0"
              max={currentSol}
              className="bg-slate-800 text-slate-200 border border-slate-600 rounded px-3 py-1 w-20 text-sm"
            />
            <span className="text-slate-400 py-1">to</span>
            <input
              type="number"
              value={replayRange.end}
              onChange={(e) => setReplayRange(prev => ({ ...prev, end: Number(e.target.value) }))}
              min="0"
              max={currentSol}
              className="bg-slate-800 text-slate-200 border border-slate-600 rounded px-3 py-1 w-20 text-sm"
            />
          </div>
        </div>
        
        <div className="flex gap-2 items-end">
          <button
            onClick={isPlaying ? stopReplay : startReplay}
            disabled={isLoading}
            className={`px-6 py-2 rounded-lg font-orbitron text-sm transition-all ${
              isPlaying
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? '⏳' : isPlaying ? '⏸️ Stop' : '▶️ Play'}
          </button>
          
          <div className="text-sm text-slate-400">
            Sol {replaySol} of {replayRange.end - replayRange.start + 1}
          </div>
        </div>
      </div>

      {/* Main Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rover Path Canvas */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
          <h3 className="text-lg font-orbitron text-slate-200 mb-3">
            🗺️ Rover Journey Path
          </h3>
          <canvas
            ref={canvasRef}
            className="w-full h-64 rounded border border-slate-600"
            style={{ background: '#0f1419' }}
          />
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-400">
            <div><span className="text-blue-400">●</span> Travel Path</div>
            <div><span className="text-green-400">●</span> Science Activity</div>
            <div><span className="text-yellow-400">●</span> Imaging</div>
          </div>
        </div>

        {/* Time-lapse Photography */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
          <h3 className="text-lg font-orbitron text-slate-200 mb-3">
            📸 Time-lapse Photography
          </h3>
          
          <div>
            {currentPhoto ? (
              <div
                key={currentPhoto.sol}
                className="relative"
              >
                <img
                  src={currentPhoto.url}
                  alt={`Mars photo from Sol ${currentPhoto.sol}`}
                  className="w-full h-64 object-cover rounded border border-slate-600"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="hidden w-full h-64 bg-slate-700 rounded border border-slate-600 flex items-center justify-center text-slate-400">
                  📷 Photo unavailable
                </div>
                
                <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-orbitron">
                  Sol {currentPhoto.sol} • {currentPhoto.camera}
                </div>
              </div>
            ) : (
              <div className="w-full h-64 bg-slate-700 rounded border border-slate-600 flex items-center justify-center text-slate-400">
                {isLoading ? (
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    Loading photos...
                  </div>
                ) : (
                  '📷 No photo selected'
                )}
              </div>
            )}
          </div>
          
          <div className="mt-3 text-xs text-slate-400">
            {photosSequence.length > 0 && `${photosSequence.length} photos loaded`}
          </div>
        </div>
      </div>

      {/* Mission Milestones */}
      <div className="mt-6">
        <h3 className="text-lg font-orbitron text-slate-200 mb-3">
          🏆 Mission Milestones
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {milestones.map((milestone, index) => (
            <div
              key={milestone.sol}
              className={`bg-slate-800/50 rounded p-3 border transition-all ${
                milestone.sol === replaySol
                  ? 'border-yellow-500 bg-yellow-500/10'
                  : 'border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{milestone.icon}</span>
                <span className="font-orbitron text-sm text-slate-200">
                  Sol {milestone.sol}
                </span>
              </div>
              <h4 className="font-orbitron text-xs text-slate-300 mb-1">
                {milestone.name}
              </h4>
              <p className="text-xs text-slate-400">
                {milestone.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MissionReplaySystem;