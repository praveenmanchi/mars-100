// Unified Intelligent Cache System for NASA API
// High-performance caching with hierarchical TTLs, request deduplication, and monitoring

// Import performance monitor for integrated tracking (lazy loaded)
let performanceMonitor = null;

// Lazy load performance monitor
const loadPerformanceMonitor = async () => {
  if (!performanceMonitor) {
    try {
      const module = await import('./performanceMonitor.js');
      performanceMonitor = module.default;
    } catch {
      // Performance monitor not available, continue without it
    }
  }
  return performanceMonitor;
};

class UnifiedCacheSystem {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map(); // Request deduplication
    this.metrics = {
      hits: 0,
      misses: 0,
      requests: 0,
      errors: 0,
      totalRequestTime: 0,
      requestTimestamps: []
    };

    // Cache configuration with hierarchical TTLs
    this.cacheConfig = {
      // Static data - changes infrequently
      static: {
        duration: 60 * 60 * 1000, // 1 hour
        patterns: ['manifest_', 'rover_info_']
      },
      // Semi-static data - changes daily  
      semiStatic: {
        duration: 30 * 60 * 1000, // 30 minutes
        patterns: ['photos_date_', 'latest_']
      },
      // Dynamic data - changes frequently
      dynamic: {
        duration: 5 * 60 * 1000, // 5 minutes
        patterns: ['photos_', 'telemetry_', 'rover-data-']
      },
      // Real-time data - very short TTL
      realTime: {
        duration: 60 * 1000, // 1 minute
        patterns: ['status_', 'live_']
      }
    };

    // Start cleanup interval
    this.startCleanupInterval();
    
    // Start metrics collection
    this.startMetricsCollection();
  }

  // Determine cache type based on key
  getCacheType(key) {
    // Ensure key is a string
    const keyString = String(key);
    for (const [type, config] of Object.entries(this.cacheConfig)) {
      if (config.patterns.some(pattern => keyString.startsWith(pattern))) {
        return type;
      }
    }
    return 'dynamic'; // Default to dynamic if no pattern matches
  }

  // Get cache duration for key
  getCacheDuration(key) {
    const type = this.getCacheType(key);
    return this.cacheConfig[type].duration;
  }

  // Set data in cache with intelligent TTL
  set(key, data, customTTL = null) {
    const duration = customTTL || this.getCacheDuration(key);
    const now = Date.now();
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expires: now + duration,
      accessCount: 0,
      lastAccessed: now,
      size: this.estimateSize(data),
      type: this.getCacheType(key)
    });

    // Update metrics
    this.updateCacheSize();
    return this;
  }

  // Get data from cache with integrated performance monitoring
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) {
      this.metrics.misses++;
      // Wire cache miss to performance monitor
      if (performanceMonitor) {
        performanceMonitor.recordCacheMiss();
      }
      return null;
    }

    const now = Date.now();
    
    // Check expiration
    if (now > cached.expires) {
      this.cache.delete(key);
      this.metrics.misses++;
      // Wire cache miss to performance monitor (expired)
      if (performanceMonitor) {
        performanceMonitor.recordCacheMiss();
        performanceMonitor.recordCacheEviction();
      }
      return null;
    }

    // Update access metadata
    cached.accessCount++;
    cached.lastAccessed = now;
    this.metrics.hits++;
    
    // Wire cache hit to performance monitor
    if (performanceMonitor) {
      performanceMonitor.recordCacheHit();
    }
    
    return cached.data;
  }

  // Request deduplication wrapper
  async deduplicateRequest(key, requestFunction) {
    // Check cache first
    const cached = this.get(key);
    if (cached) {
      return cached;
    }

    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Create new request with timing
    const startTime = Date.now();
    const requestPromise = requestFunction()
      .then(data => {
        const endTime = Date.now();
        const requestTime = endTime - startTime;
        
        // Update metrics
        this.metrics.requests++;
        this.metrics.totalRequestTime += requestTime;
        this.metrics.requestTimestamps.push({
          timestamp: endTime,
          duration: requestTime,
          key
        });

        // Cache successful result
        this.set(key, data);
        
        // Remove from pending requests
        this.pendingRequests.delete(key);
        
        return data;
      })
      .catch(error => {
        this.metrics.errors++;
        this.pendingRequests.delete(key);
        throw error;
      });

    // Store pending request
    this.pendingRequests.set(key, requestPromise);
    
    return requestPromise;
  }

  // Intelligent cache invalidation
  invalidate(pattern) {
    let count = 0;
    for (const [key] of this.cache) {
      if (typeof pattern === 'string' && key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      } else if (pattern instanceof RegExp && pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  // Selective cache warming
  async warmCache(keys, dataFetcher) {
    const promises = keys.map(async key => {
      if (!this.get(key)) {
        try {
          const data = await dataFetcher(key);
          this.set(key, data);
          return { key, success: true };
        } catch (error) {
          return { key, success: false, error: error.message };
        }
      }
      return { key, success: true, cached: true };
    });

    return Promise.all(promises);
  }

  // Cache health and optimization
  optimize() {
    const now = Date.now();
    const optimizations = {
      removed: 0,
      promoted: 0,
      demoted: 0
    };

    for (const [key, cached] of this.cache) {
      // Remove unused entries
      if (cached.accessCount === 0 && (now - cached.timestamp) > (2 * this.getCacheDuration(key))) {
        this.cache.delete(key);
        optimizations.removed++;
        continue;
      }

      // Promote frequently accessed items (extend TTL)
      if (cached.accessCount > 10 && cached.type !== 'static') {
        const currentDuration = cached.expires - cached.timestamp;
        const newExpires = now + (currentDuration * 1.5);
        cached.expires = Math.min(newExpires, now + this.cacheConfig.static.duration);
        optimizations.promoted++;
      }
    }

    return optimizations;
  }

  // Performance metrics and monitoring
  getMetrics() {
    const now = Date.now();
    const recentRequests = this.metrics.requestTimestamps.filter(
      req => (now - req.timestamp) < (60 * 60 * 1000) // Last hour
    );

    const hitRate = this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0;
    const avgRequestTime = this.metrics.totalRequestTime / this.metrics.requests || 0;
    
    return {
      cache: {
        size: this.cache.size,
        hits: this.metrics.hits,
        misses: this.metrics.misses,
        hitRate: Math.round(hitRate * 100),
        totalMemory: this.getTotalMemoryUsage()
      },
      requests: {
        total: this.metrics.requests,
        errors: this.metrics.errors,
        pending: this.pendingRequests.size,
        avgTime: Math.round(avgRequestTime),
        recentCount: recentRequests.length
      },
      performance: {
        requestsPerHour: recentRequests.length,
        averageLatency: this.calculateAverageLatency(recentRequests),
        errorRate: (this.metrics.errors / this.metrics.requests) || 0
      }
    };
  }

  // Estimate memory usage
  estimateSize(data) {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate in bytes
    } catch {
      return 1000; // Default estimate
    }
  }

  getTotalMemoryUsage() {
    let total = 0;
    for (const [, cached] of this.cache) {
      total += cached.size || 0;
    }
    return total;
  }

  calculateAverageLatency(recentRequests) {
    if (recentRequests.length === 0) return 0;
    const totalLatency = recentRequests.reduce((sum, req) => sum + req.duration, 0);
    return Math.round(totalLatency / recentRequests.length);
  }

  updateCacheSize() {
    // Optional: Implement memory pressure handling
    const maxSize = 1000; // Maximum cache entries
    if (this.cache.size > maxSize) {
      this.evictOldest(Math.floor(maxSize * 0.1)); // Remove 10% oldest entries
    }
  }

  evictOldest(count) {
    const entries = Array.from(this.cache.entries())
      .sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed)
      .slice(0, count);
    
    entries.forEach(([key]) => this.cache.delete(key));
  }

  // Automatic cleanup
  startCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, cached] of this.cache) {
        if (now > cached.expires) {
          this.cache.delete(key);
        }
      }
    }, 60 * 1000); // Cleanup every minute
  }

  // Metrics collection
  startMetricsCollection() {
    setInterval(() => {
      const now = Date.now();
      const hourAgo = now - (60 * 60 * 1000);
      
      // Clean old request timestamps
      this.metrics.requestTimestamps = this.metrics.requestTimestamps.filter(
        req => req.timestamp > hourAgo
      );
      
      // Run optimization
      if (this.cache.size > 100) {
        this.optimize();
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // Bulk operations
  setMultiple(entries) {
    const results = [];
    for (const { key, data, ttl } of entries) {
      this.set(key, data, ttl);
      results.push({ key, success: true });
    }
    return results;
  }

  getMultiple(keys) {
    return keys.map(key => ({ key, data: this.get(key) }));
  }

  // Clear cache with patterns
  clear(pattern = null) {
    if (!pattern) {
      this.cache.clear();
      this.pendingRequests.clear();
      return;
    }
    
    return this.invalidate(pattern);
  }

  // Export cache state for debugging
  getDebugInfo() {
    const cacheEntries = Array.from(this.cache.entries()).map(([key, cached]) => ({
      key,
      type: cached.type,
      age: Date.now() - cached.timestamp,
      accessCount: cached.accessCount,
      size: cached.size,
      expires: new Date(cached.expires).toISOString()
    }));

    return {
      entries: cacheEntries,
      pending: Array.from(this.pendingRequests.keys()),
      metrics: this.getMetrics(),
      config: this.cacheConfig
    };
  }
}

// Global unified cache instance
const unifiedCache = new UnifiedCacheSystem();

export { UnifiedCacheSystem, unifiedCache };
export default unifiedCache;