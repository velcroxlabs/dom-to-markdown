#!/usr/bin/env node
/**
 * Performance Benchmark: Compare extraction methods
 * 
 * Runs the converter with different methods (Playwright, web_fetch, browser headless)
 * on a set of representative URLs and measures execution time.
 * 
 * Usage: node benchmarks/compare-methods.js [--urls <url1,url2,url3>] [--methods <playwright,web_fetch,browser>] [--output <file.json>]
 */

const fs = require('fs');
const path = require('path');
const { DomToMarkdownConverter } = require('../src/converter');

// Default test URLs (static, SPA, mixed)
const DEFAULT_URLS = [
  'https://httpbin.org/html',                     // Simple static HTML
  'https://react.dev',                            // React SPA
  'https://github.com/openclaw/openclaw'          // Mixed (SSR + JS)
];

// Method configurations
const METHOD_CONFIGS = {
  playwright: {
    usePlaywright: true,
    useWebFetch: false,
    useOpenClawBrowser: false,
    playwrightHeadless: true,
    playwrightTimeout: 30000
  },
  web_fetch: {
    usePlaywright: false,
    useWebFetch: true,
    useOpenClawBrowser: false,
    timeout: 30
  },
  browser_headless: {
    usePlaywright: false,
    useWebFetch: false,
    useOpenClawBrowser: true,
    headless: true,
    timeout: 30
  }
};

async function runBenchmark(urls, methods) {
  console.log('🚀 DOM→Markdown Performance Benchmark\n');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🔗 URLs: ${urls.join(', ')}`);
  console.log(`⚙️  Methods: ${methods.join(', ')}\n`);
  
  const results = [];
  
  for (const url of urls) {
    console.log(`\n=== ${url} ===`);
    
    for (const method of methods) {
      console.log(`\n  ${method.toUpperCase()}:`);
      
      // Skip unsupported combinations
      if (!METHOD_CONFIGS[method]) {
        console.log(`    ⚠️  Unknown method, skipping`);
        continue;
      }
      
      // Create converter with method-specific options
      const converter = new DomToMarkdownConverter({
        ...METHOD_CONFIGS[method],
        saveToFile: false,
        useCache: false,            // Disable cache for fair comparison
        politeness: true,           // Respect robots.txt and delays
        debug: false
      });
      
      try {
        const startTime = Date.now();
        const result = await converter.convertUrlToMarkdown(url);
        const duration = Date.now() - startTime;
        
        if (result.success) {
          console.log(`    ✅ Success (${duration}ms)`);
          console.log(`      Type: ${result.metadata.type}, Confidence: ${result.metadata.confidence}`);
          console.log(`      Method used: ${result.metadata.method}`);
          console.log(`      Length: ${result.metadata.length} chars`);
          
          results.push({
            url,
            method,
            success: true,
            duration,
            detectedType: result.metadata.type,
            detectedConfidence: result.metadata.confidence,
            actualMethod: result.metadata.method,
            markdownLength: result.metadata.length,
            stats: converter.getStats()
          });
        } else {
          console.log(`    ❌ Failed: ${result.error}`);
          results.push({
            url,
            method,
            success: false,
            duration,
            error: result.error
          });
        }
      } catch (error) {
        console.log(`    💥 Exception: ${error.message}`);
        results.push({
          url,
          method,
          success: false,
          duration: Date.now() - startTime,
          error: error.message
        });
      }
      
      // Small delay between method runs on same URL
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Delay between URLs
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  return results;
}

function generateSummary(results) {
  const summary = {
    timestamp: new Date().toISOString(),
    totalRuns: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    byMethod: {},
    byUrl: {}
  };
  
  // Group by method
  for (const result of results) {
    const method = result.method;
    if (!summary.byMethod[method]) {
      summary.byMethod[method] = {
        runs: 0,
        successes: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0
      };
    }
    const stat = summary.byMethod[method];
    stat.runs++;
    if (result.success) {
      stat.successes++;
      stat.totalDuration += result.duration;
      if (result.duration < stat.minDuration) stat.minDuration = result.duration;
      if (result.duration > stat.maxDuration) stat.maxDuration = result.duration;
    }
  }
  
  // Calculate averages
  for (const method in summary.byMethod) {
    const stat = summary.byMethod[method];
    if (stat.successes > 0) {
      stat.avgDuration = Math.round(stat.totalDuration / stat.successes);
    } else {
      stat.avgDuration = 0;
      stat.minDuration = 0;
      stat.maxDuration = 0;
    }
  }
  
  // Group by URL
  for (const result of results) {
    const url = result.url;
    if (!summary.byUrl[url]) {
      summary.byUrl[url] = {
        runs: 0,
        successes: 0,
        methods: {}
      };
    }
    const urlStat = summary.byUrl[url];
    urlStat.runs++;
    if (result.success) {
      urlStat.successes++;
    }
    if (!urlStat.methods[result.method]) {
      urlStat.methods[result.method] = { success: result.success, duration: result.duration };
    }
  }
  
  return summary;
}

function printSummary(summary, results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 BENCHMARK SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total runs: ${summary.totalRuns} (${summary.successful} successful, ${summary.failed} failed)`);
  console.log(`Timestamp: ${summary.timestamp}`);
  
  console.log('\n📈 By Method:');
  for (const method in summary.byMethod) {
    const stat = summary.byMethod[method];
    console.log(`  ${method}:`);
    console.log(`    Runs: ${stat.runs}, Successes: ${stat.successes}`);
    if (stat.successes > 0) {
      console.log(`    Duration: avg ${stat.avgDuration}ms, min ${stat.minDuration}ms, max ${stat.maxDuration}ms`);
    }
  }
  
  console.log('\n🔗 By URL:');
  for (const url in summary.byUrl) {
    const stat = summary.byUrl[url];
    console.log(`  ${url}:`);
    console.log(`    Runs: ${stat.runs}, Successes: ${stat.successes}`);
    for (const method in stat.methods) {
      const m = stat.methods[method];
      console.log(`    ${method}: ${m.success ? '✅' : '❌'} ${m.duration}ms`);
    }
  }
  
  // Recommendation
  console.log('\n💡 Recommendation:');
  const avgByMethod = {};
  for (const method in summary.byMethod) {
    if (summary.byMethod[method].successes > 0) {
      avgByMethod[method] = summary.byMethod[method].avgDuration;
    }
  }
  if (Object.keys(avgByMethod).length > 0) {
    const fastest = Object.entries(avgByMethod).reduce((a, b) => a[1] < b[1] ? a : b);
    console.log(`  Fastest method: ${fastest[0]} (${fastest[1]}ms average)`);
  }
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const urls = [];
  const methods = [];
  let outputFile = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--urls' && args[i + 1]) {
      urls.push(...args[i + 1].split(','));
      i++;
    } else if (args[i] === '--methods' && args[i + 1]) {
      methods.push(...args[i + 1].split(','));
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputFile = args[i + 1];
      i++;
    }
  }
  
  // Use defaults if not specified
  if (urls.length === 0) urls.push(...DEFAULT_URLS);
  if (methods.length === 0) methods.push(...Object.keys(METHOD_CONFIGS));
  
  console.log('🚀 DOM→Markdown Performance Benchmark');
  console.log('📅 ' + new Date().toISOString());
  
  const results = await runBenchmark(urls, methods);
  const summary = generateSummary(results);
  
  printSummary(summary, results);
  
  // Save results if output file specified
  if (outputFile) {
    const outputData = {
      summary,
      results,
      timestamp: new Date().toISOString()
    };
    const outputPath = path.resolve(process.cwd(), outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`\n💾 Results saved to: ${outputPath}`);
  }
  
  // Return summary for programmatic use
  return summary;
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Benchmark failed:', error);
    process.exit(1);
  });
}

module.exports = { runBenchmark, generateSummary };