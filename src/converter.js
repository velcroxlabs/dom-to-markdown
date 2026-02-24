/**
 * Main DOM to Markdown Converter
 * Integrates detection, browser extraction, and markdown conversion
 * Now includes caching to prevent redundant URL processing
 */

const fs = require('fs');
const path = require('path');
const TurndownService = require('turndown');
const { PageTypeDetector } = require('./detector');
const { OpenClawBrowserWrapper } = require('./browser-wrapper');
const PlaywrightWrapper = require('./playwright-wrapper');
const CacheStore = require('./cache-store');

class DomToMarkdownConverter {
  constructor(options = {}) {
    this.options = {
      // Methods
      usePlaywright: options.usePlaywright !== false,           // Use Playwright for SPAs (default if installed)
      useWebFetch: options.useWebFetch !== false,               // Use web_fetch for static pages
      useOpenClawBrowser: options.useOpenClawBrowser || false,  // Only as fallback (not recommended due to known issues)
      useFirecrawl: options.useFirecrawl || false,
      
      // Playwright settings (when usePlaywright = true)
      playwrightBrowser: options.playwrightBrowser || 'chromium', // 'chromium' | 'firefox' | 'webkit'
      playwrightHeadless: options.playwrightHeadless !== false,
      playwrightWaitUntil: options.playwrightWaitUntil || 'networkidle',
      playwrightTimeout: options.playwrightTimeout || 30000,
      playwrightRemoveElements: options.playwrightRemoveElements || [
        'script', 'style', 'noscript', 'iframe', 'svg',
        'nav', 'footer', 'header', 'aside'
      ],
      playwrightWaitTime: options.playwrightWaitTime || 2000,  // Additional wait for JavaScript
      
      // OpenClaw browser settings (when useOpenClawBrowser = true)
      headless: options.headless !== false,
      waitTime: options.waitTime || 5000,
      profile: options.profile || 'openclaw',
      
      // Conversion
      rawHtml: options.rawHtml || false,  // If true, saves raw HTML and disables cleaning
      removeElements: options.rawHtml ? [] : (options.removeElements || ['nav', 'footer', 'aside', 'script', 'style', 'iframe', 'noscript']),
      preserveStructure: options.preserveStructure !== false,
      
      // Output
      saveToFile: options.saveToFile !== false,
      outputDir: options.outputDir || path.join(process.cwd(), 'exports', 'dom-markdown'),
      
      // Cache
      useCache: options.useCache !== false,
      cacheTTL: options.cacheTTL || 24 * 60 * 60 * 1000, // 24 hours default
      cacheMaxEntries: options.cacheMaxEntries || 1000,
      cacheDebug: options.cacheDebug || false,
      
      // Debug
      debug: options.debug || false,
      timeout: options.timeout || 60
    };
    
    // Backward compatibility: map useBrowserHeadless to useOpenClawBrowser
    if (options.useBrowserHeadless !== undefined && this.options.useOpenClawBrowser === undefined) {
      this.options.useOpenClawBrowser = options.useBrowserHeadless;
    }
    
    this.detector = new PageTypeDetector({ debug: this.options.debug });
    this.turndownService = this.createTurndownService();
    
    // Cache
    if (this.options.useCache) {
      this.cacheStore = new CacheStore({
        cacheDir: path.join(__dirname, '..', 'cache'),
        defaultTTL: this.options.cacheTTL,
        maxSize: this.options.cacheMaxEntries,
        debug: this.options.cacheDebug
      });
      this.log('Cache enabled');
    } else {
      this.cacheStore = null;
    }
    
    // Stats
    this.stats = {
      totalRequests: 0,
      byType: {},
      byMethod: {},
      successes: 0,
      failures: 0,
      cacheHits: 0,
      cacheMisses: 0,
      startTime: Date.now()
    };
  }
  
  /**
   * Check if Playwright is available (silent check)
   */
  isPlaywrightAvailable() {
    try {
      require('playwright');
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Ensure Playwright is available, throw clear error if not
   */
  ensurePlaywrightAvailable() {
    if (!this.isPlaywrightAvailable()) {
      throw new Error(
        'Playwright no está instalado. Para extraer contenido de SPAs (React, Vue, etc.), ' +
        'debes instalar las dependencias:\n' +
        '  cd /home/jarvis/.openclaw/workspace/skills/dom-to-markdown\n' +
        '  npm install\n' +
        'Esto instalará Playwright y Chromium automáticamente (~150 MB).'
      );
    }
  }
  
  /**
   * Create configured TurndownService instance
   */
  createTurndownService() {
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined',
      linkReferenceStyle: 'full'
    });
    
    // Add custom rules
    // Only add removeNoise rule if we have elements to remove (not in rawHtml mode)
    if (this.options.removeElements && this.options.removeElements.length > 0) {
      turndownService.addRule('removeNoise', {
        filter: this.options.removeElements,
        replacement: () => ''
      });
    }
    
    turndownService.addRule('preserveImages', {
      filter: 'img',
      replacement: (content, node) => {
        const src = node.getAttribute('src') || '';
        const alt = node.getAttribute('alt') || '';
        const title = node.getAttribute('title') || '';
        
        if (!src) return '';
        
        let markdown = `![${alt}](${src})`;
        if (title) {
          markdown += ` "${title}"`;
        }
        
        return markdown + '\n\n';
      }
    });
    
    turndownService.addRule('preserveLinks', {
      filter: 'a',
      replacement: (content, node) => {
        const href = node.getAttribute('href') || '';
        const title = node.getAttribute('title') || '';
        
        if (!href || href.startsWith('javascript:')) {
          return content;
        }
        
        let markdown = `[${content}](${href})`;
        if (title) {
          markdown += ` "${title}"`;
        }
        
        return markdown;
      }
    });
    
    return turndownService;
  }
  
  /**
   * Log message if debug enabled
   */
  log(message) {
    if (this.options.debug) {
      console.log(`[DOM→Markdown] ${message}`);
    }
  }
  
  /**
   * Update statistics
   */
  updateStats(pageType, method, success) {
    this.stats.totalRequests++;
    
    // Update by type
    this.stats.byType[pageType] = (this.stats.byType[pageType] || 0) + 1;
    
    // Update by method
    this.stats.byMethod[method] = (this.stats.byMethod[method] || 0) + 1;
    
    // Update success/failure
    if (success) {
      this.stats.successes++;
    } else {
      this.stats.failures++;
    }
  }
  
  /**
   * Get statistics
   */
  getStats() {
    const duration = Date.now() - this.stats.startTime;
    const successRate = this.stats.totalRequests > 0 
      ? (this.stats.successes / this.stats.totalRequests) * 100 
      : 0;
    
    // Cache hit rate
    const totalCacheLookups = (this.stats.cacheHits || 0) + (this.stats.cacheMisses || 0);
    const cacheHitRate = totalCacheLookups > 0 
      ? ((this.stats.cacheHits || 0) / totalCacheLookups) * 100 
      : 0;
    
    return {
      ...this.stats,
      durationMs: duration,
      successRate: parseFloat(successRate.toFixed(2)),
      cacheHitRate: parseFloat(cacheHitRate.toFixed(2)),
      cacheLookups: totalCacheLookups,
      requestsPerMinute: duration > 0 
        ? (this.stats.totalRequests / (duration / 60000)).toFixed(2)
        : 0
    };
  }
  
  /**
   * Convert HTML to markdown
   */
  convertHtmlToMarkdown(html) {
    try {
      if (!html || html.length < 10) {
        return '# No content\n\nUnable to convert empty HTML.';
      }
      
      const markdown = this.turndownService.turndown(html);
      return markdown;
    } catch (error) {
      this.log(`HTML to markdown conversion error: ${error.message}`);
      
      // Fallback: extract text only
      const textOnly = html
        .replace(/<[^>]*>/g, ' ')  // Remove tags
        .replace(/\s+/g, ' ')      // Normalize whitespace
        .trim();
      
      return `# Extracted Text\n\n${textOnly.substring(0, 5000)}`;
    }
  }
  
  /**
   * Save result to file
   */
  saveResult(url, markdown, metadata, rawHtml = null) {
    if (!this.options.saveToFile) {
      return null;
    }
    
    try {
      // Create directory structure: YYYY-MM-DD/domain.com/
      const timestamp = new Date();
      const dateStr = timestamp.toISOString().split('T')[0];
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace(/^www\./, '');
      
      const outputDir = path.join(
        this.options.outputDir,
        dateStr,
        domain
      );
      
      // Create directory
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Create filename from path
      const pathname = urlObj.pathname.replace(/\//g, '-').replace(/^-|-$/g, '') || 'homepage';
      const filename = `${pathname}.md`;
      const filePath = path.join(outputDir, filename);
      
      // Save markdown
      fs.writeFileSync(filePath, markdown);
      
      // Prepare metadata
      const metadataPath = path.join(outputDir, 'metadata.json');
      const allMetadata = {};
      const fileMetadata = {
        url,
        timestamp: timestamp.toISOString(),
        markdownLength: markdown.length,
        ...metadata
      };
      
      // Save raw HTML if requested
      let rawHtmlPath = null;
      if (this.options.rawHtml && rawHtml && rawHtml.length > 0) {
        const rawFilename = `${pathname}.raw.html`;
        rawHtmlPath = path.join(outputDir, rawFilename);
        fs.writeFileSync(rawHtmlPath, rawHtml);
        this.log(`Raw HTML saved to: ${rawHtmlPath} (${rawHtml.length} bytes)`);
        
        // Add raw HTML info to metadata
        fileMetadata.rawHtmlPath = rawHtmlPath;
        fileMetadata.rawHtmlLength = rawHtml.length;
      }
      
      allMetadata[filename] = fileMetadata;
      
      // Append to existing metadata or create new
      if (fs.existsSync(metadataPath)) {
        const existing = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        existing[filename] = allMetadata[filename];
        fs.writeFileSync(metadataPath, JSON.stringify(existing, null, 2));
      } else {
        fs.writeFileSync(metadataPath, JSON.stringify(allMetadata, null, 2));
      }
      
      return filePath;
      
    } catch (error) {
      this.log(`Failed to save result: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Extract content using web_fetch (simulated for skill context)
   */
  async extractWithWebFetch(url) {
    this.log(`Using web_fetch for ${url}`);
    
    // Note: In OpenClaw skill context, we would use the web_fetch tool
    // This is a placeholder implementation
    
    return {
      method: 'web_fetch',
      html: `<html><body><h1>Web Fetch Simulation</h1><p>URL: ${url}</p><p>In OpenClaw, this would use the web_fetch tool.</p></body></html>`,
      raw: 'Simulated web_fetch content',
      length: 100,
      simulated: true
    };
  }
  
  /**
   * Extract content using OpenClaw browser
   */
  async extractWithBrowserHeadless(url, suggestion) {
    this.log(`Using OpenClaw browser for ${url}`);
    
    try {
      const browserWrapper = new OpenClawBrowserWrapper({
        profile: this.options.profile,
        headless: this.options.headless,
        timeout: this.options.timeout,
        waitForLoad: suggestion.waitFor || 'networkidle',
        waitTime: this.options.waitTime,
        debug: this.options.debug
      });
      
      const result = await browserWrapper.extractFromUrl(url, {
        extractText: false,
        takeScreenshot: this.options.debug
      });
      
      if (!result.success) {
        throw new Error(`Browser extraction failed: ${result.error}`);
      }
      
      return {
        method: 'browser_headless',
        html: result.html,
        raw: result.html,
        length: result.html.length,
        metadata: result.metadata,
        screenshot: result.screenshot,
        simulated: false
      };
      
    } catch (error) {
      this.log(`Browser extraction error: ${error.message}`);
      
      // Fallback to web_fetch
      return await this.extractWithWebFetch(url);
    }
  }
  /**
   * Extract content using Playwright
   */
  async extractWithPlaywright(url, suggestion) {
    this.log(`Using Playwright for ${url}`);
    
    try {
      // Ensure Playwright is available
      this.ensurePlaywrightAvailable();
      
      const playwrightWrapper = new PlaywrightWrapper({
        browserType: this.options.playwrightBrowser,
        headless: this.options.playwrightHeadless,
        waitUntil: this.options.playwrightWaitUntil,
        timeout: this.options.playwrightTimeout,
        waitTime: this.options.playwrightWaitTime,
        removeElements: this.options.playwrightRemoveElements,
        debug: this.options.debug
      });
      
      const result = await playwrightWrapper.extractFromUrl(url, {
        saveRawHtml: this.options.rawHtml
      });
      
      if (!result.success) {
        throw new Error(`Playwright extraction failed: ${result.error}`);
      }
      
      return {
        method: 'playwright',
        html: result.html,
        raw: result.html,
        length: result.html.length,
        metadata: result.metadata,
        savedFiles: result.savedFiles,
        simulated: false
      };
      
    } catch (error) {
      this.log(`Playwright extraction error: ${error.message}`);
      
      // Fallback to OpenClaw browser if enabled
      if (this.options.useOpenClawBrowser) {
        this.log('Falling back to OpenClaw browser...');
        return await this.extractWithBrowserHeadless(url, suggestion);
      }
      
      // Final fallback to web_fetch
      return await this.extractWithWebFetch(url);
    }
  }
  
  /**
   * Main method: convert URL to markdown
   */
  async convertUrlToMarkdown(url, userOptions = {}) {
    const startTime = Date.now();
    const options = { ...this.options, ...userOptions };
    
    this.log(`Processing: ${url}`);
    
    try {
      // 0. Check cache (if enabled)
      let cacheHit = false;
      let cachedResult = null;
      
      if (this.cacheStore && options.useCache !== false) {
        cachedResult = this.cacheStore.get(url);
        
        if (cachedResult) {
          cacheHit = true;
          this.log(`Cache hit for ${url}`);
          
          // Update cache stats
          if (!this.stats.cacheHits) this.stats.cacheHits = 0;
          if (!this.stats.cacheMisses) this.stats.cacheMisses = 0;
          this.stats.cacheHits++;
          
          // Return cached result with metadata
          const duration = Date.now() - startTime;
          return {
            success: true,
            url,
            markdown: cachedResult.data.markdown,
            metadata: {
              type: cachedResult.data.metadata?.type || 'cached',
              confidence: cachedResult.data.metadata?.confidence || 1.0,
              frameworks: cachedResult.data.metadata?.frameworks || [],
              method: 'cache',
              length: cachedResult.data.markdown.length,
              savedPath: cachedResult.data.metadata?.savedPath || null,
              durationMs: duration,
              timestamp: new Date().toISOString(),
              cacheHit: true,
              cacheAge: Date.now() - cachedResult.createdAt
            },
            detection: cachedResult.data.metadata?.detection || { type: 'cached' },
            extraction: cachedResult.data.metadata?.extraction || { method: 'cache' },
            cached: true
          };
        } else {
          this.log(`Cache miss for ${url}`);
          if (!this.stats.cacheMisses) this.stats.cacheMisses = 0;
          this.stats.cacheMisses++;
        }
      }
      
      // 1. Detect page type
      this.log('Detecting page type...');
      const detection = await this.detector.detectFromUrl(url, options);
      
      if (!detection.success) {
        throw new Error(`Detection failed: ${detection.error}`);
      }
      
      const { classification } = detection;
      this.log(`Detected: ${classification.type} (${classification.confidence * 100}% confidence)`);
      
      // 2. Suggest extraction method
      const methodSuggestion = this.detector.suggestExtractionMethod(classification);
      this.log(`Suggested method: ${methodSuggestion.method} (${methodSuggestion.reason})`);
      
      // 3. Extract content
      let content;
      
      // Map legacy option for compatibility
      if (options.useBrowserHeadless !== undefined && options.useOpenClawBrowser === undefined) {
        options.useOpenClawBrowser = options.useBrowserHeadless;
      }
      
      // Priority: playwright > web_fetch > openclaw-browser
      if (methodSuggestion.method === 'playwright' && options.usePlaywright) {
        content = await this.extractWithPlaywright(url, methodSuggestion);
      } else if (methodSuggestion.method === 'browser_headless' && options.useOpenClawBrowser) {
        content = await this.extractWithBrowserHeadless(url, methodSuggestion);
      } else if (methodSuggestion.method === 'web_fetch' && options.useWebFetch) {
        content = await this.extractWithWebFetch(url);
      } else {
        // Hybrid or fallback - try in order of preference
        if (options.usePlaywright) {
          content = await this.extractWithPlaywright(url, methodSuggestion);
        } else if (options.useWebFetch) {
          content = await this.extractWithWebFetch(url);
        } else if (options.useOpenClawBrowser) {
          content = await this.extractWithBrowserHeadless(url, methodSuggestion);
        } else {
          throw new Error('No extraction method enabled (usePlaywright, useWebFetch, or useOpenClawBrowser must be true)');
        }
      }
      
      // 4. Convert to markdown
      this.log('Converting to markdown...');
      const markdown = this.convertHtmlToMarkdown(content.html);
      
      // 5. Save to file
      let savedPath = null;
      if (options.saveToFile) {
        savedPath = this.saveResult(url, markdown, {
          type: classification.type,
          confidence: classification.confidence,
          frameworks: classification.frameworks,
          method: content.method,
          extractionMetadata: content.metadata
        }, content.html);
        
        if (savedPath) {
          this.log(`Saved to: ${savedPath}`);
        }
      }
      
      // 6. Store in cache (if enabled)
      if (this.cacheStore && options.useCache !== false && !cacheHit) {
        const cacheData = {
          markdown,
          metadata: {
            type: classification.type,
            confidence: classification.confidence,
            frameworks: classification.frameworks,
            method: content.method,
            savedPath,
            detection: classification,
            extraction: content
          }
        };
        
        // Determine TTL based on content type (news articles shorter, documentation longer)
        let ttl = options.cacheTTL;
        if (classification.type === 'news' || classification.type === 'blog') {
          ttl = 6 * 60 * 60 * 1000; // 6 hours for news
        } else if (classification.type === 'documentation' || classification.type === 'article') {
          ttl = 7 * 24 * 60 * 60 * 1000; // 7 days for documentation
        }
        
        this.cacheStore.set(url, cacheData, ttl);
        this.log(`Stored in cache with TTL ${ttl / (60 * 60 * 1000)} hours`);
      }
      
      // 7. Update stats
      this.updateStats(classification.type, content.method, true);
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        url,
        markdown,
        metadata: {
          type: classification.type,
          confidence: classification.confidence,
          frameworks: classification.frameworks,
          method: content.method,
          length: markdown.length,
          savedPath,
          durationMs: duration,
          timestamp: new Date().toISOString(),
          cacheHit: false
        },
        detection: classification,
        extraction: content
      };
      
    } catch (error) {
      this.log(`Conversion failed: ${error.message}`);
      this.updateStats('error', 'failed', false);
      
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        url,
        error: error.message,
        metadata: {
          type: 'error',
          method: 'failed',
          durationMs: duration,
          timestamp: new Date().toISOString()
        }
      };
    }
  }  async batchConvert(urls, userOptions = {}) {
    const options = {
      parallel: userOptions.parallel || 1,
      ...userOptions
    };
    
    this.log(`Starting batch conversion of ${urls.length} URLs`);
    
    const results = [];
    const batches = [];
    
    // Create batches for parallel processing
    for (let i = 0; i < urls.length; i += options.parallel) {
      batches.push(urls.slice(i, i + options.parallel));
    }
    
    // Process batches
    for (const batch of batches) {
      const batchPromises = batch.map(url => 
        this.convertUrlToMarkdown(url, userOptions)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Generate batch report
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    this.log(`Batch complete: ${successCount} successful, ${failureCount} failed`);
    
    return {
      success: failureCount === 0,
      total: urls.length,
      successful: successCount,
      failed: failureCount,
      results,
      stats: this.getStats()
    };
  }
}

// Export main function
async function convertUrlToMarkdown(url, options = {}) {
  const converter = new DomToMarkdownConverter(options);
  return await converter.convertUrlToMarkdown(url, options);
}

// Export batch function
async function batchConvert(urls, options = {}) {
  const converter = new DomToMarkdownConverter(options);
  return await converter.batchConvert(urls, options);
}

module.exports = {
  DomToMarkdownConverter,
  convertUrlToMarkdown,
  batchConvert
};