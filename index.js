/**
 * DOM → Markdown Skill for OpenClaw
 * 
 * Main entry point for the skill.
 * Exports all public APIs for use in OpenClaw agents.
 */

// Export main converter
const { DomToMarkdownConverter, convertUrlToMarkdown, batchConvert } = require('./src/converter');

// Export detector for advanced use
const { PageTypeDetector } = require('./src/detector');

// Export browser wrapper (for direct browser access)
const { OpenClawBrowserWrapper } = require('./src/browser-wrapper');

// Export test utilities
const { runTests } = require('./tests/integration');

// Export example
const { main: exampleMain } = require('./examples/basic-usage');

/**
 * Skill metadata for OpenClaw
 */
const skillInfo = {
  name: 'dom-to-markdown',
  version: '1.0.0',
  description: 'Convert web pages to clean markdown using OpenClaw browser',
  author: 'OpenClaw Community',
  category: 'web',
  tags: ['browser', 'markdown', 'conversion', 'scraping'],
  compatibility: {
    openclaw: '>=2026.2.13',
    browser: 'required',
    tools: ['browser', 'web_fetch']
  },
  examples: [
    {
      name: 'Basic conversion',
      code: `const { convertUrlToMarkdown } = require('./skills/dom-to-markdown');
const result = await convertUrlToMarkdown('https://example.com');`
    },
    {
      name: 'Batch processing',
      code: `const { batchConvert } = require('./skills/dom-to-markdown');
const results = await batchConvert(['url1', 'url2', 'url3']);`
    }
  ]
};

/**
 * Initialize skill (called by OpenClaw if needed)
 */
function initialize(options = {}) {
  console.log(`🚀 Initializing DOM → Markdown Skill v${skillInfo.version}`);
  
  const converter = new DomToMarkdownConverter(options);
  
  return {
    converter,
    detector: new PageTypeDetector(options),
    browserWrapper: new OpenClawBrowserWrapper(options),
    info: skillInfo
  };
}

/**
 * Quick conversion helper
 */
async function quickConvert(url, options = {}) {
  const converter = new DomToMarkdownConverter(options);
  return await converter.convertUrlToMarkdown(url, options);
}

// Export everything
module.exports = {
  // Main classes
  DomToMarkdownConverter,
  PageTypeDetector,
  OpenClawBrowserWrapper,
  
  // Main functions
  convertUrlToMarkdown,
  batchConvert,
  quickConvert,
  
  // Utilities
  runTests,
  exampleMain,
  
  // Skill info
  skillInfo,
  initialize,
  
  // Aliases for convenience
  convert: convertUrlToMarkdown,
  batch: batchConvert,
  detect: PageTypeDetector
};

// Log skill load in debug mode
if (process.env.DEBUG) {
  console.log(`📦 DOM → Markdown Skill loaded v${skillInfo.version}`);
}