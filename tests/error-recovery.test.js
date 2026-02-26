/**
 * Unit tests for error recovery and timeout retry logic
 * 
 * Tests Playwright timeout retry simulation and fallback behavior.
 */

const fs = require('fs');
const path = require('path');

// We'll require modules dynamically in each test to allow mocking
function clearModuleCache(moduleName) {
  const resolved = require.resolve(moduleName);
  delete require.cache[resolved];
}

async function runErrorRecoveryTests() {
  console.log('🧪 Error Recovery - Timeout Retry Simulation\n');
  console.log('Date:', new Date().toISOString());
  console.log('---\n');

  const testResults = [];
  const startTime = Date.now();

  // Helper to add test result
  function recordTest(name, passed, details = '') {
    testResults.push({ name, passed, details });
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name} ${details ? `(${details})` : ''}`);
  }

  // --------------------------------------------------------------------
  // 1. Mock PlaywrightWrapper that throws timeout errors
  // --------------------------------------------------------------------
  console.log('1. Testing Playwright timeout retry logic...');
  
  // Save original PlaywrightWrapper for later restoration
  const originalPlaywrightWrapper = require('../src/playwright-wrapper');
  
  // --------------------------------------------------------------------
  // Test 1.1: Timeout error triggers retry (maxRetries = 2)
  // --------------------------------------------------------------------
  try {
    // Mock that counts calls and throws timeout error
    class MockPlaywrightWrapper {
      constructor(options) {
        this.options = options;
        MockPlaywrightWrapper.callCount++;
        MockPlaywrightWrapper.lastOptions = options;
      }
      
      async extractFromUrl(url, userOptions) {
        MockPlaywrightWrapper.extractCallCount++;
        MockPlaywrightWrapper.lastUrl = url;
        // Throw timeout error on first two attempts, succeed on third
        if (MockPlaywrightWrapper.extractCallCount <= 2) {
          throw new Error('Timeout: Navigation timeout of 30000 ms exceeded');
        }
        // Return success
        return {
          success: true,
          html: '<html><body>Success after retries</body></html>',
          markdown: '# Success',
          metadata: {}
        };
      }
    }
    MockPlaywrightWrapper.callCount = 0;
    MockPlaywrightWrapper.extractCallCount = 0;
    MockPlaywrightWrapper.lastOptions = null;
    MockPlaywrightWrapper.lastUrl = null;
    
    // Replace the module export
    const playwrightWrapperPath = require.resolve('../src/playwright-wrapper');
    require.cache[playwrightWrapperPath].exports = MockPlaywrightWrapper;
    
    // Clear converter cache so it picks up the mock
    clearModuleCache('../src/converter');
    // Re-require converter (will use mocked PlaywrightWrapper)
    const { DomToMarkdownConverter } = require('../src/converter');
    
    // Create converter with retry enabled
    const converter = new DomToMarkdownConverter({
      debug: false,
      usePlaywright: true,
      playwrightRetryTimeoutErrors: true,
      playwrightMaxRetries: 2,
      playwrightRetryDelay: 10, // short delay for testing
      useOpenClawBrowser: false,
      useWebFetch: false
    });
    
    // Mock ensurePlaywrightAvailable to not throw
    converter.ensurePlaywrightAvailable = () => {};
    
    // Call extractWithPlaywright
    const url = 'https://example.com';
    const suggestion = { method: 'playwright', reason: 'test' };
    const result = await converter.extractWithPlaywright(url, suggestion);
    
    // Verify: should have succeeded after retries
    const passed = MockPlaywrightWrapper.extractCallCount === 3 && // 2 failures + 1 success
                   result.method === 'playwright' &&
                   result.html.includes('Success');
    
    recordTest('Timeout retry triggers retry (maxRetries=2)', passed, 
      `calls: ${MockPlaywrightWrapper.extractCallCount}, method: ${result.method}`);
    
    // Restore original
    require.cache[playwrightWrapperPath].exports = originalPlaywrightWrapper;
    
  } catch (error) {
    // Restore original on error
    const playwrightWrapperPath = require.resolve('../src/playwright-wrapper');
    require.cache[playwrightWrapperPath].exports = originalPlaywrightWrapper;
    recordTest('Timeout retry triggers retry (maxRetries=2)', false, `Error: ${error.message}`);
    console.error(error);
  }

  // --------------------------------------------------------------------
  // Test 1.2: Non‑timeout error does NOT trigger retry, falls back to web_fetch
  // --------------------------------------------------------------------
  try {
    // New mock that throws a non-timeout error
    class MockPlaywrightWrapperNonTimeout {
      constructor(options) {
        this.options = options;
        MockPlaywrightWrapperNonTimeout.callCount++;
      }
      async extractFromUrl(url, userOptions) {
        MockPlaywrightWrapperNonTimeout.extractCallCount++;
        throw new Error('Generic error: Something went wrong');
      }
    }
    MockPlaywrightWrapperNonTimeout.callCount = 0;
    MockPlaywrightWrapperNonTimeout.extractCallCount = 0;
    
    const playwrightWrapperPath = require.resolve('../src/playwright-wrapper');
    require.cache[playwrightWrapperPath].exports = MockPlaywrightWrapperNonTimeout;
    clearModuleCache('../src/converter');
    const { DomToMarkdownConverter } = require('../src/converter');
    
    const converter = new DomToMarkdownConverter({
      debug: false,
      usePlaywright: true,
      playwrightRetryTimeoutErrors: true,
      playwrightMaxRetries: 2,
      playwrightRetryDelay: 10,
      useOpenClawBrowser: false,
      useWebFetch: true
    });
    converter.ensurePlaywrightAvailable = () => {};
    // Mock extractWithWebFetch to return success (so we can detect fallback)
    converter.extractWithWebFetch = async (url) => ({
      method: 'web_fetch',
      html: '<html><body>Web fetch fallback</body></html>',
      raw: '<html><body>Web fetch fallback</body></html>',
      length: 100,
      metadata: {},
      simulated: false
    });
    
    const url = 'https://example.com';
    const suggestion = { method: 'playwright', reason: 'test' };
    
    const result = await converter.extractWithPlaywright(url, suggestion);
    
    // Should have called extract only once (no retry) and fallback to web_fetch
    const passed = MockPlaywrightWrapperNonTimeout.extractCallCount === 1 &&
                   result.method === 'web_fetch';
    
    recordTest('Non‑timeout error does NOT trigger retry', passed,
      `calls: ${MockPlaywrightWrapperNonTimeout.extractCallCount}, result method: ${result.method}`);
    
    require.cache[playwrightWrapperPath].exports = originalPlaywrightWrapper;
    
  } catch (error) {
    const playwrightWrapperPath = require.resolve('../src/playwright-wrapper');
    require.cache[playwrightWrapperPath].exports = originalPlaywrightWrapper;
    recordTest('Non‑timeout error does NOT trigger retry', false, `Error: ${error.message}`);
    console.error(error);
  }

  // --------------------------------------------------------------------
  // Test 1.3: Retry disabled (playwrightRetryTimeoutErrors = false), falls back to web_fetch
  // --------------------------------------------------------------------
  try {
    class MockPlaywrightWrapperNoRetry {
      constructor(options) {
        MockPlaywrightWrapperNoRetry.callCount++;
      }
      async extractFromUrl(url, userOptions) {
        MockPlaywrightWrapperNoRetry.extractCallCount++;
        throw new Error('Timeout: Navigation timeout of 30000 ms exceeded');
      }
    }
    MockPlaywrightWrapperNoRetry.callCount = 0;
    MockPlaywrightWrapperNoRetry.extractCallCount = 0;
    
    const playwrightWrapperPath = require.resolve('../src/playwright-wrapper');
    require.cache[playwrightWrapperPath].exports = MockPlaywrightWrapperNoRetry;
    clearModuleCache('../src/converter');
    const { DomToMarkdownConverter } = require('../src/converter');
    
    const converter = new DomToMarkdownConverter({
      debug: false,
      usePlaywright: true,
      playwrightRetryTimeoutErrors: false, // Disabled
      playwrightMaxRetries: 2,
      playwrightRetryDelay: 10,
      useOpenClawBrowser: false,
      useWebFetch: true
    });
    converter.ensurePlaywrightAvailable = () => {};
    // Mock extractWithWebFetch to return success
    converter.extractWithWebFetch = async (url) => ({
      method: 'web_fetch',
      html: '<html><body>Web fetch fallback</body></html>',
      raw: '<html><body>Web fetch fallback</body></html>',
      length: 100,
      metadata: {},
      simulated: false
    });
    
    const url = 'https://example.com';
    const suggestion = { method: 'playwright', reason: 'test' };
    
    const result = await converter.extractWithPlaywright(url, suggestion);
    
    // Should have called extract only once (retry disabled) and fallback to web_fetch
    const passed = MockPlaywrightWrapperNoRetry.extractCallCount === 1 &&
                   result.method === 'web_fetch';
    
    recordTest('Retry disabled when playwrightRetryTimeoutErrors=false', passed,
      `calls: ${MockPlaywrightWrapperNoRetry.extractCallCount}, result method: ${result.method}`);
    
    require.cache[playwrightWrapperPath].exports = originalPlaywrightWrapper;
    
  } catch (error) {
    const playwrightWrapperPath = require.resolve('../src/playwright-wrapper');
    require.cache[playwrightWrapperPath].exports = originalPlaywrightWrapper;
    recordTest('Retry disabled when playwrightRetryTimeoutErrors=false', false, `Error: ${error.message}`);
    console.error(error);
  }

  // --------------------------------------------------------------------
  // Test 1.4: Fallback to OpenClaw browser after all retries exhausted
  // --------------------------------------------------------------------
  try {
    class MockPlaywrightWrapperAllFail {
      constructor(options) {
        MockPlaywrightWrapperAllFail.callCount++;
      }
      async extractFromUrl(url, userOptions) {
        MockPlaywrightWrapperAllFail.extractCallCount++;
        throw new Error('Timeout: Navigation timeout of 30000 ms exceeded');
      }
    }
    MockPlaywrightWrapperAllFail.callCount = 0;
    MockPlaywrightWrapperAllFail.extractCallCount = 0;
    
    const playwrightWrapperPath = require.resolve('../src/playwright-wrapper');
    require.cache[playwrightWrapperPath].exports = MockPlaywrightWrapperAllFail;
    clearModuleCache('../src/converter');
    const { DomToMarkdownConverter } = require('../src/converter');
    
    // Mock browser fallback to succeed
    const converter = new DomToMarkdownConverter({
      debug: false,
      usePlaywright: true,
      playwrightRetryTimeoutErrors: true,
      playwrightMaxRetries: 1, // Only one retry (total attempts = 2)
      playwrightRetryDelay: 10,
      useOpenClawBrowser: true,
      useWebFetch: false
    });
    converter.ensurePlaywrightAvailable = () => {};
    // Mock extractWithBrowserHeadless to return success
    converter.extractWithBrowserHeadless = async (url, suggestion) => ({
      method: 'browser_headless',
      html: '<html><body>Browser fallback</body></html>',
      raw: '<html><body>Browser fallback</body></html>',
      length: 100,
      metadata: {},
      simulated: false
    });
    
    const url = 'https://example.com';
    const suggestion = { method: 'playwright', reason: 'test' };
    
    const result = await converter.extractWithPlaywright(url, suggestion);
    
    // Should have called playwright extract 2 times (initial + 1 retry) and then fallback
    const passed = MockPlaywrightWrapperAllFail.extractCallCount === 2 &&
                   result.method === 'browser_headless';
    
    recordTest('Fallback to browser after retries exhausted', passed,
      `playwright calls: ${MockPlaywrightWrapperAllFail.extractCallCount}, result method: ${result.method}`);
    
    require.cache[playwrightWrapperPath].exports = originalPlaywrightWrapper;
    
  } catch (error) {
    const playwrightWrapperPath = require.resolve('../src/playwright-wrapper');
    require.cache[playwrightWrapperPath].exports = originalPlaywrightWrapper;
    recordTest('Fallback to browser after retries exhausted', false, `Error: ${error.message}`);
    console.error(error);
  }

  // --------------------------------------------------------------------
  // Test 1.5: Fallback to web_fetch when browser also disabled
  // --------------------------------------------------------------------
  try {
    class MockPlaywrightWrapperAllFail2 {
      constructor(options) {
        MockPlaywrightWrapperAllFail2.callCount++;
      }
      async extractFromUrl(url, userOptions) {
        MockPlaywrightWrapperAllFail2.extractCallCount++;
        throw new Error('Timeout: Navigation timeout of 30000 ms exceeded');
      }
    }
    MockPlaywrightWrapperAllFail2.callCount = 0;
    MockPlaywrightWrapperAllFail2.extractCallCount = 0;
    
    const playwrightWrapperPath = require.resolve('../src/playwright-wrapper');
    require.cache[playwrightWrapperPath].exports = MockPlaywrightWrapperAllFail2;
    clearModuleCache('../src/converter');
    const { DomToMarkdownConverter } = require('../src/converter');
    
    const converter = new DomToMarkdownConverter({
      debug: false,
      usePlaywright: true,
      playwrightRetryTimeoutErrors: true,
      playwrightMaxRetries: 1,
      playwrightRetryDelay: 10,
      useOpenClawBrowser: false, // Browser disabled
      useWebFetch: true
    });
    converter.ensurePlaywrightAvailable = () => {};
    // Mock extractWithWebFetch to return success
    converter.extractWithWebFetch = async (url) => ({
      method: 'web_fetch',
      html: '<html><body>Web fetch fallback</body></html>',
      raw: '<html><body>Web fetch fallback</body></html>',
      length: 100,
      metadata: {},
      simulated: false
    });
    
    const url = 'https://example.com';
    const suggestion = { method: 'playwright', reason: 'test' };
    
    const result = await converter.extractWithPlaywright(url, suggestion);
    
    const passed = MockPlaywrightWrapperAllFail2.extractCallCount === 2 &&
                   result.method === 'web_fetch';
    
    recordTest('Fallback to web_fetch when browser disabled', passed,
      `playwright calls: ${MockPlaywrightWrapperAllFail2.extractCallCount}`);
    
    require.cache[playwrightWrapperPath].exports = originalPlaywrightWrapper;
    
  } catch (error) {
    const playwrightWrapperPath = require.resolve('../src/playwright-wrapper');
    require.cache[playwrightWrapperPath].exports = originalPlaywrightWrapper;
    recordTest('Fallback to web_fetch when browser disabled', false, `Error: ${error.message}`);
    console.error(error);
  }

  // --------------------------------------------------------------------
  // 2. Testing web_fetch network error retry logic
  // --------------------------------------------------------------------
  console.log('\n2. Testing web_fetch network error retry logic...');
  
  // Save original globals
  const originalWebFetch = global.web_fetch;
  const originalFetch = global.fetch;
  
  // --------------------------------------------------------------------
  // Test 2.1: Network error triggers retry (maxRetries = 2)
  // --------------------------------------------------------------------
  try {
    // Mock web_fetch that throws network errors first two attempts, succeeds on third
    let webFetchCallCount = 0;
    global.web_fetch = async (options) => {
      webFetchCallCount++;
      if (webFetchCallCount <= 2) {
        throw new Error('Timeout: fetch failed');
      }
      return {
        rawHtml: '<html><body>Success after retries</body></html>',
        content: 'Success after retries'
      };
    };
    global.fetch = undefined; // Ensure global.fetch not used
    
    clearModuleCache('../src/converter');
    const { DomToMarkdownConverter } = require('../src/converter');
    
    const converter = new DomToMarkdownConverter({
      debug: false,
      usePlaywright: false,
      useWebFetch: true,
      webFetchRetryNetworkErrors: true,
      webFetchMaxRetries: 2,
      webFetchRetryDelay: 10,
      useOpenClawBrowser: false
    });
    
    const url = 'https://example.com';
    const result = await converter.extractWithWebFetch(url);
    
    const passed = webFetchCallCount === 3 &&
                   result.method === 'web_fetch' &&
                   result.html.includes('Success');
    
    recordTest('Network error triggers retry in web_fetch tool (maxRetries=2)', passed,
      `calls: ${webFetchCallCount}, method: ${result.method}`);
    
  } catch (error) {
    recordTest('Network error triggers retry in web_fetch tool (maxRetries=2)', false, `Error: ${error.message}`);
    console.error(error);
  } finally {
    global.web_fetch = originalWebFetch;
    global.fetch = originalFetch;
  }
  
  // --------------------------------------------------------------------
  // Test 2.2: Non‑network error (HTTP 404) does NOT trigger retry
  // --------------------------------------------------------------------
  try {
    let webFetchCallCount = 0;
    global.web_fetch = async (options) => {
      webFetchCallCount++;
      throw new Error('HTTP 404');
    };
    global.fetch = undefined;
    
    clearModuleCache('../src/converter');
    const { DomToMarkdownConverter } = require('../src/converter');
    
    const converter = new DomToMarkdownConverter({
      debug: false,
      usePlaywright: false,
      useWebFetch: true,
      webFetchRetryNetworkErrors: true,
      webFetchMaxRetries: 2,
      webFetchRetryDelay: 10,
      useOpenClawBrowser: false
    });
    
    // Mock extractWithWebFetch to catch the error and fallback to simulation
    // Since web_fetch will throw HTTP error, retry should not happen (non-network error)
    // The converter will fallback to global fetch, then simulation.
    // We'll mock global fetch to also throw HTTP error.
    global.fetch = async (url, options) => {
      throw new Error('HTTP 404');
    };
    
    const url = 'https://example.com';
    const result = await converter.extractWithWebFetch(url);
    
    // Should have called web_fetch only once (no retry) and fallback to simulation
    const passed = webFetchCallCount === 1 &&
                   result.simulated === true;
    
    recordTest('Non‑network error does NOT trigger retry in web_fetch', passed,
      `calls: ${webFetchCallCount}, simulated: ${result.simulated}`);
    
  } catch (error) {
    recordTest('Non‑network error does NOT trigger retry in web_fetch', false, `Error: ${error.message}`);
    console.error(error);
  } finally {
    global.web_fetch = originalWebFetch;
    global.fetch = originalFetch;
  }
  
  // --------------------------------------------------------------------
  // Test 2.3: Retry disabled when webFetchRetryNetworkErrors = false
  // --------------------------------------------------------------------
  try {
    let webFetchCallCount = 0;
    global.web_fetch = async (options) => {
      webFetchCallCount++;
      throw new Error('Timeout: fetch failed');
    };
    global.fetch = undefined;
    
    clearModuleCache('../src/converter');
    const { DomToMarkdownConverter } = require('../src/converter');
    
    const converter = new DomToMarkdownConverter({
      debug: false,
      usePlaywright: false,
      useWebFetch: true,
      webFetchRetryNetworkErrors: false, // Disabled
      webFetchMaxRetries: 2,
      webFetchRetryDelay: 10,
      useOpenClawBrowser: false
    });
    
    // Mock global fetch to succeed (so we can detect fallback)
    global.fetch = async (url, options) => ({
      ok: true,
      text: () => '<html><body>Global fetch fallback</body></html>'
    });
    
    const url = 'https://example.com';
    const result = await converter.extractWithWebFetch(url);
    
    // Should have called web_fetch only once (retry disabled) and fallback to global fetch
    const passed = webFetchCallCount === 1 &&
                   result.method === 'web_fetch' &&
                   result.html.includes('Global fetch');
    
    recordTest('Retry disabled when webFetchRetryNetworkErrors=false', passed,
      `calls: ${webFetchCallCount}, method: ${result.method}`);
    
  } catch (error) {
    recordTest('Retry disabled when webFetchRetryNetworkErrors=false', false, `Error: ${error.message}`);
    console.error(error);
  } finally {
    global.web_fetch = originalWebFetch;
    global.fetch = originalFetch;
  }
  
  // --------------------------------------------------------------------
  // Test 2.4: Global fetch network error retry
  // --------------------------------------------------------------------
  try {
    // No web_fetch tool
    global.web_fetch = undefined;
    let fetchCallCount = 0;
    global.fetch = async (url, options) => {
      fetchCallCount++;
      if (fetchCallCount <= 2) {
        throw new Error('ETIMEDOUT');
      }
      return {
        ok: true,
        text: () => '<html><body>Global fetch success after retries</body></html>'
      };
    };
    
    clearModuleCache('../src/converter');
    const { DomToMarkdownConverter } = require('../src/converter');
    
    const converter = new DomToMarkdownConverter({
      debug: false,
      usePlaywright: false,
      useWebFetch: true,
      webFetchRetryNetworkErrors: true,
      webFetchMaxRetries: 2,
      webFetchRetryDelay: 10,
      useOpenClawBrowser: false
    });
    
    const url = 'https://example.com';
    const result = await converter.extractWithWebFetch(url);
    
    const passed = fetchCallCount === 3 &&
                   result.method === 'web_fetch' &&
                   result.html.includes('Global fetch success');
    
    recordTest('Global fetch network error triggers retry', passed,
      `calls: ${fetchCallCount}, method: ${result.method}`);
    
  } catch (error) {
    recordTest('Global fetch network error triggers retry', false, `Error: ${error.message}`);
    console.error(error);
  } finally {
    global.web_fetch = originalWebFetch;
    global.fetch = originalFetch;
  }
  
  // --------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------
  const duration = Date.now() - startTime;
  console.log('\n' + '='.repeat(60));
  console.log('📊 ERROR RECOVERY TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passedTests = testResults.filter(t => t.passed).length;
  const totalTests = testResults.length;
  const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
  
  console.log(`\nTotal tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success rate: ${successRate.toFixed(1)}%`);
  console.log(`Duration: ${duration}ms\n`);
  
  // Detailed results
  for (const test of testResults) {
    const icon = test.passed ? '✅' : '❌';
    console.log(`${icon} ${test.name}`);
    if (!test.passed && test.details) {
      console.log(`   Details: ${test.details}`);
    }
  }
  
  return {
    success: passedTests === totalTests,
    totalTests,
    passedTests,
    successRate,
    results: testResults,
    duration
  };
}

// Run tests if called directly
if (require.main === module) {
  runErrorRecoveryTests()
    .then(result => {
      console.log('\n' + '='.repeat(60));
      console.log(result.success ? '✅ ALL ERROR RECOVERY TESTS PASSED' : '⚠️ SOME TESTS FAILED');
      console.log('='.repeat(60));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner error:', error);
      process.exit(1);
    });
}

module.exports = { runErrorRecoveryTests };