# Changelog

All notable changes to the `dom-to-markdown` OpenClaw skill will be documented in this file.

## [1.1.0] - 2026-02-22

### Added
- **Cache System**: Integrated persistent JSON cache to prevent redundant URL processing
- **CacheStore Class**: Complete cache implementation with TTL, size management, and statistics
- **Automatic URL Normalization**: SHA-256 hashing with tracking parameter removal for consistent cache keys
- **Intelligent TTL**: Content-type aware expiration (6h for news/blog, 7d for documentation, 24h default)
- **Cache Statistics**: Real-time hit/miss tracking accessible via `getStats()` method
- **Cache Configuration**: Options `useCache`, `cacheTTL`, `cacheMaxEntries`, `cacheDebug`

### Performance Improvements
- **~95% faster** on cache hits for repeated URLs
- **Reduced network load** by avoiding duplicate extractions
- **Persistent storage** survives application restarts

### Architecture Changes
- **New file**: `src/cache-store.js` (379 lines)
- **Modified**: `src/converter.js` (cache integration at line ~331)
- **New directory**: `cache/` with `conversions.json` storage
- **Enhanced stats**: Added cache metrics to existing statistics

### Configuration

```javascript
const converter = new DomToMarkdownConverter({
  useCache: true,           // Enable cache (default: true)
  cacheTTL: 86400000,       // 24 hours in milliseconds
  cacheMaxEntries: 1000,    // Maximum cache entries before cleanup
  cacheDebug: false         // Debug logging
});
```

### Usage

Cache works transparently - no API changes required:

```javascript
const { DomToMarkdownConverter } = require('./skills/dom-to-markdown');
const converter = new DomToMarkdownConverter({ useCache: true });

// First call: processes and caches
const result1 = await converter.convertUrlToMarkdown('https://example.com');

// Second call (same URL): ~95% faster cache hit
const result2 = await converter.convertUrlToMarkdown('https://example.com');

// Check cache stats
const stats = converter.getStats();
console.log(`Cache hit rate: ${stats.cacheHitRate}%`);
```

### Technical Details
- **Cache Key**: SHA-256 of normalized URL (lowercase, sorted params, no trackers)
- **Storage**: JSON file with automatic cleanup of expired/old entries
- **Integration**: Cache-first flow in `convertUrlToMarkdown()` method
- **Management**: Export/import, clear, statistics, and invalidation methods

### Documentation
- Complete cache documentation in `CACHE_DOCUMENTATION.md`
- Updated SKILL.md with cache configuration options
- Executive report available in workspace

## [1.0.0] - 2026-02-21

### Initial Release
- **Smart page detection**: Identifies React, Vue, Angular, Next.js, and other frameworks
- **Automatic method selection**: Chooses between browser headless (for SPAs) and web_fetch (for static pages)
- **Clean markdown conversion**: Removes noise while preserving structure
- **Structured storage**: Organizes results by date and domain
- **OpenClaw integration**: Uses built-in browser tool when needed
- **Comprehensive documentation**: SKILL.md with usage examples and configuration options