/**
 * Page Type Detector
 * Identifies frameworks and classifies pages as static, spa, or mixed
 */

class PageTypeDetector {
  constructor(options = {}) {
    this.options = {
      debug: options.debug || false,
      minConfidence: options.minConfidence || 0.6
    };
    
    // Framework patterns
    this.frameworkPatterns = {
      react: [
        { pattern: /react/i, weight: 0.8 },
        { pattern: /react-dom/i, weight: 0.9 },
        { pattern: /__NEXT_DATA__/i, weight: 0.7 },
        { pattern: /data-reactroot/i, weight: 0.8 }
      ],
      vue: [
        { pattern: /vue/i, weight: 0.8 },
        { pattern: /__VUE__/i, weight: 0.9 },
        { pattern: /vue-router/i, weight: 0.7 },
        { pattern: /v-[\w-]+/i, weight: 0.6 }
      ],
      angular: [
        { pattern: /ng-[\w-]+/i, weight: 0.8 },
        { pattern: /angular/i, weight: 0.7 },
        { pattern: /\[ng[\w-]+\]/i, weight: 0.6 }
      ],
      nextjs: [
        { pattern: /_next/i, weight: 0.9 },
        { pattern: /__NEXT_DATA__/i, weight: 1.0 },
        { pattern: /next\/router/i, weight: 0.7 }
      ],
      nuxt: [
        { pattern: /_nuxt/i, weight: 0.9 },
        { pattern: /__NUXT__/i, weight: 1.0 }
      ],
      svelte: [
        { pattern: /svelte/i, weight: 0.8 },
        { pattern: /svelte-\w+/i, weight: 0.7 }
      ]
    };
  }
  
  /**
   * Detect frameworks in HTML content
   */
  detectFrameworks(html, headers = {}) {
    const frameworks = {};
    const htmlLower = html.toLowerCase();
    
    // Check each framework
    for (const [framework, patterns] of Object.entries(this.frameworkPatterns)) {
      let confidence = 0;
      let matches = [];
      
      for (const { pattern, weight } of patterns) {
        if (pattern.test(html)) {
          confidence += weight;
          matches.push(pattern.toString());
        }
      }
      
      // Check headers for framework hints
      const serverHeader = headers['server'] || headers['x-powered-by'] || '';
      if (serverHeader.toLowerCase().includes(framework)) {
        confidence += 0.3;
        matches.push(`header: ${serverHeader}`);
      }
      
      if (confidence > 0) {
        // Normalize confidence
        confidence = Math.min(confidence, 1.0);
        frameworks[framework] = {
          confidence: parseFloat(confidence.toFixed(2)),
          matches
        };
      }
    }
    
    return frameworks;
  }
  
  /**
   * Classify page type based on HTML and frameworks
   */
  classifyPage(html, frameworks = {}) {
    const htmlLength = html.length;
    const hasFrameworks = Object.keys(frameworks).length > 0;
    
    // Calculate SPA indicators
    let spaScore = 0;
    const spaIndicators = [
      // Very short HTML with framework
      { condition: htmlLength < 5000 && hasFrameworks, weight: 0.7 },
      
      // Common SPA patterns
      { condition: /<div id="app"/i.test(html), weight: 0.6 },
      { condition: /<div id="root"/i.test(html), weight: 0.6 },
      { condition: /<app-root>/i.test(html), weight: 0.7 },
      
      // JavaScript framework loading patterns
      { condition: /loading\.\.\.|loading spinner|loading indicator/i.test(html), weight: 0.5 },
      
      // Minimal content with script tags
      { condition: (html.match(/<script/g) || []).length > 5 && htmlLength < 10000, weight: 0.4 }
    ];
    
    for (const { condition, weight } of spaIndicators) {
      if (condition) spaScore += weight;
    }
    
    // Calculate static indicators
    let staticScore = 0;
    const staticIndicators = [
      // Long HTML without frameworks
      { condition: htmlLength > 15000 && !hasFrameworks, weight: 0.8 },
      
      // Server-rendered patterns
      { condition: /<article>|<section>|<main>/i.test(html), weight: 0.3 },
      { condition: /<h[1-6][^>]*>/i.test(html), weight: 0.2 },
      { condition: /<p[^>]*>/i.test(html), weight: 0.2 },
      
      // Traditional web patterns
      { condition: /<table[^>]*>/i.test(html), weight: 0.2 },
      { condition: /<form[^>]*>/i.test(html), weight: 0.2 }
    ];
    
    for (const { condition, weight } of staticIndicators) {
      if (condition) staticScore += weight;
    }
    
    // Normalize scores
    spaScore = Math.min(spaScore, 1.0);
    staticScore = Math.min(staticScore, 1.0);
    
    // Determine type
    let type = 'mixed';
    let confidence = 0.5;
    
    if (spaScore > 0.7 && spaScore > staticScore) {
      type = 'spa';
      confidence = spaScore;
    } else if (staticScore > 0.7 && staticScore > spaScore) {
      type = 'static';
      confidence = staticScore;
    } else {
      // Mixed - use average
      type = 'mixed';
      confidence = (spaScore + staticScore) / 2;
    }
    
    // Adjust confidence based on framework detection
    if (type === 'spa' && hasFrameworks) {
      const maxFrameworkConfidence = Math.max(
        ...Object.values(frameworks).map(f => f.confidence)
      );
      confidence = Math.max(confidence, maxFrameworkConfidence);
    }
    
    return {
      type,
      confidence: parseFloat(confidence.toFixed(2)),
      frameworks,
      metrics: {
        htmlLength,
        spaScore: parseFloat(spaScore.toFixed(2)),
        staticScore: parseFloat(staticScore.toFixed(2)),
        hasFrameworks
      }
    };
  }
  
  /**
   * Detect page type from URL (requires fetch)
   * This is the main public method
   */
  async detectFromUrl(url, options = {}) {
    const startTime = Date.now();
    
    try {
      // Fetch initial HTML and headers
      const { html, headers } = await this.fetchInitialHtml(url, options);
      
      if (!html || html.length < 100) {
        throw new Error(`No HTML content fetched from ${url}`);
      }
      
      // Detect frameworks
      const frameworks = this.detectFrameworks(html, headers);
      
      // Classify page
      const classification = this.classifyPage(html, frameworks);
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        url,
        classification,
        htmlSample: html.substring(0, 1000),
        htmlLength: html.length,
        duration,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        success: false,
        url,
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Fetch HTML and headers from URL
   */
  async fetchInitialHtml(url, options) {
    // Note: In OpenClaw, we would use the web_fetch tool
    // For standalone use, we simulate with node-fetch or similar
    
    const timeout = options.timeout || 30;
    const headers = {};
    
    // Simulated fetch - in real OpenClaw, use web_fetch tool
    // This is a placeholder for the skill context
    const mockHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Mock page for ${url}</title>
        <meta charset="UTF-8">
      </head>
      <body>
        <h1>Mock content</h1>
        <p>In OpenClaw skill, this would use web_fetch tool</p>
      </body>
      </html>
    `;
    
    return {
      html: mockHtml,
      headers
    };
  }
  
  /**
   * Suggest extraction method based on detection
   */
  suggestExtractionMethod(detection) {
    const { type, confidence, frameworks } = detection;
    
    let method = 'web_fetch';
    let reason = 'Static page detected';
    let waitFor = 'load';
    
    if (type === 'spa' && confidence >= this.options.minConfidence) {
      method = 'browser_headless';
      reason = `SPA detected (${Object.keys(frameworks).join(', ')})`;
      waitFor = 'networkidle';
    } else if (type === 'mixed') {
      method = 'hybrid';
      reason = 'Mixed page type - try browser headless first';
      waitFor = 'networkidle';
    }
    
    return {
      method,
      reason,
      waitFor,
      confidence,
      type
    };
  }
}

module.exports = { PageTypeDetector };