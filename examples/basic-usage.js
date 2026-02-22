/**
 * Basic usage example for DOM → Markdown skill
 * 
 * Note: This code should run inside an OpenClaw agent session
 * where the 'browser' tool is available.
 */

const { convertUrlToMarkdown, batchConvert } = require('../src/converter');

async function main() {
  console.log('🚀 DOM → Markdown Skill - Basic Usage\n');
  
  // Example 1: Single URL conversion
  console.log('1. Converting single URL...');
  const result1 = await convertUrlToMarkdown('https://en.wikipedia.org/wiki/JavaScript', {
    debug: true,
    saveToFile: true,
    outputDir: './exports/markdown-examples'
  });
  
  console.log(`   ✅ Success: ${result1.success}`);
  console.log(`   📏 Markdown length: ${result1.metadata?.length || 0} characters`);
  console.log(`   🎯 Type detected: ${result1.detection?.type || 'unknown'}`);
  console.log(`   📁 Saved to: ${result1.metadata?.savedPath || 'not saved'}\n`);
  
  // Example 2: SPA with browser headless
  console.log('2. Converting SPA (React.dev)...');
  const result2 = await convertUrlToMarkdown('https://react.dev', {
    debug: true,
    saveToFile: true,
    headless: true,
    waitTime: 8000  // Longer wait for React app
  });
  
  console.log(`   ✅ Success: ${result2.success}`);
  console.log(`   🛠️  Method used: ${result2.extraction?.method || 'unknown'}`);
  console.log(`   📏 Markdown length: ${result2.metadata?.length || 0} characters\n`);
  
  // Example 3: Batch conversion
  console.log('3. Batch conversion...');
  const batchResult = await batchConvert([
    'https://news.ycombinator.com',
    'https://vuejs.org',
    'https://angular.io'
  ], {
    parallel: 2,
    debug: false,
    saveToFile: true
  });
  
  console.log(`   📊 Batch results:`);
  console.log(`      Total: ${batchResult.total}`);
  console.log(`      Successful: ${batchResult.successful}`);
  console.log(`      Failed: ${batchResult.failed}`);
  console.log(`      Success rate: ${((batchResult.successful / batchResult.total) * 100).toFixed(1)}%\n`);
  
  // Example 4: Get statistics
  console.log('4. Statistics:');
  const { DomToMarkdownConverter } = require('../src/converter');
  const converter = new DomToMarkdownConverter({ debug: false });
  
  // Simulate some usage for stats
  await converter.convertUrlToMarkdown('https://example.com', { saveToFile: false });
  
  const stats = converter.getStats();
  console.log(`   📈 Total requests: ${stats.totalRequests}`);
  console.log(`   ✅ Successes: ${stats.successes}`);
  console.log(`   ❌ Failures: ${stats.failures}`);
  console.log(`   🎯 Success rate: ${stats.successRate}%`);
  console.log(`   ⏱️  Duration: ${(stats.durationMs / 1000).toFixed(1)}s`);
  console.log(`   🚀 Requests/minute: ${stats.requestsPerMinute}\n`);
  
  console.log('🏁 Examples completed!');
  
  return {
    singleResult: result1,
    spaResult: result2,
    batchResult,
    stats
  };
}

// Run if called directly
if (require.main === module) {
  main()
    .then(results => {
      console.log('\n' + '='.repeat(50));
      console.log('✅ All examples executed successfully');
      console.log('='.repeat(50));
    })
    .catch(error => {
      console.error('❌ Error:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = { main };