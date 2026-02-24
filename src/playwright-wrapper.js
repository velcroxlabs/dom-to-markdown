/**
 * PlaywrightWrapper - Based on user's reference script
 * Uses Playwright (Chromium) for reliable JavaScript rendering of SPAs
 * 
 * @example
 * const wrapper = new PlaywrightWrapper();
 * const result = await wrapper.extractFromUrl('https://amazon.es', {
 *   waitUntil: 'networkidle',
 *   timeout: 30000,
 *   removeElements: ['script', 'style', 'nav', 'footer']
 * });
 */

const { chromium } = require('playwright');
const TurndownService = require('turndown');
const fs = require('fs/promises');
const path = require('path');

class PlaywrightWrapper {
  constructor(options = {}) {
    this.options = {
      // Browser selection
      browserType: options.browserType || 'chromium', // 'chromium' | 'firefox' | 'webkit'
      headless: options.headless !== false,
      
      // Navigation
      waitUntil: options.waitUntil || 'load',
      timeout: options.timeout || 30000,
      waitTime: options.waitTime || 2000, // Additional wait for JavaScript
      
      // DOM cleaning
      removeElements: options.removeElements || [
        'script', 'style', 'noscript', 'iframe', 'svg',
        'nav', 'footer', 'header', 'aside'
      ],
      
      // Extraction priority
      preferMainContent: options.preferMainContent !== false,
      
      // Output
      saveRawHtml: options.saveRawHtml || false,
      outputDir: options.outputDir || './output',
      
      // Debug
      debug: options.debug || false
    };
    
    // Turndown instance for markdown conversion
    this.turndownService = this.createTurndownService();
    
    // State
    this.browser = null;
    this.page = null;
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
      console.log(`[PlaywrightWrapper] ${message}`);
    }
  }
  
  /**
   * Extract clean domain name from URL
   */
  getDomainName(url) {
    try {
      const { hostname } = new URL(url);
      return hostname.replace(/^www\./, '').split('.')[0];
    } catch {
      return 'unknown';
    }
  }
  
  /**
   * Minify markdown (remove excessive whitespace)
   */
  minifyMarkdown(markdown) {
    return markdown
      .replace(/[ \t]+$/gm, '')           // Remove trailing spaces
      .replace(/\n{3,}/g, '\n\n')         // Max 2 line breaks
      .replace(/[ \t]{2,}/g, ' ')         // Collapse multiple spaces
      .trim();
  }
  
  /**
   * Launch browser if not already launched
   */
  async launchBrowser() {
    if (this.browser) {
      this.log('Browser already launched');
      return;
    }
    
    this.log(`Launching ${this.options.browserType} (headless: ${this.options.headless})...`);
    
    try {
      this.browser = await chromium.launch({ 
        headless: this.options.headless 
      });
      
      this.log('Browser launched successfully');
    } catch (error) {
      throw new Error(`Failed to launch browser: ${error.message}`);
    }
  }
  
  /**
   * Create new page if not exists
   */
  async createPage() {
    if (this.page) {
      this.log('Page already exists');
      return;
    }
    
    this.log('Creating new page...');
    
    try {
      this.page = await this.browser.newPage();
      
      // Set viewport to desktop size
      await this.page.setViewportSize({ width: 1280, height: 720 });
      
      this.log('Page created');
    } catch (error) {
      throw new Error(`Failed to create page: ${error.message}`);
    }
  }
  
  /**
   * Navigate to URL and wait for load
   */
  async navigateToUrl(url) {
    if (!this.page) {
      await this.createPage();
    }
    
    this.log(`Navigating to: ${url}`);
    
    try {
      await this.page.goto(url, { 
        waitUntil: this.options.waitUntil,
        timeout: this.options.timeout
      });
      
      // Wait for network idle
      await this.page.waitForLoadState('networkidle');
      
      // Additional wait for JavaScript (SPAs)
      if (this.options.waitTime > 0) {
        this.log(`Waiting ${this.options.waitTime}ms for JavaScript...`);
        await this.page.waitForTimeout(this.options.waitTime);
      }
      
      this.log('Navigation complete');
      return true;
    } catch (error) {
      throw new Error(`Navigation failed: ${error.message}`);
    }
  }
  
  /**
   * Clean DOM by removing noise elements
   */
  async cleanDOM() {
    this.log('Cleaning DOM (removing noise elements)...');
    
    try {
      await this.page.evaluate((selectors) => {
        selectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => el.remove());
        });
      }, this.options.removeElements);
      
      this.log('DOM cleaned');
    } catch (error) {
      this.log(`DOM cleaning warning: ${error.message}`);
      // Non-fatal, continue
    }
  }
  
  /**
   * Extract content from page
   * Priority: <main> element → full page content
   */
  async extractContent() {
    this.log('Extracting content...');
    
    try {
      let contentHtml;
      
      // Try to extract <main> content first
      if (this.options.preferMainContent) {
        const hasMain = await this.page.$('main');
        if (hasMain) {
          this.log('Extracting <main> content...');
          contentHtml = await this.page.$eval('main', el => el.innerHTML);
        }
      }
      
      // Fallback to full page content
      if (!contentHtml) {
        this.log('No <main> found, extracting full page content...');
        contentHtml = await this.page.content();
      }
      
      this.log(`Content extracted: ${contentHtml.length} characters`);
      return contentHtml;
    } catch (error) {
      throw new Error(`Content extraction failed: ${error.message}`);
    }
  }
  
  /**
   * Convert HTML to markdown
   */
  convertToMarkdown(html) {
    try {
      const markdown = this.turndownService.turndown(html);
      const minified = this.minifyMarkdown(markdown);
      
      this.log(`Markdown conversion: ${html.length} chars → ${minified.length} chars`);
      return minified;
    } catch (error) {
      throw new Error(`Markdown conversion failed: ${error.message}`);
    }
  }
  
  /**
   * Save results to files
   */
  async saveResults(url, html, markdown, metadata = {}) {
    if (!this.options.saveRawHtml) {
      return null;
    }
    
    try {
      const domainName = this.getDomainName(url);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputDir = path.join(this.options.outputDir, timestamp);
      
      await fs.mkdir(outputDir, { recursive: true });
      
      const results = {
        htmlPath: null,
        markdownPath: null,
        metadataPath: null
      };
      
      // Save HTML
      if (html && this.options.saveRawHtml) {
        const htmlPath = path.join(outputDir, `${domainName}.html`);
        await fs.writeFile(htmlPath, html, 'utf-8');
        results.htmlPath = htmlPath;
        this.log(`HTML saved: ${htmlPath}`);
      }
      
      // Save markdown
      if (markdown) {
        const mdPath = path.join(outputDir, `${domainName}.md`);
        await fs.writeFile(mdPath, markdown, 'utf-8');
        results.markdownPath = mdPath;
        this.log(`Markdown saved: ${mdPath}`);
      }
      
      // Save metadata
      const metadataObj = {
        url,
        timestamp: new Date().toISOString(),
        domain: domainName,
        htmlLength: html?.length || 0,
        markdownLength: markdown?.length || 0,
        ...metadata
      };
      
      const metadataPath = path.join(outputDir, 'metadata.json');
      await fs.writeFile(metadataPath, JSON.stringify(metadataObj, null, 2), 'utf-8');
      results.metadataPath = metadataPath;
      this.log(`Metadata saved: ${metadataPath}`);
      
      return results;
    } catch (error) {
      this.log(`Save results warning: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Close browser and clean up resources
   */
  async close() {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
        this.log('Page closed');
      }
      
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.log('Browser closed');
      }
    } catch (error) {
      this.log(`Close warning: ${error.message}`);
    }
  }
  
  /**
   * Main method: extract content from URL
   */
  async extractFromUrl(url, userOptions = {}) {
    const startTime = Date.now();
    const options = { ...this.options, ...userOptions };
    const originalOptions = { ...this.options };
    
    // Temporarily apply user options
    this.options = options;
    
    try {
      this.log(`Starting extraction: ${url}`);
      
      // 1. Launch browser
      await this.launchBrowser();
      
      // 2. Navigate
      await this.navigateToUrl(url);
      
      // 3. Clean DOM
      await this.cleanDOM();
      
      // 4. Extract content
      const html = await this.extractContent();
      
      // 5. Convert to markdown
      const markdown = this.convertToMarkdown(html);
      
      // 6. Save results
      const savedFiles = await this.saveResults(url, html, markdown, {
        extractionMethod: 'playwright',
        browserType: options.browserType,
        waitUntil: options.waitUntil,
        timeout: options.timeout
      });
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        url,
        html,
        markdown,
        savedFiles,
        metadata: {
          extractionMethod: 'playwright',
          browserType: options.browserType,
          waitUntil: options.waitUntil,
          timeout: options.timeout,
          durationMs: duration,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      // Restore original options
      this.options = originalOptions;
      
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        url,
        error: error.message,
        metadata: {
          extractionMethod: 'playwright',
          durationMs: duration,
          timestamp: new Date().toISOString()
        }
      };
    } finally {
      // Close browser
      await this.close();
      
      // Restore options
      this.options = originalOptions;
    }
  }
  
  /**
   * Static method for quick one-off extraction
   */
  static async downloadWebsite(options) {
    const wrapper = new PlaywrightWrapper(options);
    return await wrapper.extractFromUrl(options.url, options);
  }
}

module.exports = PlaywrightWrapper;