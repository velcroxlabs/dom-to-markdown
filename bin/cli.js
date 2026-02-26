#!/usr/bin/env node
/**
 * CLI tool for dom-to-markdown skill (standalone, no OpenClaw required)
 * Usage:
 *   dom-to-markdown <url> [options]
 *   dom-to-markdown --batch <file> [options]
 */

const fs = require('fs');
const path = require('path');
const { convertUrlToMarkdown, batchConvert } = require('../src/converter');

function printHelp() {
  console.log(`
DOM → Markdown CLI

Convert web pages to clean markdown using Playwright (for SPAs) or fetch (for static pages).

Usage:
  dom-to-markdown <url> [options]
  dom-to-markdown --batch <file> [options]

Options:
  -o, --output <dir>       Output directory (default: ./exports/dom-markdown)
      --raw-html           Save raw HTML file alongside markdown
      --no-playwright      Disable Playwright (use fetch only)
      --no-cache           Disable caching of downloaded images
      --debug              Enable debug logging
      --timeout <seconds>  Timeout in seconds (default: 30)
      --wait <ms>          Additional wait time for JavaScript (default: 2000)
      --headless           Run Playwright in headless mode (default: true)
      --browser <type>     Playwright browser: chromium, firefox, webkit (default: chromium)
      --no-save            Do not save files, output markdown to stdout
      --help               Show this help

Batch mode:
  --batch <file>           Process URLs from file (one per line)
  --parallel <number>      Number of parallel conversions (default: 2)

Examples:
  dom-to-markdown https://react.dev -o ./output --debug
  dom-to-markdown --batch urls.txt --parallel 3 --raw-html
  dom-to-markdown https://example.com --no-save | head -20
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const options = {
    url: null,
    batchFile: null,
    outputDir: './exports/dom-markdown',
    rawHtml: false,
    usePlaywright: true,
    useCache: true,
    debug: false,
    timeout: 30,
    waitTime: 2000,
    headless: true,
    browser: 'chromium',
    saveToFile: true,
    parallel: 2,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      if (arg === '--batch') {
        options.batchFile = args[i + 1];
        i += 2;
        continue;
      } else if (arg === '--output' || arg === '-o') {
        options.outputDir = args[i + 1];
        i += 2;
        continue;
      } else if (arg === '--raw-html') {
        options.rawHtml = true;
        i += 1;
        continue;
      } else if (arg === '--no-playwright') {
        options.usePlaywright = false;
        i += 1;
        continue;
      } else if (arg === '--no-cache') {
        options.useCache = false;
        i += 1;
        continue;
      } else if (arg === '--debug') {
        options.debug = true;
        i += 1;
        continue;
      } else if (arg === '--timeout') {
        options.timeout = parseInt(args[i + 1], 10);
        i += 2;
        continue;
      } else if (arg === '--wait') {
        options.waitTime = parseInt(args[i + 1], 10);
        i += 2;
        continue;
      } else if (arg === '--headless') {
        // Already default true, but allow explicit
        i += 1;
        continue;
      } else if (arg === '--browser') {
        options.browser = args[i + 1];
        i += 2;
        continue;
      } else if (arg === '--no-save') {
        options.saveToFile = false;
        i += 1;
        continue;
      } else if (arg === '--parallel') {
        options.parallel = parseInt(args[i + 1], 10);
        i += 2;
        continue;
      } else {
        console.error(`Unknown option: ${arg}`);
        process.exit(1);
      }
    } else if (!arg.startsWith('-')) {
      // positional argument: treat as URL
      if (options.url === null) {
        options.url = arg;
      } else {
        console.error(`Unexpected positional argument: ${arg}`);
        process.exit(1);
      }
      i += 1;
    } else {
      console.error(`Unknown flag: ${arg}`);
      process.exit(1);
    }
  }

  // Validation
  if (!options.batchFile && !options.url) {
    console.error('Error: Either a URL or --batch file must be provided');
    printHelp();
    process.exit(1);
  }
  if (options.batchFile && options.url) {
    console.error('Error: Cannot provide both URL and --batch');
    process.exit(1);
  }
  if (options.batchFile && !fs.existsSync(options.batchFile)) {
    console.error(`Batch file not found: ${options.batchFile}`);
    process.exit(1);
  }

  return options;
}

async function main() {
  const options = parseArgs();
  
  const converterOptions = {
    outputDir: options.outputDir,
    rawHtml: options.rawHtml,
    usePlaywright: options.usePlaywright,
    useCache: options.useCache,
    debug: options.debug,
    timeout: options.timeout,
    waitTime: options.waitTime,
    headless: options.headless,
    playwrightBrowser: options.browser,
    saveToFile: options.saveToFile,
    // Disable OpenClaw browser wrapper for standalone usage
    useOpenClawBrowser: false,
    // web_fetch will fallback to global fetch
    useWebFetch: true,
  };

  if (options.batchFile) {
    console.log(`📦 Batch processing from ${options.batchFile}`);
    const urls = fs.readFileSync(options.batchFile, 'utf-8')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    console.log(`   Found ${urls.length} URLs`);
    
    const batchOptions = {
      ...converterOptions,
      parallel: options.parallel,
    };
    
    const start = Date.now();
    const result = await batchConvert(urls, batchOptions);
    const elapsed = (Date.now() - start) / 1000;
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Batch results (${elapsed.toFixed(1)}s):`);
    console.log(`   Total: ${result.total}`);
    console.log(`   Successful: ${result.successful}`);
    console.log(`   Failed: ${result.failed}`);
    console.log(`   Success rate: ${((result.successful / result.total) * 100).toFixed(1)}%`);
    
    if (result.failed > 0) {
      console.log('\n❌ Failed URLs:');
      result.results.forEach(r => {
        if (!r.success) {
          console.log(`   - ${r.url}: ${r.error?.message || 'Unknown error'}`);
        }
      });
    }
    
    console.log(`\n✅ Markdown files saved to ${path.resolve(options.outputDir)}`);
    process.exit(result.failed > 0 ? 1 : 0);
  } else {
    // Single URL
    console.log(`🌐 Converting ${options.url}`);
    const start = Date.now();
    const result = await convertUrlToMarkdown(options.url, converterOptions);
    const elapsed = (Date.now() - start) / 1000;
    
    if (result.success) {
      console.log(`\n✅ Conversion successful (${elapsed.toFixed(1)}s)`);
      console.log(`   Type detected: ${result.detection?.type || 'unknown'} (confidence ${result.detection?.confidence?.toFixed(2) || 'N/A'})`);
      console.log(`   Method used: ${result.extraction?.method || 'unknown'}`);
      console.log(`   Markdown length: ${result.metadata?.length || 0} characters`);
      if (result.metadata?.savedPath) {
        console.log(`   Saved to: ${result.metadata.savedPath}`);
      }
      if (options.saveToFile === false) {
        // Output markdown to stdout
        console.log('\n' + '='.repeat(50));
        console.log(result.markdown);
      }
    } else {
      console.error(`\n❌ Conversion failed: ${result.error?.message || 'Unknown error'}`);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { parseArgs, main };