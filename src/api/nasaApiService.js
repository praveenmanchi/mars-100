// Optimized NASA API Integration with Unified Caching System
// High-performance API service with intelligent caching and advanced error handling

import unifiedCache from './unifiedCacheSystem.js';
import performanceMonitor from './performanceMonitor.js';

const NASA_BASE_URL = 'https://api.nasa.gov/mars-photos/api/v1';
const NASA_API_KEY = process.env.REACT_APP_NASA_API_KEY || process.env.NASA_API_KEY || 'DEMO_KEY';

// Enhanced rate limiting and exponential backoff retry logic
class APIRateLimit {
  constructor() {
    this.requests = [];
    this.MAX_REQUESTS_PER_HOUR = 1000; // NASA API limit
    
    // Enhanced retry configuration with exponential backoff + jitter
    this.retryConfig = {
      maxAttempts: 4,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      jitter: true,
      jitterMax: 0.1 // 10% jitter
    };
  }

  canMakeRequest() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.requests = this.requests.filter(time => time > oneHourAgo);
    return this.requests.length < this.MAX_REQUESTS_PER_HOUR;
  }

  recordRequest() {
    this.requests.push(Date.now());
  }

  // Calculate exponential backoff delay with jitter
  calculateBackoffDelay(attempt) {
    const exponentialDelay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
    const cappedDelay = Math.min(exponentialDelay, this.retryConfig.maxDelay);
    
    if (this.retryConfig.jitter) {
      const jitterAmount = cappedDelay * this.retryConfig.jitterMax;
      const jitter = (Math.random() - 0.5) * 2 * jitterAmount;
      return Math.max(0, cappedDelay + jitter);
    }
    
    return cappedDelay;
  }

  // Determine if error should be retried based on status code
  shouldRetry(error, attempt) {
    if (attempt >= this.retryConfig.maxAttempts) {
      return false;
    }

    // Parse status code from error
    let statusCode = null;
    if (error.response?.status) {
      statusCode = error.response.status;
    } else if (error.message?.includes('failed:')) {
      const statusMatch = error.message.match(/failed: (\d+)/);
      if (statusMatch) {
        statusCode = parseInt(statusMatch[1]);
      }
    }

    if (statusCode) {
      // Retry 429 (rate limit) and 5xx (server errors)
      if (statusCode === 429 || (statusCode >= 500 && statusCode < 600)) {
        return true;
      }
      
      // Don't retry 4xx client errors (except 429)
      if (statusCode >= 400 && statusCode < 500) {
        return false;
      }
    }

    // Retry network errors and unknown errors
    return true;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Enhanced error categorization
  categorizeError(error, statusCode) {
    if (statusCode === 429) {
      return { type: 'RATE_LIMIT', retryable: true, category: 'throttling' };
    } else if (statusCode === 403) {
      return { type: 'AUTH_ERROR', retryable: false, category: 'authentication' };
    } else if (statusCode === 404) {
      return { type: 'NOT_FOUND', retryable: false, category: 'client_error' };
    } else if (statusCode >= 400 && statusCode < 500) {
      return { type: 'CLIENT_ERROR', retryable: false, category: 'client_error' };
    } else if (statusCode >= 500) {
      return { type: 'SERVER_ERROR', retryable: true, category: 'server_error' };
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return { type: 'NETWORK_ERROR', retryable: true, category: 'network' };
    } else {
      return { type: 'UNKNOWN_ERROR', retryable: true, category: 'unknown' };
    }
  }
}

const rateLimiter = new APIRateLimit();

// Enhanced NASA API service with comprehensive error handling
class NASAApiService {
  constructor() {
    this.baseUrl = NASA_BASE_URL;
    this.apiKey = NASA_API_KEY;
  }

  // Enhanced API request handler with exponential backoff + jitter and performance monitoring
  async makeRequest(url, endpoint = 'unknown') {
    if (!rateLimiter.canMakeRequest()) {
      const error = new Error('API rate limit exceeded. Please try again later.');
      performanceMonitor.recordApiRequest(0, false, endpoint, 'RATE_LIMIT_EXCEEDED');
      throw error;
    }

    const startTime = Date.now();
    let lastError = null;

    for (let attempt = 1; attempt <= rateLimiter.retryConfig.maxAttempts; attempt++) {
      try {
        rateLimiter.recordRequest();
        
        const response = await fetch(url);
        
        if (!response.ok) {
          const statusCode = response.status;
          const statusText = response.statusText;
          const error = new Error(`API request failed: ${statusCode} ${statusText}`);
          error.response = { status: statusCode, statusText };
          
          // Categorize the error
          const errorInfo = rateLimiter.categorizeError(error, statusCode);
          
          // Check if we should retry
          if (rateLimiter.shouldRetry(error, attempt)) {
            lastError = error;
            
            // Calculate exponential backoff delay with jitter
            const delay = rateLimiter.calculateBackoffDelay(attempt);
            
            console.warn(`API request attempt ${attempt} failed (${statusCode}): ${statusText}. Retrying in ${Math.round(delay)}ms...`);
            
            // Record failed attempt with performance monitoring
            const failureDuration = Date.now() - startTime;
            performanceMonitor.recordApiRequest(failureDuration, false, endpoint, errorInfo.type);
            
            await rateLimiter.sleep(delay);
            continue;
          } else {
            // Don't retry - record failure and throw
            const failureDuration = Date.now() - startTime;
            performanceMonitor.recordApiRequest(failureDuration, false, endpoint, errorInfo.type);
            throw error;
          }
        }

        // Success case
        const data = await response.json();
        const successDuration = Date.now() - startTime;
        
        // Record successful request with performance monitoring
        performanceMonitor.recordApiRequest(successDuration, true, endpoint);
        
        if (attempt > 1) {
          console.log(`API request succeeded on attempt ${attempt} after ${successDuration}ms`);
        }
        
        return data;
        
      } catch (error) {
        const duration = Date.now() - startTime;
        lastError = error;
        
        // Handle network errors and other exceptions
        if (rateLimiter.shouldRetry(error, attempt)) {
          const errorInfo = rateLimiter.categorizeError(error);
          const delay = rateLimiter.calculateBackoffDelay(attempt);
          
          console.warn(`API request attempt ${attempt} failed: ${error.message}. Retrying in ${Math.round(delay)}ms...`);
          
          // Record failed attempt with performance monitoring
          performanceMonitor.recordApiRequest(duration, false, endpoint, errorInfo.type);
          
          await rateLimiter.sleep(delay);
          continue;
        } else {
          // Don't retry - record final failure
          const errorInfo = rateLimiter.categorizeError(error);
          performanceMonitor.recordApiRequest(duration, false, endpoint, errorInfo.type);
          throw error;
        }
      }
    }

    // If we get here, all retries failed
    const finalDuration = Date.now() - startTime;
    const errorInfo = rateLimiter.categorizeError(lastError);
    performanceMonitor.recordApiRequest(finalDuration, false, endpoint, errorInfo.type);
    throw lastError;
  }

  // Get rover manifest data with unified caching and request deduplication
  async getRoverManifest(rover = 'perseverance') {
    const cacheKey = `manifest_${rover}`;
    
    return await unifiedCache.deduplicateRequest(cacheKey, async () => {
      const url = `${this.baseUrl}/manifests/${rover}?api_key=${this.apiKey}`;
      return await this.makeRequest(url, `manifest_${rover}`);
    });
  }

  // Get photos for specific sol with unified caching
  async getPhotosForSol(rover, sol, camera = null) {
    const cacheKey = `photos_${rover}_${sol}_${camera || 'all'}`;
    
    return await unifiedCache.deduplicateRequest(cacheKey, async () => {
      let url = `${this.baseUrl}/rovers/${rover}/photos?sol=${sol}&api_key=${this.apiKey}`;
      if (camera) {
        url += `&camera=${camera}`;
      }
      return await this.makeRequest(url, `photos_sol_${rover}`);
    });
  }

  // Get photos for specific Earth date with unified caching
  async getPhotosForDate(rover, earthDate, camera = null) {
    const cacheKey = `photos_date_${rover}_${earthDate}_${camera || 'all'}`;
    
    return await unifiedCache.deduplicateRequest(cacheKey, async () => {
      let url = `${this.baseUrl}/rovers/${rover}/photos?earth_date=${earthDate}&api_key=${this.apiKey}`;
      if (camera) {
        url += `&camera=${camera}`;
      }
      return await this.makeRequest(url, `photos_date_${rover}`);
    });
  }

  // Get latest photos with unified caching
  async getLatestPhotos(rover) {
    const cacheKey = `latest_${rover}`;
    
    return await unifiedCache.deduplicateRequest(cacheKey, async () => {
      const url = `${this.baseUrl}/rovers/${rover}/latest_photos?api_key=${this.apiKey}`;
      return await this.makeRequest(url, `latest_${rover}`);
    });
  }

  // Batch request for multiple sols
  async getPhotosForSolRange(rover, startSol, endSol, maxPhotosPerSol = 10) {
    const promises = [];
    for (let sol = startSol; sol <= endSol; sol++) {
      promises.push(
        this.getPhotosForSol(rover, sol)
          .then(data => ({ sol, photos: data.photos.slice(0, maxPhotosPerSol) }))
          .catch(error => ({ sol, error: error.message, photos: [] }))
      );
    }

    const results = await Promise.all(promises);
    return results;
  }

  // Clear cache (useful for debugging or forced refresh)
  clearCache() {
    unifiedCache.clear();
  }

  // Get comprehensive API status with unified cache metrics
  getApiStatus() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentRequests = rateLimiter.requests.filter(time => time > oneHourAgo).length;
    const cacheMetrics = unifiedCache.getMetrics();
    
    return {
      // Legacy API metrics
      cacheSize: cacheMetrics.cache.size,
      recentRequests,
      remainingRequests: rateLimiter.MAX_REQUESTS_PER_HOUR - recentRequests,
      canMakeRequest: rateLimiter.canMakeRequest(),
      apiKey: this.apiKey.substring(0, 8) + '...', // Masked API key
      
      // Enhanced unified cache metrics
      cache: cacheMetrics.cache,
      performance: cacheMetrics.performance,
      requests: cacheMetrics.requests
    };
  }
}

export default NASAApiService;