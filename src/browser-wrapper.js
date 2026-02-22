/**
 * OpenClaw Browser Wrapper
 * Uses the OpenClaw browser tool internally for real JavaScript rendering
 * 
 * IMPORTANT: This code must run inside an OpenClaw agent session
 * where the 'browser' tool is available.
 */

class OpenClawBrowserWrapper {
  constructor(options = {}) {
    this.options = {
      profile: options.profile || 'openclaw',
      headless: options.headless !== false,
      timeout: options.timeout || 30,
      waitForLoad: options.waitForLoad || 'networkidle',
      waitTime: options.waitTime || 5000,
      debug: options.debug || false
    };
    
    // Browser tool is assumed to be available in OpenClaw agent context
    // We'll check at runtime
  }
  
  /**
   * Check if browser tool is available
   * In OpenClaw, the 'browser' tool is globally available to agents
   */
  isBrowserToolAvailable() {
    // In OpenClaw agent context, 'browser' is a function
    return typeof browser === 'function';
  }
  
  /**
   * Ensure browser is running
   */
  async ensureBrowserRunning() {
    if (!this.isBrowserToolAvailable()) {
      throw new Error('Browser tool not available. This skill must run inside an OpenClaw agent session.');
    }
    
    try {
      const status = await browser({
        action: 'status',
        profile: this.options.profile
      });
      
      if (this.options.debug) {
        console.log(`Browser status: ${JSON.stringify(status)}`);
      }
      
      // Check if browser is running
      const isRunning = status && (
        status.includes('running') || 
        status.includes('ready') ||
        (typeof status === 'object' && status.running)
      );
      
      if (!isRunning) {
        if (this.options.debug) {
          console.log('Starting OpenClaw browser...');
        }
        
        await browser({
          action: 'start',
          profile: this.options.profile
        });
        
        // Wait for browser to be ready
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Verify started
        const newStatus = await browser({
          action: 'status',
          profile: this.options.profile
        });
        
        if (this.options.debug) {
          console.log(`Browser after start: ${JSON.stringify(newStatus)}`);
        }
      }
      
      return true;
    } catch (error) {
      throw new Error(`Failed to ensure browser running: ${error.message}`);
    }
  }
  
  /**
   * Navigate to URL and wait for load
   */
  async navigateToUrl(url) {
    await this.ensureBrowserRunning();
    
    if (this.options.debug) {
      console.log(`Navigating to: ${url}`);
    }
    
    try {
      // Navigate
      await browser({
        action: 'navigate',
        profile: this.options.profile,
        targetUrl: url
      });
      
      // Wait for load state
      if (this.options.waitForLoad) {
        await browser({
          action: 'act',
          profile: this.options.profile,
          request: {
            kind: 'wait',
            timeMs: this.options.waitTime
          }
        });
        
        // Additional wait for JavaScript if specified
        if (this.options.waitTime > 0) {
          if (this.options.debug) {
            console.log(`Waiting ${this.options.waitTime}ms for JavaScript...`);
          }
          await new Promise(resolve => setTimeout(resolve, this.options.waitTime));
        }
      }
      
      return true;
    } catch (error) {
      throw new Error(`Navigation failed: ${error.message}`);
    }
  }
  
  /**
   * Extract HTML from current page using evaluate
   */
  async extractHtml() {
    try {
      if (this.options.debug) {
        console.log('Extracting HTML with evaluate...');
      }
      
      // Method 1: Try to get full HTML
      const htmlResult = await browser({
        action: 'act',
        profile: this.options.profile,
        request: {
          kind: 'evaluate',
          fn: '() => document.documentElement.outerHTML'
        }
      });
      
      if (htmlResult && htmlResult.length > 100) {
        if (this.options.debug) {
          console.log(`HTML extracted: ${htmlResult.length} characters`);
        }
        return htmlResult;
      }
      
      // Method 2: Fallback to snapshot extraction
      if (this.options.debug) {
        console.log('HTML too short, trying snapshot...');
      }
      
      const snapshot = await browser({
        action: 'snapshot',
        profile: this.options.profile,
        snapshotFormat: 'ai',
        maxChars: 100000
      });
      
      // Convert snapshot to basic HTML
      const basicHtml = this.convertSnapshotToHtml(snapshot);
      return basicHtml;
      
    } catch (error) {
      throw new Error(`HTML extraction failed: ${error.message}`);
    }
  }
  
  /**
   * Extract text content from page
   */
  async extractText() {
    try {
      const textResult = await browser({
        action: 'act',
        profile: this.options.profile,
        request: {
          kind: 'evaluate',
          fn: '() => document.body.innerText || document.body.textContent'
        }
      });
      
      if (textResult && textResult.length > 10) {
        return textResult;
      }
      
      // Fallback: extract from snapshot
      const snapshot = await browser({
        action: 'snapshot',
        profile: this.options.profile,
        snapshotFormat: 'ai',
        maxChars: 100000
      });
      
      const lines = snapshot.split('\n');
      return lines
        .filter(line => !line.includes('[ref=') && !line.includes('---') && line.trim())
        .map(line => line.trim())
        .join('\n');
        
    } catch (error) {
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }
  
  /**
   * Take screenshot of current page
   */
  async takeScreenshot() {
    try {
      const screenshotResult = await browser({
        action: 'screenshot',
        profile: this.options.profile,
        type: 'png'
      });
      
      // screenshotResult should contain MEDIA: path
      return screenshotResult;
    } catch (error) {
      if (this.options.debug) {
        console.log(`Screenshot failed: ${error.message}`);
      }
      return null;
    }
  }
  
  /**
   * Convert snapshot to basic HTML
   */
  convertSnapshotToHtml(snapshot) {
    if (!snapshot) return '<html><body>No content</body></html>';
    
    const lines = snapshot.split('\n');
    let html = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>\n';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (!trimmed || trimmed.includes('---') || trimmed.includes('[ref=')) {
        continue;
      }
      
      // Basic conversion
      if (trimmed.startsWith('# ')) {
        html += `<h1>${trimmed.substring(2)}</h1>\n`;
      } else if (trimmed.startsWith('## ')) {
        html += `<h2>${trimmed.substring(3)}</h2>\n`;
      } else if (trimmed.startsWith('### ')) {
        html += `<h3>${trimmed.substring(4)}</h3>\n`;
      } else if (trimmed.match(/^\[.*\]\(.*\)$/)) {
        const match = trimmed.match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
          html += `<a href="${match[2]}">${match[1]}</a><br>\n`;
        }
      } else if (trimmed.startsWith('- ')) {
        html += `<li>${trimmed.substring(2)}</li>\n`;
      } else {
        html += `<p>${trimmed}</p>\n`;
      }
    }
    
    html += '</body></html>';
    return html;
  }
  
  /**
   * Close browser
   */
  async closeBrowser() {
    try {
      await browser({
        action: 'stop',
        profile: this.options.profile
      });
      
      if (this.options.debug) {
        console.log('Browser closed');
      }
    } catch (error) {
      // Ignore errors on close
      if (this.options.debug) {
        console.log('Browser close error (may already be closed)');
      }
    }
  }
  
  /**
   * Main method: extract content from URL
   */
  async extractFromUrl(url, userOptions = {}) {
    const startTime = Date.now();
    const options = { ...this.options, ...userOptions };
    
    // Store original options
    const originalOptions = { ...this.options };
    this.options = options;
    
    try {
      // Verify we're in OpenClaw context
      if (!this.isBrowserToolAvailable()) {
        throw new Error(
          'OpenClaw browser tool not available. ' +
          'This skill must be used inside an OpenClaw agent session.'
        );
      }
      
      // Navigate
      await this.navigateToUrl(url);
      
      // Extract content
      const html = await this.extractHtml();
      const text = options.extractText ? await this.extractText() : null;
      const screenshot = options.takeScreenshot ? await this.takeScreenshot() : null;
      
      // Close browser if not keeping open
      if (!options.keepBrowserOpen) {
        await this.closeBrowser();
      }
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        url,
        html,
        text,
        screenshot,
        metadata: {
          extractionMethod: 'openclaw-browser',
          profile: options.profile,
          headless: options.headless,
          waitForLoad: options.waitForLoad,
          waitTime: options.waitTime,
          durationMs: duration,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      // Restore original options
      this.options = originalOptions;
      
      return {
        success: false,
        url,
        error: error.message,
        metadata: {
          extractionMethod: 'openclaw-browser',
          durationMs: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}

module.exports = { OpenClawBrowserWrapper };