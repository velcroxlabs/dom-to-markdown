/**
 * Integration tests for DOM → Markdown skill
 * 
 * These tests verify the skill works correctly in different scenarios.
 * Note: Some tests require OpenClaw browser to be available.
 */

const { DomToMarkdownConverter } = require('../src/converter');
const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('🧪 DOM → Markdown Skill - Integration Tests\n');
  
  const testResults = [];
  const converter = new DomToMarkdownConverter({
    debug: false,
    saveToFile: false  // Don't save during tests
  });
  
  // Test 1: Detector functionality
  console.log('1. Testing page type detector...');
  try {
    const { PageTypeDetector } = require('../src/detector');
    const detector = new PageTypeDetector();
    
    // Test with sample HTML
    const sampleHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>React App</title>
        <script src="/react.js"></script>
      </head>
      <body>
        <div id="root"></div>
        <script>window.__NEXT_DATA__ = {}</script>
      </body>
      </html>
    `;
    
    const frameworks = detector.detectFrameworks(sampleHtml);
    const classification = detector.classifyPage(sampleHtml, frameworks);
    
    const detectorPassed = classification.type === 'spa' && 
                          classification.frameworks.react;
    
    testResults.push({
      name: 'Page Type Detector',
      passed: detectorPassed,
      details: classification
    });
    
    console.log(`   ${detectorPassed ? '✅' : '❌'} Detected: ${classification.type}`);
    console.log(`   Frameworks: ${Object.keys(classification.frameworks).join(', ') || 'none'}`);
    
  } catch (error) {
    testResults.push({
      name: 'Page Type Detector',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Failed: ${error.message}`);
  }
  
  // Test 2: HTML to Markdown conversion
  console.log('\n2. Testing HTML to Markdown conversion...');
  try {
    const sampleHtml = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Test Page</h1>
        <p>This is a <strong>test</strong> paragraph.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
        <a href="https://example.com">Example Link</a>
        <img src="test.jpg" alt="Test Image">
      </body>
      </html>
    `;
    
    const markdown = converter.convertHtmlToMarkdown(sampleHtml);
    const hasHeadings = markdown.includes('# Test Page');
    const hasList = markdown.includes('- Item');
    const hasLink = markdown.includes('[Example Link]');
    
    const conversionPassed = hasHeadings && hasList && hasLink;
    
    testResults.push({
      name: 'HTML to Markdown Conversion',
      passed: conversionPassed,
      details: { hasHeadings, hasList, hasLink, length: markdown.length }
    });
    
    console.log(`   ${conversionPassed ? '✅' : '❌'} Conversion successful`);
    console.log(`   Markdown length: ${markdown.length} characters`);
    
  } catch (error) {
    testResults.push({
      name: 'HTML to Markdown Conversion',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Failed: ${error.message}`);
  }
  
  // Test 3: File saving (mock)
  console.log('\n3. Testing file saving...');
  try {
    const testDir = path.join(__dirname, '..', 'test-output');
    const testConverter = new DomToMarkdownConverter({
      saveToFile: true,
      outputDir: testDir
    });
    
    // Mock save result
    const savedPath = testConverter.saveResult(
      'https://example.com/test',
      '# Test Markdown\n\nThis is a test.',
      { test: true }
    );
    
    const savePassed = savedPath && savedPath.includes('test-output');
    
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    
    testResults.push({
      name: 'File Saving',
      passed: savePassed,
      details: { savedPath }
    });
    
    console.log(`   ${savePassed ? '✅' : '❌'} File saving works`);
    console.log(`   Path: ${savedPath || 'none'}`);
    
  } catch (error) {
    testResults.push({
      name: 'File Saving',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Failed: ${error.message}`);
  }
  
  // Test 4: Statistics tracking
  console.log('\n4. Testing statistics tracking...');
  try {
    const statsConverter = new DomToMarkdownConverter();
    
    // Update stats manually
    statsConverter.updateStats('static', 'web_fetch', true);
    statsConverter.updateStats('spa', 'browser_headless', true);
    statsConverter.updateStats('mixed', 'hybrid', false);
    
    const stats = statsConverter.getStats();
    
    const statsPassed = stats.totalRequests === 3 &&
                       stats.successes === 2 &&
                       stats.failures === 1;
    
    testResults.push({
      name: 'Statistics Tracking',
      passed: statsPassed,
      details: stats
    });
    
    console.log(`   ${statsPassed ? '✅' : '❌'} Stats tracked correctly`);
    console.log(`   Requests: ${stats.totalRequests}, Successes: ${stats.successes}, Failures: ${stats.failures}`);
    
  } catch (error) {
    testResults.push({
      name: 'Statistics Tracking',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Failed: ${error.message}`);
  }
  
  // Test 5: Browser wrapper availability check
  console.log('\n5. Testing browser wrapper...');
  try {
    const { OpenClawBrowserWrapper } = require('../src/browser-wrapper');
    const browserWrapper = new OpenClawBrowserWrapper({ debug: false });
    
    // This will fail outside OpenClaw agent context (expected)
    const isAvailable = browserWrapper.isBrowserToolAvailable();
    
    // In test environment, browser tool is not available
    // So we expect this to return false
    const wrapperPassed = isAvailable === false;
    
    testResults.push({
      name: 'Browser Wrapper',
      passed: wrapperPassed,
      details: { isAvailable, expected: false }
    });
    
    console.log(`   ${wrapperPassed ? '✅' : '❌'} Browser wrapper check works`);
    console.log(`   Browser tool available: ${isAvailable} (expected: false in tests)`);
    
  } catch (error) {
    testResults.push({
      name: 'Browser Wrapper',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Failed: ${error.message}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passedTests = testResults.filter(t => t.passed).length;
  const totalTests = testResults.length;
  const successRate = (passedTests / totalTests) * 100;
  
  console.log(`\nTotal tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success rate: ${successRate.toFixed(1)}%\n`);
  
  // Detailed results
  for (const test of testResults) {
    const icon = test.passed ? '✅' : '❌';
    console.log(`${icon} ${test.name}`);
    
    if (!test.passed && test.error) {
      console.log(`   Error: ${test.error}`);
    }
  }
  
  // Save test report
  const reportDir = path.join(__dirname, '..', 'test-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportPath = path.join(reportDir, `test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalTests,
    passedTests,
    failedTests: totalTests - passedTests,
    successRate,
    results: testResults
  }, null, 2));
  
  console.log(`\n📄 Test report saved to: ${reportPath}`);
  
  return {
    success: passedTests === totalTests,
    totalTests,
    passedTests,
    successRate,
    results: testResults,
    reportPath
  };
}

// Run tests if called directly
if (require.main === module) {
  runTests()
    .then(result => {
      console.log('\n' + '='.repeat(60));
      console.log(result.success ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED');
      console.log('='.repeat(60));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner error:', error);
      process.exit(1);
    });
}

module.exports = { runTests };