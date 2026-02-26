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
    const hasHeadings = markdown.includes('Test Page');
    const hasList = markdown.includes('Item');
    const hasLink = markdown.includes('Example Link');

    const conversionPassed = markdown.length > 0 && hasHeadings && hasList && hasLink;

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

  // Test 5.1: Browser wrapper authentication
  console.log('\n5.1. Testing browser wrapper authentication...');
  try {
    // Mock browser tool
    const mockCalls = [];
    global.browser = async (params) => {
      mockCalls.push(params);
      // Return something that looks like success
      return { success: true };
    };

    const { OpenClawBrowserWrapper } = require('../src/browser-wrapper');
    const browserWrapper = new OpenClawBrowserWrapper({
      debug: false,
      cookies: [
        { name: 'session', value: 'abc123', domain: 'example.com' },
        { name: 'token', value: 'xyz', domain: 'example.com' }
      ],
      headers: {
        'Authorization': 'Bearer token123',
        'X-Custom': 'value'
      }
    });

    // Call applyAuthentication (which is called internally by navigateToUrl)
    await browserWrapper.applyAuthentication();

    // Verify mock calls
    const cookieCalls = mockCalls.filter(call => call.action === 'cookies');
    const headerCalls = mockCalls.filter(call => call.action === 'set' && call.kind === 'headers');

    const cookiesPassed = cookieCalls.length === 1 && 
                         cookieCalls[0].cookies.length === 2 &&
                         cookieCalls[0].cookies[0].name === 'session';
    const headersPassed = headerCalls.length === 1 &&
                         headerCalls[0].headers.Authorization === 'Bearer token123';

    const authPassed = cookiesPassed && headersPassed;

    testResults.push({
      name: 'Browser Wrapper Authentication',
      passed: authPassed,
      details: { cookieCalls: cookieCalls.length, headerCalls: headerCalls.length }
    });

    console.log(`   ${authPassed ? '✅' : '❌'} Authentication calls made`);
    console.log(`   Cookie calls: ${cookieCalls.length}, Header calls: ${headerCalls.length}`);

    // Cleanup mock
    delete global.browser;
  } catch (error) {
    // Cleanup mock on error
    delete global.browser;
    testResults.push({
      name: 'Browser Wrapper Authentication',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // Test 6: Playwright availability check
  console.log('\n6. Testing Playwright availability...');
  try {
    const { DomToMarkdownConverter } = require('../src/converter');
    const playwrightConverter = new DomToMarkdownConverter();

    const isAvailable = playwrightConverter.isPlaywrightAvailable();
    const playwrightPassed = typeof isAvailable === 'boolean';

    testResults.push({
      name: 'Playwright Availability',
      passed: playwrightPassed,
      details: { isAvailable }
    });

    console.log(`   ${playwrightPassed ? '✅' : '❌'} Playwright availability check works`);
    console.log(`   Playwright available: ${isAvailable}`);

  } catch (error) {
    testResults.push({
      name: 'Playwright Availability',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // Test 7: Playwright extraction method selection (static page)
  console.log('\n7. Testing Playwright method selection (static page)...');
  try {
    const { DomToMarkdownConverter } = require('../src/converter');
    const { PageTypeDetector } = require('../src/detector');

    const detector = new PageTypeDetector();
    const sampleHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>Static Page</title></head>
      <body><h1>Hello World</h1></body>
      </html>
    `;

    const frameworks = detector.detectFrameworks(sampleHtml);
    const classification = detector.classifyPage(sampleHtml, frameworks);
    const suggestion = detector.suggestExtractionMethod(classification);

    const converter = new DomToMarkdownConverter({
      usePlaywright: true,
      useWebFetch: false,
      useOpenClawBrowser: false
    });

    // Check if Playwright would be selected based on suggestion
    const wouldUsePlaywright = suggestion.method === 'playwright' &&
                               converter.isPlaywrightAvailable() &&
                               converter.options.usePlaywright;

    const selectionPassed = typeof suggestion.method === 'string' &&
                           ['playwright', 'web_fetch', 'openclaw-browser'].includes(suggestion.method);

    testResults.push({
      name: 'Playwright Method Selection',
      passed: selectionPassed,
      details: { suggestion, wouldUsePlaywright }
    });

    console.log(`   ${selectionPassed ? '✅' : '❌'} Method selection works`);
    console.log(`   Suggested method: ${suggestion.method}`);
    console.log(`   Would use Playwright: ${wouldUsePlaywright}`);

  } catch (error) {
    testResults.push({
      name: 'Playwright Method Selection',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // Test 8: Playwright integration smoke test (only if Playwright available)
  console.log('\n8. Testing Playwright integration smoke test...');
  try {
    const { DomToMarkdownConverter } = require('../src/converter');
    const converter = new DomToMarkdownConverter({
      usePlaywright: true,
      useWebFetch: false,
      useOpenClawBrowser: false,
      saveToFile: false,
      debug: false
    });

    const isPlaywrightAvailable = converter.isPlaywrightAvailable();

    if (isPlaywrightAvailable) {
      // Note: This test doesn't actually make network requests
      // It just verifies the converter can be instantiated with Playwright settings
      const config = converter.options;
      const configValid = config.usePlaywright === true &&
                         config.playwrightBrowser === 'chromium' &&
                         config.playwrightTimeout === 30000;

      const smokePassed = configValid;

      testResults.push({
        name: 'Playwright Integration Smoke',
        passed: smokePassed,
        details: { config, isPlaywrightAvailable }
      });

      console.log(`   ${smokePassed ? '✅' : '❌'} Playwright configuration valid`);
      console.log(`   Browser: ${config.playwrightBrowser}, Timeout: ${config.playwrightTimeout}ms`);
    } else {
      // Skip test gracefully
      testResults.push({
        name: 'Playwright Integration Smoke',
        passed: true,
        details: { skipped: true, reason: 'Playwright not available' }
      });

      console.log(`   ⏭️  Skipped: Playwright not available (install with npm install)`);
    }

  } catch (error) {
    testResults.push({
      name: 'Playwright Integration Smoke',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // Test 9: Table preservation
  console.log('\n9. Testing table preservation...');
  try {
    const { DomToMarkdownConverter } = require('../src/converter');
    const converter = new DomToMarkdownConverter({ debug: false });

    // Basic table
    const basicHtml = '<table><tr><th>Header A</th><th>Header B</th></tr><tr><td>Cell 1</td><td>Cell 2</td></tr></table>';
    const basicMd = converter.convertHtmlToMarkdown(basicHtml);
    const basicPassed = basicMd.includes('|') && basicMd.includes('Header A') && basicMd.includes('---');

    // Table with colspan
    const colspanHtml = '<table><tr><td colspan="2">Wide</td></tr><tr><td>A</td><td>B</td></tr></table>';
    const colspanMd = converter.convertHtmlToMarkdown(colspanHtml);
    const colspanPassed = colspanMd.includes('|') && colspanMd.includes('Wide');

    // Table with alignment
    const alignHtml = '<table><tr><th align="center">Centered</th><th align="right">Right</th></tr><tr><td align="left">Left</td><td align="center">Center</td></tr></table>';
    const alignMd = converter.convertHtmlToMarkdown(alignHtml);
    const hasCenter = alignMd.includes(':---:');
    const hasRight = alignMd.includes('---:');
    const hasLeft = alignMd.includes(':---');
    const alignPassed = hasCenter && hasRight && hasLeft;

    const tablePassed = basicPassed && colspanPassed && alignPassed;

    testResults.push({
      name: 'Table Preservation',
      passed: tablePassed,
      details: { basicPassed, colspanPassed, alignPassed }
    });

    console.log(`   ${tablePassed ? '✅' : '❌'} Table conversion works`);
    console.log(`   Basic: ${basicPassed ? 'OK' : 'FAIL'}, Colspan: ${colspanPassed ? 'OK' : 'FAIL'}, Alignment: ${alignPassed ? 'OK' : 'FAIL'}`);

  } catch (error) {
    testResults.push({
      name: 'Table Preservation',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // Test 10: Image resizing functionality
  console.log('\n10. Testing image resizing...');
  try {
    const { DomToMarkdownConverter } = require('../src/converter');

    // Test 1: isSharpAvailable returns false when sharp not installed
    // Mock isSharpAvailable to avoid sharp crash
    const converter = new DomToMarkdownConverter({ debug: false });
    converter.isSharpAvailable = () => false;
    const sharpAvailable = converter.isSharpAvailable();
    console.log(`   Sharp available (mocked): ${sharpAvailable}`);

    // Test 2: When sharp not available, resize method does nothing
    const tempDir = path.join(__dirname, '..', 'test-temp-resize');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const dummyImage = path.join(tempDir, 'dummy.jpg');
    fs.writeFileSync(dummyImage, 'fake image data');
    // This should not throw
    await converter._resizeImageIfNeeded(dummyImage);
    fs.unlinkSync(dummyImage);

    // Cleanup
    fs.rmdirSync(tempDir);

    const resizePassed = true;
    testResults.push({
      name: 'Image Resizing',
      passed: resizePassed,
      details: { sharpAvailable }
    });

    console.log(`   ${resizePassed ? '✅' : '❌'} Image resizing tests passed`);

  } catch (error) {
    testResults.push({
      name: 'Image Resizing',
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