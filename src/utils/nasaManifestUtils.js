// NASA Manifest Utilities - Centralized Sol Data Management
// Single source of truth for max_sol and mission data with event-driven architecture

import NASAApiService from '../api/nasaApiService.js';
import unifiedCache from '../api/unifiedCacheSystem.js';

// Event system for max sol updates
class MaxSolEventDispatcher {
  constructor() {
    this.listeners = new Map();
    this.lastKnownMaxSol = null;
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
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
          console.error(`Error in max sol event callback for ${event}:`, error);
        }
      });
    }
  }
}

// Global max sol event dispatcher
export const maxSolEventDispatcher = new MaxSolEventDispatcher();

const nasaApiService = new NASAApiService();

// Cache duration for manifest data (5 minutes)
const MANIFEST_CACHE_DURATION = 5 * 60 * 1000;

/**
 * Get the current maximum sol from NASA manifest data with centralized caching and events
 * @param {string} rover - The rover name (default: 'perseverance')
 * @param {boolean} emitEvents - Whether to emit events on updates (default: true)
 * @returns {Promise<number>} The current maximum sol number
 */
export const getCurrentMaxSol = async (rover = 'perseverance', emitEvents = true) => {
  try {
    const cacheKey = `current_max_sol_${rover}`;
    const lastKnownKey = `last_known_max_sol_${rover}`;
    
    // Check cache first
    const cached = unifiedCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < MANIFEST_CACHE_DURATION) {
      maxSolEventDispatcher.lastKnownMaxSol = cached.maxSol;
      return cached.maxSol;
    }
    
    // Fetch fresh manifest data
    const manifestData = await nasaApiService.getRoverManifest(rover);
    const maxSol = manifestData.photo_manifest.max_sol;
    
    // Cache the result
    const cacheData = {
      maxSol,
      timestamp: Date.now()
    };
    unifiedCache.set(cacheKey, cacheData);
    
    // Store as last known good value with longer persistence
    unifiedCache.set(lastKnownKey, {
      maxSol,
      timestamp: Date.now(),
      persistent: true
    });
    
    // Update global state and emit events if maxSol changed
    const previousMaxSol = maxSolEventDispatcher.lastKnownMaxSol;
    if (maxSol !== previousMaxSol) {
      maxSolEventDispatcher.lastKnownMaxSol = maxSol;
      if (emitEvents) {
        maxSolEventDispatcher.emit('max_sol_updated', {
          rover,
          maxSol,
          previousMaxSol,
          source: 'NASA_API',
          timestamp: Date.now()
        });
      }
    }
    
    return maxSol;
  } catch (error) {
    console.warn('Failed to fetch current max sol from NASA manifest, using resilient fallback:', error);
    
    // Try to get last known good value from cache first
    const lastKnownKey = `last_known_max_sol_${rover}`;
    const lastKnown = unifiedCache.get(lastKnownKey);
    if (lastKnown && lastKnown.maxSol) {
      console.log('Using last known max sol from cache:', lastKnown.maxSol);
      maxSolEventDispatcher.lastKnownMaxSol = lastKnown.maxSol;
      return lastKnown.maxSol;
    }
    
    // Fallback to higher static value if no cached data available
    const fallbackMaxSol = 1650; // Conservative estimate higher than known mission progress
    maxSolEventDispatcher.lastKnownMaxSol = fallbackMaxSol;
    return fallbackMaxSol;
  }
};

/**
 * Get the full rover manifest data
 * @param {string} rover - The rover name (default: 'perseverance')
 * @returns {Promise<Object>} The complete manifest data
 */
export const getRoverManifest = async (rover = 'perseverance') => {
  try {
    const manifestData = await nasaApiService.getRoverManifest(rover);
    return manifestData.photo_manifest;
  } catch (error) {
    console.warn('Failed to fetch rover manifest:', error);
    // Return fallback manifest structure
    return {
      max_sol: 1650,
      max_date: new Date().toISOString().split('T')[0],
      total_photos: 400000,
      status: 'active',
      landing_date: '2021-02-18'
    };
  }
};

/**
 * Check if a sol number is within the valid mission range
 * @param {number} sol - The sol number to check
 * @param {string} rover - The rover name (default: 'perseverance')
 * @returns {Promise<boolean>} True if the sol is valid
 */
export const isValidSol = async (sol, rover = 'perseverance') => {
  if (sol < 0) return false;
  
  try {
    const maxSol = await getCurrentMaxSol(rover);
    return sol <= maxSol;
  } catch (error) {
    console.warn('Error validating sol:', error);
    return sol <= 1650; // Conservative fallback
  }
};

/**
 * Clamp a sol number to the valid mission range using centralized max sol management
 * @param {number} sol - The sol number to clamp
 * @param {string} rover - The rover name (default: 'perseverance')
 * @returns {Promise<number>} The clamped sol number
 */
export const clampSolToValidRange = async (sol, rover = 'perseverance') => {
  try {
    const maxSol = await getCurrentMaxSol(rover, false); // Don't emit events for clamping operations
    return Math.max(0, Math.min(maxSol, sol));
  } catch (error) {
    console.warn('Error clamping sol, using resilient fallback:', error);
    const fallbackMaxSol = getLastKnownMaxSol(rover) || 1650; // Try cached value first
    return Math.max(0, Math.min(fallbackMaxSol, sol));
  }
};

/**
 * Get mission statistics from manifest data with centralized max sol management
 * @param {string} rover - The rover name (default: 'perseverance')
 * @returns {Promise<Object>} Mission statistics
 */
export const getMissionStats = async (rover = 'perseverance') => {
  try {
    const manifest = await getRoverManifest(rover);
    // Ensure max sol is updated in central system
    await getCurrentMaxSol(rover, true); // Emit events to keep system in sync
    
    return {
      maxSol: manifest.max_sol,
      totalPhotos: manifest.total_photos,
      missionStatus: manifest.status,
      landingDate: manifest.landing_date,
      maxDate: manifest.max_date,
      missionDurationDays: Math.ceil((new Date(manifest.max_date) - new Date(manifest.landing_date)) / (1000 * 60 * 60 * 24))
    };
  } catch (error) {
    console.warn('Error getting mission stats, using resilient fallback:', error);
    
    // Try to get last known max sol from centralized system
    const fallbackMaxSol = await getCurrentMaxSol(rover, false); // Don't emit events for fallback
    
    return {
      maxSol: fallbackMaxSol,
      totalPhotos: Math.max(400000, fallbackMaxSol * 180), // Estimate based on max sol
      missionStatus: 'active',
      landingDate: '2021-02-18',
      maxDate: new Date().toISOString().split('T')[0],
      missionDurationDays: Math.ceil((Date.now() - new Date('2021-02-18')) / (1000 * 60 * 60 * 24))
    };
  }
};

/**
 * Subscribe to max sol updates - centralized event system
 * @param {Function} callback - Callback function to receive max sol updates
 * @param {string} rover - The rover name (default: 'perseverance')
 * @returns {Function} Unsubscribe function
 */
export const subscribeToMaxSolUpdates = (callback, rover = 'perseverance') => {
  return maxSolEventDispatcher.subscribe('max_sol_updated', (data) => {
    if (data.rover === rover) {
      callback(data);
    }
  });
};

/**
 * Get the last known max sol without triggering API calls
 * @param {string} rover - The rover name (default: 'perseverance')
 * @returns {number|null} The last known max sol or null if not available
 */
export const getLastKnownMaxSol = (rover = 'perseverance') => {
  const lastKnownKey = `last_known_max_sol_${rover}`;
  const lastKnown = unifiedCache.get(lastKnownKey);
  return lastKnown?.maxSol || maxSolEventDispatcher.lastKnownMaxSol || null;
};

/**
 * Force refresh of max sol data and emit events
 * @param {string} rover - The rover name (default: 'perseverance')
 * @returns {Promise<number>} The refreshed maximum sol number
 */
export const refreshMaxSol = async (rover = 'perseverance') => {
  const cacheKey = `current_max_sol_${rover}`;
  // Clear cache to force fresh fetch
  unifiedCache.delete(cacheKey);
  return await getCurrentMaxSol(rover, true);
};