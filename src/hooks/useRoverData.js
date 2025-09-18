import { useState, useEffect, useCallback } from 'react';
import { getRoverData } from '../api/roverData';
import unifiedCache from '../api/unifiedCacheSystem';

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

/**
 * Custom hook for managing rover data fetching and state
 * Encapsulates all data fetching logic, caching, and live updates
 */
const useRoverData = () => {
  const [roverData, setRoverData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSol, setSelectedSol] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [isLiveMode, setIsLiveMode] = useState(true);
  
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
    }, LIVE_UPDATE_INTERVAL);
    
    return () => clearInterval(interval);
  }, [selectedSol, isLiveMode, fetchRoverData]);
  
  // Initial data fetch
  useEffect(() => {
    fetchRoverData();
  }, [fetchRoverData]);
  
  return {
    roverData,
    loading,
    error,
    selectedSol,
    setSelectedSol,
    lastUpdateTime,
    fetchRoverData,
    isLiveMode,
    setIsLiveMode
  };
};

export default useRoverData;