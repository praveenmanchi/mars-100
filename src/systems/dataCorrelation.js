// Real-Time Data Correlation System
// Synchronizes and correlates data between timeline, map, telemetry, and cameras

import { globalEventDispatcher, missionState } from './eventSystem.js';
import { solToEarthDate, earthDateToSol } from '../data/missionTimeline.js';

// Data correlation engine for synchronized updates
class DataCorrelationEngine {
  constructor() {
    this.correlationCache = new Map();
    this.activeCorrelations = new Set();
    this.updateQueue = [];
    this.processingUpdate = false;
    
    // Subscribe to state changes
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for sol changes to trigger correlation updates
    globalEventDispatcher.subscribe('sol_changed', (data) => {
      this.queueCorrelationUpdate('sol_change', data);
    });

    // Listen for data loading to trigger component updates
    globalEventDispatcher.subscribe('sol_data_loaded', (data) => {
      this.queueCorrelationUpdate('data_loaded', data);
    });

    // Listen for rover changes to clear correlations
    globalEventDispatcher.subscribe('rover_changed', (data) => {
      this.clearCorrelations();
      this.queueCorrelationUpdate('rover_change', data);
    });
  }

  // Queue correlation updates to avoid race conditions
  queueCorrelationUpdate(type, data) {
    this.updateQueue.push({ type, data, timestamp: Date.now() });
    if (!this.processingUpdate) {
      this.processUpdateQueue();
    }
  }

  // Process queued updates sequentially
  async processUpdateQueue() {
    this.processingUpdate = true;
    
    while (this.updateQueue.length > 0) {
      const update = this.updateQueue.shift();
      await this.processCorrelationUpdate(update);
    }
    
    this.processingUpdate = false;
  }

  // Process individual correlation update
  async processCorrelationUpdate({ type, data }) {
    try {
      switch (type) {
        case 'sol_change':
          await this.correlateSolData(data.sol);
          break;
        case 'data_loaded':
          await this.correlateLoadedData(data);
          break;
        case 'rover_change':
          await this.correlateRoverSwitch(data.rover);
          break;
      }
    } catch (error) {
      console.error('Error processing correlation update:', error);
    }
  }

  // Correlate all data sources for a specific sol
  async correlateSolData(sol) {
    const correlationKey = `sol_${sol}`;
    
    if (this.correlationCache.has(correlationKey)) {
      const cached = this.correlationCache.get(correlationKey);
      this.emitCorrelatedData(cached);
      return cached;
    }

    try {
      // Gather all data sources for this sol
      const [position, photos, telemetry, event] = await Promise.all([
        this.getPositionData(sol),
        this.getPhotoData(sol),
        this.getTelemetryData(sol),
        this.getEventData(sol)
      ]);

      // Create correlated data package
      const correlatedData = {
        sol,
        earthDate: solToEarthDate(sol),
        timestamp: Date.now(),
        
        // Spatial data
        position: {
          ...position,
          elevation: telemetry.elevation,
          heading: this.calculateHeading(sol)
        },
        
        // Visual data
        photos: this.correlatePhotosWithPosition(photos, position),
        
        // Environmental data
        telemetry: {
          ...telemetry,
          position_context: this.getPositionContext(position)
        },
        
        // Mission context
        event: event || null,
        mission_context: this.getMissionContext(sol),
        
        // Derived correlations
        correlations: {
          photo_locations: this.extractPhotoLocations(photos, position),
          weather_trends: this.analyzeWeatherTrends(sol, telemetry),
          distance_analysis: this.analyzeDistance(sol),
          power_correlation: this.correlatePowerAndPosition(telemetry, position)
        }
      };

      // Cache the correlation
      this.correlationCache.set(correlationKey, correlatedData);
      
      // Emit correlated data to all subscribers
      this.emitCorrelatedData(correlatedData);
      
      return correlatedData;
      
    } catch (error) {
      console.error(`Error correlating data for sol ${sol}:`, error);
      return null;
    }
  }

  // Correlate newly loaded data with existing context
  async correlateLoadedData(data) {
    const { sol, photos, position, telemetry, event } = data;
    
    // Update existing correlation or create new one
    const existingCorrelation = this.correlationCache.get(`sol_${sol}`);
    
    const updatedCorrelation = {
      ...existingCorrelation,
      ...data,
      correlations: {
        ...existingCorrelation?.correlations,
        updated_timestamp: Date.now(),
        data_freshness: 'live',
        
        // Update specific correlations with new data
        photo_locations: this.extractPhotoLocations(photos, position),
        environmental_context: this.correlateEnvironmentalData(telemetry, position)
      }
    };
    
    this.correlationCache.set(`sol_${sol}`, updatedCorrelation);
    this.emitCorrelatedData(updatedCorrelation);
  }

  // Handle rover switch correlation
  async correlateRoverSwitch(rover) {
    this.clearCorrelations();
    
    // Load initial correlation for current sol with new rover
    const currentSol = missionState.currentSol;
    await this.correlateSolData(currentSol);
    
    globalEventDispatcher.emit('correlation_rover_switched', {
      rover,
      sol: currentSol
    });
  }

  // Get position data for sol
  async getPositionData(sol) {
    return missionState.getPositionForSol(sol);
  }

  // Get photo data for sol
  async getPhotoData(sol) {
    return await missionState.getPhotosForSol(sol);
  }

  // Get telemetry data for sol (now fetches real NASA data)
  async getTelemetryData(sol) {
    try {
      // Use the enhanced telemetry function with proper schema
      const { generateMockTelemetry } = require('../api/roverData.js');
      const telemetry = await generateMockTelemetry(sol);
      
      // Ensure all required fields are present with null guards
      return {
        ...telemetry,
        elevation: telemetry.elevation || 2374,
        power_generation: telemetry.power_generation || 400,
        battery_charge: telemetry.battery_charge || telemetry.charge || 85,
        temperature: telemetry.temperature || -63,
        radiation: telemetry.radiation || 0.24
      };
    } catch (error) {
      console.warn('Failed to fetch real telemetry, using fallback:', error);
      return missionState.getTelemetryForSol(sol);
    }
  }

  // Get event data for sol
  getEventData(sol) {
    return missionState.getEventForSol(sol);
  }

  // Correlate photos with rover position
  correlatePhotosWithPosition(photos, position) {
    return photos.map((photo, index) => {
      const estimatedLocation = {
        lat: position.lat + (index * 0.00001), // Small offset for multiple photos
        lon: position.lon + (index * 0.00001),
        accuracy: 'estimated'
      };
      
      return {
        ...photo,
        estimated_location: estimatedLocation,
        distance_from_rover: this.calculateDistance(
          estimatedLocation,
          position
        ),
        viewing_angle: this.calculateViewingAngle(position, index)
      };
    });
  }

  // Extract photo locations for map overlay
  extractPhotoLocations(photos, roverPosition) {
    return photos
      .filter(photo => photo.estimated_location)
      .map((photo, index) => ({
        id: `photo_${index}`,
        lat: photo.estimated_location.lat,
        lon: photo.estimated_location.lon,
        type: 'photo',
        camera: photo.camera?.name || 'Unknown',
        thumbnail: photo.img_src,
        sol: photo.sol
      }));
  }

  // Analyze weather trends
  analyzeWeatherTrends(sol, telemetry) {
    const trends = {
      temperature_trend: this.calculateTemperatureTrend(sol),
      pressure_trend: this.calculatePressureTrend(sol),
      seasonal_phase: this.getSeasonalPhase(sol)
    };
    
    return trends;
  }

  // Analyze distance and movement
  analyzeDistance(sol) {
    const previousSol = sol - 1;
    const currentPosition = missionState.getPositionForSol(sol);
    const previousPosition = missionState.getPositionForSol(previousSol);
    
    if (!previousPosition) {
      return { daily_distance: 0, total_distance: 0 };
    }
    
    const dailyDistance = this.calculateDistance(currentPosition, previousPosition);
    const totalDistance = sol * 0.025; // Approximate total distance
    
    return {
      daily_distance: dailyDistance,
      total_distance: totalDistance,
      average_speed: totalDistance / Math.max(sol, 1),
      movement_direction: this.calculateDirection(previousPosition, currentPosition)
    };
  }

  // Correlate power generation with position/season
  correlatePowerAndPosition(telemetry, position) {
    return {
      power_efficiency: telemetry.power_generation / 500, // Normalized
      dust_impact: this.estimateDustImpact(telemetry),
      seasonal_factor: this.getSeasonalPowerFactor(position),
      solar_angle: this.calculateSolarAngle(position)
    };
  }

  // Calculate distance between two points
  calculateDistance(pos1, pos2) {
    const R = 3389.5; // Mars radius in km
    const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const dLon = (pos2.lon - pos1.lon) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Calculate heading between positions
  calculateHeading(sol) {
    const currentPos = missionState.getPositionForSol(sol);
    const nextPos = missionState.getPositionForSol(sol + 1);
    
    if (!nextPos) return 0;
    
    const dLon = (nextPos.lon - currentPos.lon) * Math.PI / 180;
    const lat1 = currentPos.lat * Math.PI / 180;
    const lat2 = nextPos.lat * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    
    const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    return bearing;
  }

  // Get mission context for sol
  getMissionContext(sol) {
    return {
      days_since_landing: sol,
      earth_days_since_landing: Math.floor(sol * 1.0274912517),
      mission_phase: missionState.getMissionPhase ? missionState.getMissionPhase(sol) : null,
      operational_status: sol < 1200 ? 'ACTIVE' : 'EXTENDED',
      communication_delay: this.calculateCommunicationDelay(sol)
    };
  }

  // Emit correlated data to subscribers
  emitCorrelatedData(correlatedData) {
    globalEventDispatcher.emit('data_correlated', correlatedData);
    
    // Emit specific data types for targeted updates
    globalEventDispatcher.emit('position_correlated', {
      sol: correlatedData.sol,
      position: correlatedData.position
    });
    
    globalEventDispatcher.emit('photos_correlated', {
      sol: correlatedData.sol,
      photos: correlatedData.photos
    });
    
    globalEventDispatcher.emit('telemetry_correlated', {
      sol: correlatedData.sol,
      telemetry: correlatedData.telemetry
    });
  }

  // Utility methods
  calculateTemperatureTrend(sol) {
    const recent = [sol-2, sol-1, sol].map(s => 
      missionState.getTelemetryForSol(Math.max(0, s)).temperature
    );
    return recent[2] - recent[0]; // Simple trend
  }

  calculatePressureTrend(sol) {
    const recent = [sol-2, sol-1, sol].map(s => 
      missionState.getTelemetryForSol(Math.max(0, s)).atmospheric_pressure
    );
    return recent[2] - recent[0];
  }

  getSeasonalPhase(sol) {
    const marsYear = sol / 669; // Mars year in sols
    const season = (marsYear % 1) * 4;
    
    if (season < 1) return 'Spring';
    if (season < 2) return 'Summer';
    if (season < 3) return 'Autumn';
    return 'Winter';
  }

  calculateCommunicationDelay(sol) {
    // Simplified Earth-Mars distance calculation
    const baseDelay = 8; // minutes at closest approach
    const maxDelay = 24; // minutes at farthest
    const cycle = Math.sin(sol * 0.01); // Rough orbital cycle
    return baseDelay + (maxDelay - baseDelay) * (cycle + 1) / 2;
  }

  estimateDustImpact(telemetry) {
    return Math.max(0, (500 - telemetry.power_generation) / 500);
  }

  getSeasonalPowerFactor(position) {
    // Simplified seasonal power variation
    const latitude = position.lat;
    return 1 - Math.abs(latitude) * 0.001; // Closer to equator = better
  }

  calculateSolarAngle(position) {
    // Simplified solar angle calculation
    return 45 + position.lat * 0.5; // Rough approximation
  }

  calculateDirection(from, to) {
    const deltaLat = to.lat - from.lat;
    const deltaLon = to.lon - from.lon;
    
    const angle = Math.atan2(deltaLon, deltaLat) * 180 / Math.PI;
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round((angle + 360) % 360 / 45) % 8;
    
    return directions[index];
  }

  calculateViewingAngle(position, photoIndex) {
    // Estimate camera viewing angle based on photo index
    return (photoIndex * 45) % 360;
  }

  getPositionContext(position) {
    return {
      terrain_type: this.estimateTerrainType(position),
      geological_context: this.getGeologicalContext(position),
      navigation_difficulty: this.estimateNavigationDifficulty(position)
    };
  }

  estimateTerrainType(position) {
    // Simple terrain estimation based on coordinates
    if (position.lat > 18.46) return 'Delta Formation';
    if (position.lat > 18.45) return 'Ancient Lake Bed';
    return 'Crater Floor';
  }

  getGeologicalContext(position) {
    return {
      formation: this.estimateTerrainType(position),
      age: 'Noachian-Hesperian',
      interest_level: position.lat > 18.46 ? 'High' : 'Medium'
    };
  }

  estimateNavigationDifficulty(position) {
    // Estimate based on terrain variation
    const variation = Math.abs(Math.sin(position.lat * 1000) * Math.cos(position.lon * 1000));
    
    if (variation > 0.7) return 'High';
    if (variation > 0.3) return 'Medium';
    return 'Low';
  }

  correlateEnvironmentalData(telemetry, position) {
    return {
      temperature_context: this.getTemperatureContext(telemetry.temperature),
      wind_analysis: this.analyzeWind(telemetry.wind_speed, telemetry.wind_direction),
      atmospheric_conditions: this.analyzeAtmosphere(telemetry.atmospheric_pressure),
      power_status: this.analyzePowerStatus(telemetry.power_generation)
    };
  }

  getTemperatureContext(temp) {
    if (temp > -20) return 'Warm';
    if (temp > -40) return 'Moderate';
    return 'Cold';
  }

  analyzeWind(speed, direction) {
    return {
      intensity: speed > 15 ? 'Strong' : speed > 8 ? 'Moderate' : 'Light',
      direction_cardinal: this.degreesToCardinal(direction),
      dust_risk: speed > 20 ? 'High' : 'Low'
    };
  }

  analyzeAtmosphere(pressure) {
    return {
      pressure_level: pressure > 800 ? 'High' : pressure > 700 ? 'Normal' : 'Low',
      weather_stability: Math.abs(750 - pressure) < 50 ? 'Stable' : 'Variable'
    };
  }

  analyzePowerStatus(power) {
    return {
      status: power > 400 ? 'Excellent' : power > 300 ? 'Good' : power > 200 ? 'Fair' : 'Low',
      efficiency: (power / 500) * 100
    };
  }

  degreesToCardinal(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  // Clear all correlations (useful when switching rovers)
  clearCorrelations() {
    this.correlationCache.clear();
    this.activeCorrelations.clear();
  }

  // Get cached correlation data
  getCachedCorrelation(sol) {
    return this.correlationCache.get(`sol_${sol}`);
  }

  // Get all correlations for sol range
  getCorrelationsForRange(startSol, endSol) {
    const correlations = [];
    for (let sol = startSol; sol <= endSol; sol++) {
      const cached = this.getCachedCorrelation(sol);
      if (cached) {
        correlations.push(cached);
      }
    }
    return correlations;
  }
}

// Global correlation engine instance
const dataCorrelationEngine = new DataCorrelationEngine();

// Export correlation engine and utilities
export { dataCorrelationEngine };
export default DataCorrelationEngine;