/**
 * Unit tests for batch processing functionality
 * 
 * Tests batchConvert method with progress tracking.
 */

const fs = require('fs');
const path = require('path');
const { DomToMarkdownConverter } = require('../src/converter');

async function runBatchProcessingTests() {
  console.log('🧪 Batch Processing - Unit Tests\n');
  
  const testResults = [];
  
  // Helper: create temporary directory
  const tempDir = path.join(__dirname, '..', 'test-temp-batch');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Helper: cleanup after tests
  const cleanup = () => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  };
  
  // Helper: mock converter with overrides
  const createMockConverter = (overrides = {}) => {
    const converter = new DomToMarkdownConverter({
      debug: false,
      saveToFile: false,
      outputDir: tempDir,
      useCache: false,
      usePlaywright: false,
      useWebFetch: false,
      useOpenClawBrowser: false,
      ...overrides
    });
    
    // Override convertUrlToMarkdown to return mock result
    converter.convertUrlToMarkdown = async (url, options) => {
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Return mock result based on URL
      const success = !url.includes('fail');
      return {
        success,
        url,
        markdown: success ? `# Mock Markdown for ${url}\n\nContent.` : '',
        metadata: {
          type: 'mock',
          confidence: 1.0,
          method: 'mock',
          length: 100,
          durationMs: 15,
          timestamp: new Date().toISOString()
        },
        detection: { type: 'mock' },
        extraction: { method: 'mock' },
        error: success ? undefined : 'Simulated failure'
      };
    };
    
    return converter;
  };
  
  // Test 1: Basic batch conversion
  console.log('1. Testing basic batch conversion...');
  try {
    const converter = createMockConverter();
    const urls = [
      'https://example.com/page1',
      'https://example.com/page2',
      'https://example.com/page3'
    ];
    
    const result = await converter.batchConvert(urls, { parallel: 2 });
    
    let passed = result.success &&
                   result.total === 3 &&
                   result.successful === 3 &&
                   result.failed === 0 &&
                   Array.isArray(result.results) &&
                   result.results.length === 3;
    
    testResults.push({
      name: 'Basic batch conversion',
      passed,
      details: {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
        resultsLength: result.results.length
      }
    });
    
    console.log(`   ${passed ? '✅' : '❌'} Batch processed ${result.total} URLs, ${result.successful} successful, ${result.failed} failed`);
    
    // Verify each result
    for (const res of result.results) {
      if (!res.success || res.url === undefined) {
        console.log(`   ❌ Invalid result for ${res.url}`);
        passed = false;
      }
    }
    
  } catch (error) {
    testResults.push({
      name: 'Basic batch conversion',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 2: Progress tracking
  console.log('\n2. Testing progress tracking...');
  try {
    const converter = createMockConverter();
    const urls = [
      'https://example.com/page1',
      'https://example.com/page2',
      'https://example.com/page3',
      'https://example.com/fail1',
      'https://example.com/page5'
    ];
    
    const progressEvents = [];
    const onProgress = (event) => {
      progressEvents.push(event);
    };
    
    const result = await converter.batchConvert(urls, {
      parallel: 1, // sequential to easily track order
      onProgress
    });
    
    // Check that progress events were emitted
    const startEvent = progressEvents.find(e => e.phase === 'start');
    const endEvent = progressEvents.find(e => e.phase === 'end');
    const urlEvents = progressEvents.filter(e => e.url && e.url !== null);
    
    let passed = startEvent &&
                   endEvent &&
                   urlEvents.length === urls.length &&
                   progressEvents.length >= urls.length + 2 && // at least start, each url, end
                   result.total === urls.length;
    
    testResults.push({
      name: 'Progress tracking',
      passed,
      details: {
        progressEventsCount: progressEvents.length,
        startEvent: !!startEvent,
        endEvent: !!endEvent,
        urlEventsCount: urlEvents.length,
        totalUrls: urls.length
      }
    });
    
    console.log(`   ${passed ? '✅' : '❌'} Progress events: ${progressEvents.length} (start, ${urlEvents.length} URLs, end)`);
    
    // Verify ordering: processed count increments
    let lastProcessed = -1;
    for (const event of progressEvents) {
      if (event.processed !== undefined) {
        if (event.processed < lastProcessed) {
          console.log(`   ❌ Processed count not monotonic: ${lastProcessed} -> ${event.processed}`);
          passed = false;
        }
        lastProcessed = event.processed;
      }
    }
    
    // Verify each URL event contains result
    for (const event of urlEvents) {
      if (!event.result) {
        console.log(`   ❌ Missing result for ${event.url}`);
        passed = false;
      }
    }
    
  } catch (error) {
    testResults.push({
      name: 'Progress tracking',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 3: Batch delay
  console.log('\n3. Testing batch delay...');
  try {
    const converter = createMockConverter();
    const urls = [
      'https://example.com/page1',
      'https://example.com/page2',
      'https://example.com/page3',
      'https://example.com/page4'
    ];
    
    const startTime = Date.now();
    const result = await converter.batchConvert(urls, {
      parallel: 2,
      batchDelay: 100 // 100ms delay between batches
    });
    const duration = Date.now() - startTime;
    
    // With 4 URLs, parallel=2 => 2 batches, 1 delay between them
    // Expect duration at least 100ms (plus processing time ~10ms each)
    let passed = result.success && duration >= 100;
    
    testResults.push({
      name: 'Batch delay',
      passed,
      details: { duration, expectedMin: 100 }
    });
    
    console.log(`   ${passed ? '✅' : '❌'} Batch delay respected (duration ${duration}ms)`);
    
  } catch (error) {
    testResults.push({
      name: 'Batch delay',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Cleanup
  cleanup();
  
  // Summary
  console.log('\n📊 Batch Processing Test Summary');
  console.log('────────────────────────────────');
  const passedCount = testResults.filter(r => r.passed).length;
  const totalCount = testResults.length;
  
  for (const test of testResults) {
    console.log(`${test.passed ? '✅' : '❌'} ${test.name}`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  }
  
  console.log(`\n${passedCount}/${totalCount} tests passed`);
  
  return passedCount === totalCount;
}

// If run directly
if (require.main === module) {
  runBatchProcessingTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

module.exports = { runBatchProcessingTests };