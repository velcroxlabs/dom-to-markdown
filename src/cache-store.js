/**
 * Cache Store for DOM-to-Markdown conversions
 * Uses JSON file for persistent storage
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class CacheStore {
  constructor(options = {}) {
    this.options = {
      cacheDir: options.cacheDir || path.join(__dirname, '..', 'cache'),
      cacheFile: options.cacheFile || 'conversions.json',
      maxSize: options.maxSize || 1000, // maximum entries
      defaultTTL: options.defaultTTL || 24 * 60 * 60 * 1000, // 24 hours in ms
      cleanupInterval: options.cleanupInterval || 60 * 60 * 1000, // 1 hour
      debug: options.debug || false
    };
    
    this.cachePath = path.join(this.options.cacheDir, this.options.cacheFile);
    this.cache = null;
    this.stats = {
      hits: 0,
      misses: 0,
      writes: 0,
      deletes: 0,
      lastCleanup: Date.now()
    };
    
    // Ensure cache directory exists
    if (!fs.existsSync(this.options.cacheDir)) {
      fs.mkdirSync(this.options.cacheDir, { recursive: true });
    }
    
    // Load cache on initialization
    this.loadCache();
    
    // Schedule cleanup if interval is set
    if (this.options.cleanupInterval > 0) {
      this.scheduleCleanup();
    }
  }
  
  /**
   * Load cache from file
   */
  loadCache() {
    try {
      if (fs.existsSync(this.cachePath)) {
        const data = fs.readFileSync(this.cachePath, 'utf8');
        this.cache = JSON.parse(data);
        this.log(`Cache loaded with ${Object.keys(this.cache).length} entries`);
      } else {
        this.cache = {};
        this.log('Cache file created');
      }
    } catch (error) {
      this.log(`Error loading cache: ${error.message}`);
      this.cache = {};
    }
  }
  
  /**
   * Save cache to file
   */
  saveCache() {
    try {
      const data = JSON.stringify(this.cache, null, 2);
      fs.writeFileSync(this.cachePath, data, 'utf8');
      this.log(`Cache saved with ${Object.keys(this.cache).length} entries`);
      return true;
    } catch (error) {
      this.log(`Error saving cache: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Generate hash key for URL
   */
  hashUrl(url) {
    // Normalize URL: lowercase, remove tracking params, etc.
    const normalized = this.normalizeUrl(url);
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }
  
  /**
   * Normalize URL for consistent hashing
   */
  normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      
      // Lowercase hostname
      urlObj.hostname = urlObj.hostname.toLowerCase();
      
      // Remove common tracking parameters
      const trackingParams = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'fbclid', 'gclid', 'msclkid', 'dclid', 'irclickid',
        'ref', 'source', 'campaign', 'medium', 'term', 'content'
      ];
      
      const params = urlObj.searchParams;
      trackingParams.forEach(param => {
        params.delete(param);
      });
      
      // Sort parameters for consistency
      const sortedParams = new URLSearchParams();
      Array.from(params.keys()).sort().forEach(key => {
        sortedParams.set(key, params.get(key));
      });
      
      urlObj.search = sortedParams.toString();
      
      // Remove trailing slash from pathname
      let pathname = urlObj.pathname;
      if (pathname.endsWith('/') && pathname.length > 1) {
        pathname = pathname.slice(0, -1);
      }
      urlObj.pathname = pathname;
      
      return urlObj.toString();
    } catch (error) {
      // If URL parsing fails, return original (will still be hashed)
      return url;
    }
  }
  
  /**
   * Get entry from cache
   */
  get(url) {
    const key = this.hashUrl(url);
    
    if (this.cache[key]) {
      const entry = this.cache[key];
      
      // Check TTL
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        this.log(`Cache entry expired for ${url}`);
        delete this.cache[key];
        this.saveCache();
        this.stats.misses++;
        return null;
      }
      
      this.log(`Cache hit for ${url}`);
      this.stats.hits++;
      return entry;
    }
    
    this.log(`Cache miss for ${url}`);
    this.stats.misses++;
    return null;
  }
  
  /**
   * Set entry in cache
   */
  set(url, data, ttl = null) {
    const key = this.hashUrl(url);
    const now = Date.now();
    
    const entry = {
      url: this.normalizeUrl(url),
      hash: key,
      data: data,
      createdAt: now,
      updatedAt: now,
      expiresAt: ttl ? now + ttl : now + this.options.defaultTTL
    };
    
    // Check cache size limit
    if (Object.keys(this.cache).length >= this.options.maxSize) {
      this.log(`Cache at capacity (${Object.keys(this.cache).length}/${this.options.maxSize}), removing oldest entries`);
      this.removeOldestEntries(1); // Remove 1 oldest entry
    }
    
    this.cache[key] = entry;
    const saved = this.saveCache();
    
    if (saved) {
      this.stats.writes++;
      this.log(`Cache set for ${url}`);
      return entry;
    }
    
    return null;
  }
  
  /**
   * Delete entry from cache
   */
  delete(url) {
    const key = this.hashUrl(url);
    
    if (this.cache[key]) {
      delete this.cache[key];
      this.saveCache();
      this.stats.deletes++;
      this.log(`Cache delete for ${url}`);
      return true;
    }
    
    return false;
  }
  
  /**
   * Clear all cache entries
   */
  clear() {
    const count = Object.keys(this.cache).length;
    this.cache = {};
    this.saveCache();
    this.log(`Cache cleared (${count} entries removed)`);
    return count;
  }
  
  /**
   * Cleanup expired entries
   */
  cleanup(force = false) {
    const now = Date.now();
    let removed = 0;
    
    // Check if cleanup is needed (not forced and not enough time passed)
    if (!force && (now - this.stats.lastCleanup) < this.options.cleanupInterval) {
      return removed;
    }
    
    for (const key in this.cache) {
      const entry = this.cache[key];
      if (entry.expiresAt && now > entry.expiresAt) {
        delete this.cache[key];
        removed++;
      }
    }
    
    if (removed > 0) {
      this.saveCache();
      this.log(`Cache cleanup removed ${removed} expired entries`);
    }
    
    this.stats.lastCleanup = now;
    return removed;
  }
  
  /**
   * Remove oldest entries from cache
   */
  removeOldestEntries(count = 1) {
    if (count <= 0 || Object.keys(this.cache).length === 0) {
      return 0;
    }
    
    // Create array of entries sorted by creation date (oldest first)
    const entries = Object.entries(this.cache)
      .map(([key, entry]) => ({ key, ...entry }))
      .sort((a, b) => a.createdAt - b.createdAt);
    
    // Remove the specified number of oldest entries
    const toRemove = Math.min(count, entries.length);
    let removed = 0;
    
    for (let i = 0; i < toRemove; i++) {
      const entry = entries[i];
      delete this.cache[entry.key];
      removed++;
      this.stats.deletes++;
    }
    
    if (removed > 0) {
      this.saveCache();
      this.log(`Removed ${removed} oldest cache entries`);
    }
    
    return removed;
  }
  
  /**
   * Schedule periodic cleanup
   */
  scheduleCleanup() {
    setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval);
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    const total = Object.keys(this.cache).length;
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
      : 0;
    
    return {
      entries: total,
      hits: this.stats.hits,
      misses: this.stats.misses,
      writes: this.stats.writes,
      deletes: this.stats.deletes,
      hitRate: parseFloat(hitRate.toFixed(2)),
      sizeBytes: this.getCacheSize(),
      lastCleanup: this.stats.lastCleanup
    };
  }
  
  /**
   * Estimate cache size in bytes
   */
  getCacheSize() {
    try {
      return Buffer.byteLength(JSON.stringify(this.cache), 'utf8');
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Export cache to file
   */
  export(filePath) {
    try {
      const data = JSON.stringify(this.cache, null, 2);
      fs.writeFileSync(filePath, data, 'utf8');
      this.log(`Cache exported to ${filePath}`);
      return true;
    } catch (error) {
      this.log(`Error exporting cache: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Import cache from file
   */
  import(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      const data = fs.readFileSync(filePath, 'utf8');
      const imported = JSON.parse(data);
      
      // Validate imported data structure
      let validEntries = 0;
      for (const key in imported) {
        const entry = imported[key];
        if (entry && entry.url && entry.hash && entry.data) {
          this.cache[key] = entry;
          validEntries++;
        }
      }
      
      this.saveCache();
      this.log(`Cache imported with ${validEntries} entries from ${filePath}`);
      return validEntries;
    } catch (error) {
      this.log(`Error importing cache: ${error.message}`);
      return 0;
    }
  }
  
  /**
   * Log message if debug enabled
   */
  log(message) {
    if (this.options.debug) {
      console.log(`[CacheStore] ${message}`);
    }
  }
}

module.exports = CacheStore;