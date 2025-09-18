// Comprehensive Performance Monitoring System
// Real-time metrics, health monitoring, and optimization insights for NASA API

import unifiedCache from './unifiedCacheSystem.js';

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      // API Performance
      apiRequests: {
        total: 0,
        successful: 0,
        failed: 0,
        totalTime: 0,
        requests: []
      },
      
      // Cache Performance  
      cache: {
        hits: 0,
        misses: 0,
        evictions: 0,
        size: 0
      },
      
      // Error Tracking
      errors: {
        total: 0,
        byType: {},
        recent: []
      },
      
      // System Health
      health: {
        status: 'healthy',
        lastCheck: Date.now(),
        uptime: Date.now(),
        memoryUsage: 0
      }
    };
    
    this.startPerformanceCollection();
  }

  // Record API request performance
  recordApiRequest(duration, success, endpoint, errorType = null) {
    const now = Date.now();
    
    this.metrics.apiRequests.total++;
    this.metrics.apiRequests.totalTime += duration;
    
    if (success) {
      this.metrics.apiRequests.successful++;
    } else {
      this.metrics.apiRequests.failed++;
      this.recordError(errorType, endpoint);
    }
    
    this.metrics.apiRequests.requests.push({
      timestamp: now,
      duration,
      success,
      endpoint,
      errorType
    });
    
    // Keep only last 100 requests for memory efficiency
    if (this.metrics.apiRequests.requests.length > 100) {
      this.metrics.apiRequests.requests.shift();
    }
  }

  // Record cache performance
  recordCacheHit() {
    this.metrics.cache.hits++;
  }

  recordCacheMiss() {
    this.metrics.cache.misses++;
  }

  recordCacheEviction() {
    this.metrics.cache.evictions++;
  }

  // Record errors with categorization
  recordError(type, context = null) {
    this.metrics.errors.total++;
    
    if (!this.metrics.errors.byType[type]) {
      this.metrics.errors.byType[type] = 0;
    }
    this.metrics.errors.byType[type]++;
    
    this.metrics.errors.recent.push({
      type,
      context,
      timestamp: Date.now()
    });
    
    // Keep only last 50 errors
    if (this.metrics.errors.recent.length > 50) {
      this.metrics.errors.recent.shift();
    }
  }

  // Get comprehensive performance report
  getPerformanceReport() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const cacheMetrics = unifiedCache.getMetrics();
    
    // Calculate recent performance (last hour)
    const recentRequests = this.metrics.apiRequests.requests.filter(
      req => req.timestamp > oneHourAgo
    );
    
    const recentSuccessful = recentRequests.filter(req => req.success).length;
    const recentFailed = recentRequests.filter(req => !req.success).length;
    const recentAvgTime = recentRequests.length > 0 
      ? recentRequests.reduce((sum, req) => sum + req.duration, 0) / recentRequests.length
      : 0;

    return {
      timestamp: now,
      
      // Overall API Performance
      api: {
        totalRequests: this.metrics.apiRequests.total,
        successRate: this.metrics.apiRequests.total > 0 
          ? Math.round((this.metrics.apiRequests.successful / this.metrics.apiRequests.total) * 100)
          : 0,
        averageResponseTime: this.metrics.apiRequests.total > 0
          ? Math.round(this.metrics.apiRequests.totalTime / this.metrics.apiRequests.total)
          : 0,
        
        // Recent performance (last hour)
        recent: {
          requests: recentRequests.length,
          successful: recentSuccessful,
          failed: recentFailed,
          averageTime: Math.round(recentAvgTime),
          successRate: recentRequests.length > 0 
            ? Math.round((recentSuccessful / recentRequests.length) * 100) 
            : 0
        }
      },
      
      // Cache Performance (from unified cache)
      cache: {
        ...cacheMetrics.cache,
        hitRate: cacheMetrics.cache.hitRate,
        efficiency: this.calculateCacheEfficiency(cacheMetrics)
      },
      
      // Error Analysis
      errors: {
        total: this.metrics.errors.total,
        rate: this.metrics.apiRequests.total > 0 
          ? Math.round((this.metrics.errors.total / this.metrics.apiRequests.total) * 100)
          : 0,
        byType: this.metrics.errors.byType,
        recentCount: this.metrics.errors.recent.filter(
          err => err.timestamp > oneHourAgo
        ).length
      },
      
      // System Health
      health: {
        ...this.metrics.health,
        uptime: Math.round((now - this.metrics.health.uptime) / 1000), // seconds
        memoryUsage: this.estimateMemoryUsage()
      },
      
      // Performance Insights
      insights: this.generatePerformanceInsights(recentRequests, cacheMetrics)
    };
  }

  // Calculate cache efficiency score
  calculateCacheEfficiency(cacheMetrics) {
    const hitRate = cacheMetrics.cache.hitRate / 100;
    const memoryEfficiency = Math.max(0, 1 - (cacheMetrics.cache.totalMemory / (10 * 1024 * 1024))); // 10MB baseline
    const requestReduction = Math.min(1, cacheMetrics.cache.hits / Math.max(1, cacheMetrics.requests.total));
    
    return Math.round(((hitRate * 0.5) + (memoryEfficiency * 0.2) + (requestReduction * 0.3)) * 100);
  }

  // Generate actionable performance insights
  generatePerformanceInsights(recentRequests, cacheMetrics) {
    const insights = [];
    
    // API Performance Insights
    if (recentRequests.length > 0) {
      const avgTime = recentRequests.reduce((sum, req) => sum + req.duration, 0) / recentRequests.length;
      const slowRequests = recentRequests.filter(req => req.duration > 5000).length;
      
      if (avgTime > 3000) {
        insights.push({
          type: 'warning',
          category: 'api_performance',
          message: `API response times are elevated (${Math.round(avgTime)}ms average)`,
          recommendation: 'Consider implementing request batching or checking network conditions'
        });
      }
      
      if (slowRequests > recentRequests.length * 0.1) {
        insights.push({
          type: 'alert',
          category: 'api_performance', 
          message: `${slowRequests} slow requests detected (>5s response time)`,
          recommendation: 'Check API rate limits and implement request throttling'
        });
      }
    }
    
    // Cache Insights
    if (cacheMetrics.cache.hitRate < 70) {
      insights.push({
        type: 'optimization',
        category: 'cache_performance',
        message: `Cache hit rate is ${cacheMetrics.cache.hitRate}% (target: >70%)`,
        recommendation: 'Review cache TTL settings and access patterns'
      });
    }
    
    if (cacheMetrics.cache.size > 500) {
      insights.push({
        type: 'warning',
        category: 'cache_management',
        message: `Cache size is large (${cacheMetrics.cache.size} entries)`,
        recommendation: 'Consider implementing more aggressive cache eviction policies'
      });
    }
    
    // Error Rate Insights
    const errorRate = this.metrics.apiRequests.total > 0 
      ? (this.metrics.apiRequests.failed / this.metrics.apiRequests.total) * 100 
      : 0;
      
    if (errorRate > 5) {
      insights.push({
        type: 'alert',
        category: 'error_rate',
        message: `Error rate is ${Math.round(errorRate)}% (target: <5%)`,
        recommendation: 'Review error handling and implement more robust fallback mechanisms'
      });
    }
    
    // Success insights
    if (cacheMetrics.cache.hitRate > 85) {
      insights.push({
        type: 'success',
        category: 'cache_performance',
        message: `Excellent cache performance (${cacheMetrics.cache.hitRate}% hit rate)`,
        recommendation: 'Current caching strategy is highly effective'
      });
    }
    
    if (recentRequests.length > 0) {
      const successRate = (recentRequests.filter(req => req.success).length / recentRequests.length) * 100;
      if (successRate > 95) {
        insights.push({
          type: 'success',
          category: 'api_reliability',
          message: `High API reliability (${Math.round(successRate)}% success rate)`,
          recommendation: 'API error handling is working effectively'
        });
      }
    }
    
    return insights;
  }

  // Get real-time health status
  getHealthStatus() {
    const cacheMetrics = unifiedCache.getMetrics();
    const now = Date.now();
    const recentErrors = this.metrics.errors.recent.filter(
      err => (now - err.timestamp) < (15 * 60 * 1000) // Last 15 minutes
    ).length;
    
    let status = 'healthy';
    let issues = [];
    
    // Check various health indicators
    if (recentErrors > 10) {
      status = 'degraded';
      issues.push('High error rate detected');
    }
    
    if (cacheMetrics.cache.hitRate < 50) {
      status = status === 'healthy' ? 'degraded' : 'unhealthy';
      issues.push('Low cache efficiency');
    }
    
    if (cacheMetrics.requests.pending > 10) {
      status = 'degraded';
      issues.push('High pending request count');
    }
    
    return {
      status,
      timestamp: now,
      uptime: Math.round((now - this.metrics.health.uptime) / 1000),
      issues,
      metrics: {
        cacheHitRate: cacheMetrics.cache.hitRate,
        pendingRequests: cacheMetrics.requests.pending,
        recentErrors,
        memoryUsage: this.estimateMemoryUsage()
      }
    };
  }

  // Estimate memory usage
  estimateMemoryUsage() {
    try {
      if (performance && performance.memory) {
        return Math.round(performance.memory.usedJSHeapSize / 1024 / 1024); // MB
      }
    } catch (e) {
      // Performance API not available
    }
    return 0;
  }

  // Start automatic performance collection
  startPerformanceCollection() {
    // Update cache metrics every 30 seconds
    setInterval(() => {
      const cacheMetrics = unifiedCache.getMetrics();
      this.metrics.cache.size = cacheMetrics.cache.size;
      this.metrics.health.lastCheck = Date.now();
    }, 30000);
    
    // Clean old data every 5 minutes
    setInterval(() => {
      this.cleanOldData();
    }, 5 * 60 * 1000);
  }

  // Clean old performance data
  cleanOldData() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // Clean old requests
    this.metrics.apiRequests.requests = this.metrics.apiRequests.requests.filter(
      req => req.timestamp > oneHourAgo
    );
    
    // Clean old errors
    this.metrics.errors.recent = this.metrics.errors.recent.filter(
      err => err.timestamp > oneHourAgo
    );
  }

  // Reset all metrics (useful for testing)
  reset() {
    this.metrics = {
      apiRequests: { total: 0, successful: 0, failed: 0, totalTime: 0, requests: [] },
      cache: { hits: 0, misses: 0, evictions: 0, size: 0 },
      errors: { total: 0, byType: {}, recent: [] },
      health: { status: 'healthy', lastCheck: Date.now(), uptime: Date.now(), memoryUsage: 0 }
    };
  }

  // Export metrics for debugging
  exportMetrics() {
    return {
      raw: this.metrics,
      report: this.getPerformanceReport(),
      health: this.getHealthStatus(),
      cache: unifiedCache.getDebugInfo()
    };
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

export { PerformanceMonitor, performanceMonitor };
export default performanceMonitor;