// Interactive Event System for Timeline and Map Synchronization
// Handles click events, data synchronization, and component communication

import NASAApiService from '../api/nasaApiService.js';
import { MISSION_EVENTS, generateRoverPath, getMissionPhase } from '../data/missionTimeline.js';
import { getCurrentMaxSol } from '../utils/nasaManifestUtils.js';

// Central event dispatcher for component synchronization
class EventDispatcher {
  constructor() {
    this.listeners = new Map();
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error);
        }
      });
    }
  }

  clear() {
    this.listeners.clear();
  }
}

// Global event dispatcher instance
const globalEventDispatcher = new EventDispatcher();

// Mission state manager - central source of truth
class MissionStateManager {
  constructor() {
    this.currentSol = 1650; // Higher default fallback, will be updated with real NASA data
    this.maxSol = 1650; // Higher default fallback, will be updated with real NASA max_sol
    this.currentRover = 'perseverance';
    this.selectedEvent = null;
    this.autoPlay = false;
    this.playbackSpeed = 1000; // milliseconds per sol
    this.playbackInterval = null;
    this.nasaApiService = new NASAApiService();
    
    // Cache for loaded data
    this.dataCache = {
      photos: new Map(),
      telemetry: new Map(),
      positions: new Map()
    };
    
    // Initialize with real NASA max_sol first, then load data
    this.loadRealMaxSol();
  }

  // Removed loadInitialData() - data loading now happens after getting real max_sol

  // Load real NASA max_sol and set current sol to latest
  async loadRealMaxSol() {
    try {
      const realMaxSol = await getCurrentMaxSol('perseverance');
      this.maxSol = realMaxSol;
      // Emit max_sol_updated first to notify components about new max
      globalEventDispatcher.emit('max_sol_updated', {
        maxSol: realMaxSol,
        currentSol: realMaxSol
      });
      // Now update current sol to the latest real sol and emit sol_changed to load data
      await this.updateSol(realMaxSol, true);
    } catch (error) {
      console.warn('Failed to load real max_sol, using fallback:', error);
      // Keep default fallback values and load initial data at fallback sol
      await this.updateSol(this.currentSol, true);
    }
  }

  // Update current sol and trigger data loading
  async updateSol(newSol, emitEvents = true) {
    if (newSol === this.currentSol && emitEvents) return; // Only skip if already loaded AND emitting events
    
    const previousSol = this.currentSol;
    this.currentSol = newSol;
    
    // Emit sol change event
    if (emitEvents) {
      globalEventDispatcher.emit('sol_changed', {
        sol: newSol,
        previousSol,
        rover: this.currentRover
      });
    }
    
    // Load data for new sol
    await this.loadSolData(newSol);
  }

  // Load comprehensive data for specific sol
  async loadSolData(sol) {
    try {
      const [photos, position, event, telemetry] = await Promise.all([
        this.getPhotosForSol(sol),
        this.getPositionForSol(sol),
        this.getEventForSol(sol),
        this.getTelemetryForSol(sol)
      ]);

      const solData = {
        sol,
        photos,
        position,
        event,
        telemetry,
        phase: getMissionPhase(sol),
        timestamp: Date.now()
      };

      // Cache the data
      this.dataCache.photos.set(sol, photos);
      this.dataCache.telemetry.set(sol, telemetry);
      this.dataCache.positions.set(sol, position);

      // Emit data loaded event
      globalEventDispatcher.emit('sol_data_loaded', solData);

      return solData;
    } catch (error) {
      console.error(`Error loading data for sol ${sol}:`, error);
      globalEventDispatcher.emit('data_error', { sol, error: error.message });
      return null;
    }
  }

  // Get photos for specific sol (with caching)
  async getPhotosForSol(sol) {
    const cached = this.dataCache.photos.get(sol);
    if (cached) return cached;

    try {
      const data = await this.nasaApiService.getPhotosForSol(this.currentRover, sol);
      return data.photos || [];
    } catch (error) {
      console.warn(`Could not fetch photos for sol ${sol}:`, error.message);
      return [];
    }
  }

  // Get rover position for specific sol
  getPositionForSol(sol) {
    const cached = this.dataCache.positions.get(sol);
    if (cached) return cached;

    // Generate position from mission timeline
    const path = generateRoverPath(this.currentRover, sol);
    const position = path.find(p => p.sol === sol) || path[path.length - 1];
    
    this.dataCache.positions.set(sol, position);
    return position;
  }

  // Get mission event for specific sol
  getEventForSol(sol) {
    return MISSION_EVENTS[sol] || null;
  }

  // Generate realistic telemetry for sol
  getTelemetryForSol(sol) {
    const cached = this.dataCache.telemetry.get(sol);
    if (cached) return cached;

    // Generate realistic telemetry data
    const telemetry = {
      battery_charge: Math.max(30, 90 - (sol * 0.01) + (15 * Math.sin(sol * 0.5))),
      temperature: -28 + (10 * Math.sin(sol * 0.017)) + (25 * Math.sin(sol * 2.0)),
      wind_speed: 5 + (10 * Math.sin(sol * 0.1)),
      wind_direction: (sol * 15) % 360,
      radiation: 0.24 + (0.03 * Math.sin(sol * 0.1)),
      atmospheric_pressure: 750 + (50 * Math.sin(sol * 0.02)),
      distance_traveled: sol * 0.025, // km
      elevation: 2374 + (sol * 0.1), // meters
      sol_duration: 24.6, // hours
      power_generation: Math.max(100, 500 - (sol * 0.1) + (100 * Math.sin(sol * 0.3)))
    };

    this.dataCache.telemetry.set(sol, telemetry);
    return telemetry;
  }

  // Timeline auto-play controls
  startAutoPlay(speed = 1000) {
    if (this.playbackInterval) {
      this.stopAutoPlay();
    }
    
    this.autoPlay = true;
    this.playbackSpeed = speed;
    
    this.playbackInterval = setInterval(() => {
      if (this.currentSol < this.maxSol) { // Use real max sol
        this.updateSol(this.currentSol + 1);
      } else {
        this.stopAutoPlay();
      }
    }, speed);
    
    globalEventDispatcher.emit('autoplay_started', { speed });
  }

  stopAutoPlay() {
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
    
    this.autoPlay = false;
    globalEventDispatcher.emit('autoplay_stopped');
  }

  // Navigation controls
  jumpSols(deltaS) {
    const newSol = Math.max(0, Math.min(this.maxSol, this.currentSol + deltaS));
    this.updateSol(newSol);
  }

  jumpToSol(targetSol) {
    const clampedSol = Math.max(0, Math.min(this.maxSol, targetSol));
    this.updateSol(clampedSol);
  }

  jumpToEvent(eventSol) {
    const event = MISSION_EVENTS[eventSol];
    if (event) {
      this.selectedEvent = { sol: eventSol, ...event };
      this.jumpToSol(eventSol);
      
      globalEventDispatcher.emit('event_selected', {
        sol: eventSol,
        event: this.selectedEvent
      });
    }
  }

  // Rover switching
  async switchRover(newRover) {
    if (newRover === this.currentRover) return;
    
    this.currentRover = newRover;
    this.dataCache.photos.clear();
    this.dataCache.telemetry.clear();
    
    globalEventDispatcher.emit('rover_changed', { rover: newRover });
    await this.loadSolData(this.currentSol);
  }

  // Get current state
  getCurrentState() {
    return {
      sol: this.currentSol,
      rover: this.currentRover,
      selectedEvent: this.selectedEvent,
      autoPlay: this.autoPlay,
      playbackSpeed: this.playbackSpeed,
      position: this.getPositionForSol(this.currentSol),
      phase: getMissionPhase(this.currentSol)
    };
  }
}

// Global mission state instance
const missionState = new MissionStateManager();

// Interactive event handlers for UI components
export class InteractiveEventHandlers {
  constructor() {
    this.state = missionState;
    this.dispatcher = globalEventDispatcher;
  }

  // Timeline click handler
  onTimelineClick(sol, eventType = null) {
    if (eventType === 'event') {
      this.state.jumpToEvent(sol);
    } else {
      this.state.jumpToSol(sol);
    }
  }

  // Timeline navigation controls
  onTimelineNavigation(action) {
    switch (action) {
      case 'play':
        this.state.startAutoPlay();
        break;
      case 'pause':
        this.state.stopAutoPlay();
        break;
      case 'step_back':
        this.state.jumpSols(-1);
        break;
      case 'step_forward':
        this.state.jumpSols(1);
        break;
      case 'jump_back_10':
        this.state.jumpSols(-10);
        break;
      case 'jump_forward_10':
        this.state.jumpSols(10);
        break;
      case 'jump_back_50':
        this.state.jumpSols(-50);
        break;
      case 'jump_forward_50':
        this.state.jumpSols(50);
        break;
    }
  }

  // Map click handler (rover position, waypoints)
  onMapClick(coordinates, solData = null) {
    if (solData && solData.sol) {
      this.onTimelineClick(solData.sol, solData.type);
    }
  }

  // Camera gallery click handler
  onCameraClick(photo, sol) {
    this.dispatcher.emit('photo_selected', {
      photo,
      sol,
      coordinates: photo.location || this.state.getPositionForSol(sol)
    });
  }

  // Telemetry chart click handler
  onTelemetryClick(metric, value, sol) {
    this.dispatcher.emit('telemetry_selected', {
      metric,
      value,
      sol
    });
  }

  // Event filter handler
  onEventFilter(filterType, enabled) {
    this.dispatcher.emit('event_filter_changed', {
      filterType,
      enabled
    });
  }

  // Subscribe to state changes
  subscribeToStateChanges(callback) {
    const unsubscribers = [
      this.dispatcher.subscribe('sol_changed', callback),
      this.dispatcher.subscribe('sol_data_loaded', callback),
      this.dispatcher.subscribe('rover_changed', callback),
      this.dispatcher.subscribe('event_selected', callback),
      this.dispatcher.subscribe('autoplay_started', callback),
      this.dispatcher.subscribe('autoplay_stopped', callback)
    ];
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }
}

// Export global instances and classes
export { globalEventDispatcher, missionState };
export default InteractiveEventHandlers;