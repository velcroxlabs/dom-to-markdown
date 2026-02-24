#!/usr/bin/env node
/**
 * Demo script for dom-to-markdown skill
 * Converts three test URLs and prints results
 */

const { convertUrlToMarkdown } = require('./src/converter');

async function runDemo() {
  const urls = [
    'https://openclaw.ai/',
    'https://lit.dev/',
    'https://elnacional.com.do/'
  ];

  console.log('🚀 Starting DOM-to-Markdown Demo');
  console.log('📅 Date:', new Date().toISOString());
  console.log('📄 Testing URLs:', urls.join(', '));
  console.log('---\n');

  const options = {
    usePlaywright: true,
    useWebFetch: false,
    useOpenClawBrowser: false,
    saveToFile: true,
    outputDir: './exports/dom-markdown',
    debug: true,
    rawHtml: false,
    useCache: false,
    playwrightTimeout: 60000,
    playwrightWaitTime: 5000,
    playwrightHeadless: true,
    playwrightWaitUntil: 'networkidle'
  };

  const results = [];
  for (const url of urls) {
    console.log(`\n🔗 Processing: ${url}`);
    const start = Date.now();
    try {
      const result = await convertUrlToMarkdown(url, options);
      const elapsed = Date.now() - start;
      
      if (result.success) {
        console.log(`✅ Success (${elapsed}ms)`);
        console.log(`   Type: ${result.metadata.type} (${(result.metadata.confidence * 100).toFixed(1)}% confidence)`);
        console.log(`   Method: ${result.metadata.method}`);
        console.log(`   Markdown length: ${result.markdown.length} chars`);
        console.log(`   Saved to: ${result.metadata.savedPath || 'N/A'}`);
        
        // Show snippet
        const snippet = result.markdown.substring(0, 300).replace(/\n/g, ' ');
        console.log(`   Snippet: ${snippet}...`);
      } else {
        console.log(`❌ Failed: ${result.error}`);
      }
      results.push(result);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      results.push({ success: false, url, error: error.message });
    }
  }

  console.log('\n---');
  console.log('📊 Summary');
  const success = results.filter(r => r.success).length;
  const fail = results.filter(r => !r.success).length;
  console.log(`Total: ${results.length}, Success: ${success}, Failed: ${fail}`);

  // Print output directory structure
  const fs = require('fs');
  const path = require('path');
  const outputBase = path.resolve(__dirname, 'exports', 'dom-markdown');
  if (fs.existsSync(outputBase)) {
    console.log('\n📁 Generated files:');
    const walk = (dir, indent = '') => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.name === 'metadata.json' || item.name.endsWith('.md')) {
          console.log(indent + '├── ' + item.name);
        } else if (item.isDirectory()) {
          console.log(indent + '├── ' + item.name + '/');
          walk(path.join(dir, item.name), indent + '│   ');
        }
      }
    };
    try {
      walk(outputBase);
    } catch (err) {
      // ignore
    }
  }

  // Exit with error if any failed
  if (fail > 0) {
    process.exit(1);
  }
}

runDemo().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});