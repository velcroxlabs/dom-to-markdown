/**
 * Main DOM to Markdown Converter
 * Integrates detection, browser extraction, and markdown conversion
 */

const fs = require('fs');
const path = require('path');
const TurndownService = require('turndown');
const { PageTypeDetector } = require('./detector');
const { OpenClawBrowserWrapper } = require('./browser-wrapper');

class DomToMarkdownConverter {
  constructor(options = {}) {
    this.options = {
      // Methods
      useBrowserHeadless: options.useBrowserHeadless !== false,
      useWebFetch: options.useWebFetch !== false,
      useFirecrawl: options.useFirecrawl || false,
      
      // Browser settings
      headless: options.headless !== false,
      waitTime: options.waitTime || 5000,
      profile: options.profile || 'openclaw',
      
      // Conversion
      removeElements: options.removeElements || ['nav', 'footer', 'aside', 'script', 'style', 'iframe', 'noscript'],
      preserveStructure: options.preserveStructure !== false,
      
      // Output
      saveToFile: options.saveToFile !== false,
      outputDir: options.outputDir || path.join(process.cwd(), 'exports', 'dom-markdown'),
      
      // Debug
      debug: options.debug || false,
      timeout: options.timeout || 60
    };
    
    this.detector = new PageTypeDetector({ debug: this.options.debug });
    this.turndownService = this.createTurndownService();
    
    // Stats
    this.stats = {
      totalRequests: 0,
      byType: {},
      byMethod: {},
      successes: 0,
      failures: 0,
      startTime: Date.now()
    };
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
    turndownService.addRule('removeNoise', {
      filter: this.options.removeElements,
      replacement: () => ''
    });
    
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
    
    return {
      ...this.stats,
      durationMs: duration,
      successRate: parseFloat(successRate.toFixed(2)),
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
  saveResult(url, markdown, metadata) {
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
      
      // Save metadata
      const metadataPath = path.join(outputDir, 'metadata.json');
      const allMetadata = {
        [filename]: {
          url,
          timestamp: timestamp.toISOString(),
          markdownLength: markdown.length,
          ...metadata
        }
      };
      
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
   * Main method: convert URL to markdown
   */
  async convertUrlToMarkdown(url, userOptions = {}) {
    const startTime = Date.now();
    const options = { ...this.options, ...userOptions };
    
    this.log(`Processing: ${url}`);
    
    try {
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
      
      if (methodSuggestion.method === 'browser_headless' && options.useBrowserHeadless) {
        content = await this.extractWithBrowserHeadless(url, methodSuggestion);
      } else if (methodSuggestion.method === 'web_fetch' && options.useWebFetch) {
        content = await this.extractWithWebFetch(url);
      } else {
        // Hybrid or fallback
        if (options.useBrowserHeadless) {
          content = await this.extractWithBrowserHeadless(url, methodSuggestion);
        } else {
          content = await this.extractWithWebFetch(url);
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
        });
        
        if (savedPath) {
          this.log(`Saved to: ${savedPath}`);
        }
      }
      
      // 6. Update stats
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
          timestamp: new Date().toISOString()
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
  }
  
  /**
   * Batch convert multiple URLs
   */
  async batchConvert(urls, userOptions = {}) {
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