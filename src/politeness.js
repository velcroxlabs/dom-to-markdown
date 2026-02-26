/**
 * Politeness & Rate Limiting Module
 * Respects robots.txt and adds delays between requests.
 */

class PolitenessManager {
  constructor(options = {}) {
    this.options = {
      debug: options.debug || false,
      respectRobotsTxt: options.respectRobotsTxt !== false,
      defaultUserAgent: options.defaultUserAgent || 'OpenClawDomToMarkdown/1.0',
      cacheTTL: options.cacheTTL || 24 * 60 * 60 * 1000, // 24 hours
      maxRobotsSize: options.maxRobotsSize || 1024 * 100, // 100KB
      requestDelay: options.requestDelay || 1000, // ms between requests
      lastRequestTime: 0,
    };

    this.customFetchRobotsTxt = options.fetchRobotsTxt || this.defaultFetchRobotsTxt.bind(this);

    this.robotsCache = new Map(); // domain -> {rules, fetchedAt}
    this.delayPromise = Promise.resolve();
  }

  log(...args) {
    if (this.options.debug) {
      console.log('[Politeness]', ...args);
    }
  }

  /**
   * Default robots.txt fetcher using global web_fetch tool, falling back to fetch.
   */
  async defaultFetchRobotsTxt(robotsUrl) {
    // First try web_fetch (OpenClaw tool)
    if (typeof web_fetch === 'function') {
      try {
        const result = await web_fetch({
          url: robotsUrl,
          extractMode: 'text',
          maxChars: this.options.maxRobotsSize,
        });
        return result?.content || null;
      } catch (error) {
        this.log(`web_fetch failed: ${error.message}`);
        // Fall through to fetch
      }
    }
    
    // Fallback to global fetch (Node 18+ / browser)
    if (typeof fetch === 'function') {
      try {
        const response = await fetch(robotsUrl, {
          headers: {
            'User-Agent': this.options.defaultUserAgent || 'OpenClawDomToMarkdown/1.0'
          }
        });
        if (response.ok) {
          return await response.text();
        } else {
          // 404, etc. treat as no robots.txt
          return null;
        }
      } catch (error) {
        this.log(`fetch failed: ${error.message}`);
        return null;
      }
    }
    
    this.log('No fetch method available (web_fetch or fetch)');
    return null;
  }

  /**
   * Get domain from URL
   */
  getDomain(url) {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch (e) {
      return null;
    }
  }

  /**
   * Fetch robots.txt content for a domain using web_fetch tool.
   * Returns null if not found or error.
   */
  async _fetchRobotsTxtInternal(domain) {
    if (!domain) return null;

    const cacheEntry = this.robotsCache.get(domain);
    if (cacheEntry && Date.now() - cacheEntry.fetchedAt < this.options.cacheTTL) {
      this.log(`Using cached robots.txt for ${domain}`);
      return cacheEntry.rules;
    }

    this.log(`Fetching robots.txt for ${domain}`);
    const robotsUrl = `https://${domain}/robots.txt`;

    const content = await this.customFetchRobotsTxt(robotsUrl);
    if (content === null) {
      this.robotsCache.set(domain, { rules: null, fetchedAt: Date.now() });
      return null;
    }

    const rules = this.parseRobotsTxt(content);
    this.robotsCache.set(domain, { rules, fetchedAt: Date.now() });
    return rules;
  }

  /**
   * Parse robots.txt content into structured rules.
   * Supports User-agent, Disallow, Allow, Crawl-delay, Sitemap.
   * Returns object mapping user-agent patterns to rules.
   */
  parseRobotsTxt(content) {
    const lines = content.split('\n');
    const rules = {};
    let currentAgents = [];

    for (let line of lines) {
      line = line.trim();
      const commentIndex = line.indexOf('#');
      if (commentIndex !== -1) {
        line = line.substring(0, commentIndex).trim();
      }
      if (!line) continue;

      const [directive, ...valueParts] = line.split(':');
      if (!directive || valueParts.length === 0) continue;

      const key = directive.trim().toLowerCase();
      const value = valueParts.join(':').trim();

      if (key === 'user-agent') {
        currentAgents = [value];
        if (!rules[value]) {
          rules[value] = { disallow: [], allow: [], crawlDelay: null };
        }
      } else if (key === 'disallow') {
        for (const agent of currentAgents) {
          if (!rules[agent]) rules[agent] = { disallow: [], allow: [], crawlDelay: null };
          if (value) rules[agent].disallow.push(value);
        }
      } else if (key === 'allow') {
        for (const agent of currentAgents) {
          if (!rules[agent]) rules[agent] = { disallow: [], allow: [], crawlDelay: null };
          if (value) rules[agent].allow.push(value);
        }
      } else if (key === 'crawl-delay') {
        const delay = parseFloat(value);
        if (!isNaN(delay) && delay >= 0) {
          for (const agent of currentAgents) {
            if (!rules[agent]) rules[agent] = { disallow: [], allow: [], crawlDelay: null };
            rules[agent].crawlDelay = delay;
          }
        }
      }
      // Ignore other directives (Sitemap, Host, etc.)
    }

    // Ensure a wildcard user-agent exists
    if (!rules['*']) {
      rules['*'] = { disallow: [], allow: [], crawlDelay: null };
    }

    return rules;
  }

  /**
   * Check if a URL is allowed by robots.txt for given user-agent.
   * Returns { allowed: boolean, crawlDelay: number | null }.
   */
  async isAllowed(url, userAgent = this.options.defaultUserAgent) {
    if (!this.options.respectRobotsTxt) {
      return { allowed: true, crawlDelay: null };
    }

    const domain = this.getDomain(url);
    if (!domain) {
      this.log(`Invalid URL: ${url}`);
      return { allowed: true, crawlDelay: null };
    }

    const rules = await this.fetchRobotsTxt(domain);
    if (!rules) {
      return { allowed: true, crawlDelay: null };
    }

    // Find matching user-agent (wildcard '*' as fallback)
    let matchedRules = rules[userAgent] || rules['*'];
    if (!matchedRules) {
      return { allowed: true, crawlDelay: null };
    }

    // Convert URL path
    const parsed = new URL(url);
    const path = parsed.pathname + parsed.search;

    // Check disallow/allow rules (order sensitive, but we implement simple precedence)
    let allowed = true;
    for (const disallowPattern of matchedRules.disallow) {
      if (!disallowPattern) continue;
      const pattern = this.wildcardToRegex(disallowPattern);
      if (pattern.test(path)) {
        allowed = false;
        break;
      }
    }
    // If disallowed, check allow rules (allow can override)
    if (!allowed) {
      for (const allowPattern of matchedRules.allow) {
        if (!allowPattern) continue;
        const pattern = this.wildcardToRegex(allowPattern);
        if (pattern.test(path)) {
          allowed = true;
          break;
        }
      }
    }

    return {
      allowed,
      crawlDelay: matchedRules.crawlDelay,
    };
  }

  /**
   * Convert robots.txt wildcard pattern to regex.
   * '*' matches any sequence, '$' matches end of string.
   */
  wildcardToRegex(pattern) {
    let regexStr = '';
    for (let i = 0; i < pattern.length; i++) {
      const ch = pattern[i];
      if (ch === '*') {
        regexStr += '.*';
      } else if (ch === '$' && i === pattern.length - 1) {
        regexStr += '$';
      } else {
        // Escape regex special characters
        regexStr += ch.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
      }
    }
    if (!regexStr.endsWith('$')) {
      regexStr += '.*';
    }
    return new RegExp(`^${regexStr}`);
  }

  /**
   * Apply rate limiting delay between requests.
   * Call before each request to ensure polite spacing.
   * If a crawlDelay is provided, uses that; otherwise uses default requestDelay.
   */
  async delay(crawlDelay = null) {
    const delayMs = crawlDelay !== null ? crawlDelay * 1000 : this.options.requestDelay;
    const now = Date.now();
    const timeSinceLast = now - this.options.lastRequestTime;
    const wait = Math.max(0, delayMs - timeSinceLast);

    if (wait > 0) {
      this.log(`Waiting ${wait}ms for politeness`);
      await new Promise(resolve => setTimeout(resolve, wait));
    }

    this.options.lastRequestTime = Date.now();
  }

  /**
   * Clear cache for a domain or all.
   */
  clearCache(domain = null) {
    if (domain) {
      this.robotsCache.delete(domain);
    } else {
      this.robotsCache.clear();
    }
  }

  async fetchRobotsTxt(domain) {
    return await this._fetchRobotsTxtInternal(domain);
  }
}

module.exports = PolitenessManager;