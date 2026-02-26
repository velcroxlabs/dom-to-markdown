/**
 * Smoke test for Playwright integration
 */

const { DomToMarkdownConverter } = require('../src/converter');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSmokeTest() {
  console.log('🧪 Playwright Smoke Test\n');
  
  const results = [];
  const delayBetweenTests = 2000; // 2 seconds politeness
  
  async function runTest(name, url, options, extraCheck = null) {
    console.log(`${name}...`);
    const converter = new DomToMarkdownConverter({
      usePlaywright: true,
      useWebFetch: false,
      useOpenClawBrowser: false,
      saveToFile: false,
      debug: false,
      playwrightTimeout: 45000,
      ...options
    });
    
    try {
      const result = await converter.convertUrlToMarkdown(url);
      console.log(`   ✅ Success: ${result.markdown.length} characters`);
      console.log(`   Method used: ${result.metadata.method}`);
      if (extraCheck) {
        extraCheck(result);
      }
      results.push({ name, passed: true, error: null });
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      results.push({ name, passed: false, error: error.message });
    }
    await sleep(delayBetweenTests);
  }
  
  // Test 1: Static page with Playwright (should work)
  await runTest(
    '1. Testing static page (example.com) with Playwright',
    'https://example.com',
    {}
  );
  
  // Test 2: SPA page (React) with Playwright
  await runTest(
    '2. Testing SPA (react.dev) with Playwright',
    'https://react.dev',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );
  
  // Test 3: Vue.js SPA
  await runTest(
    '3. Testing SPA (vuejs.org) with Playwright',
    'https://vuejs.org',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );
  
  // Test 4: Complex static site (GitHub)
  await runTest(
    '4. Testing complex static site (github.com) with Playwright',
    'https://github.com',
    {}
  );
  
  // Test 5: Angular SPA
  await runTest(
    '5. Testing SPA (angular.io) with Playwright',
    'https://angular.io',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );
  
  // Test 6: Next.js SPA
  await runTest(
    '6. Testing SPA (nextjs.org) with Playwright',
    'https://nextjs.org',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 7: Static page (wikipedia.org) with Playwright
  await runTest(
    '7. Testing static page (wikipedia.org) with Playwright',
    'https://www.wikipedia.org',
    {}
  );

  // Test 8: SPA (reddit.com) with Playwright
  await runTest(
    '8. Testing SPA (reddit.com) with Playwright',
    'https://www.reddit.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 9: Static site (bbc.com/news) with Playwright
  await runTest(
    '9. Testing static site (bbc.com/news) with Playwright',
    'https://www.bbc.com/news',
    {}
  );

  // Test 10: Static site (microsoft.com) with Playwright
  await runTest(
    '10. Testing static site (microsoft.com) with Playwright',
    'https://www.microsoft.com',
    {}
  );

  console.log('📊 SMOKE TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const successRate = (passed / total) * 100;
  
  console.log(`\nTotal tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  console.log(`Success rate: ${successRate.toFixed(1)}%\n`);
  
  for (const r of results) {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} ${r.name}`);
    if (!r.passed) {
      console.log(`   Error: ${r.error}`);
    }
  }
  
  // Determine overall success: require at least 80% pass rate
  const overallSuccess = successRate >= 80.0;
  
  if (overallSuccess) {
    console.log('\n🎉 Smoke tests passed (meets 80% threshold)!');
  } else {
    console.log('\n⚠️ Smoke tests failed (below 80% threshold).');
  }
  
  return overallSuccess;
}

if (require.main === module) {
  runSmokeTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

module.exports = { runSmokeTest };