/**
 * Smoke test for Playwright integration
 */

const { DomToMarkdownConverter } = require('../src/converter');

async function runSmokeTest() {
  console.log('🧪 Playwright Smoke Test\n');
  
  // Test 1: Static page with Playwright (should work)
  console.log('1. Testing static page (example.com) with Playwright...');
  const converter1 = new DomToMarkdownConverter({
    usePlaywright: true,
    useWebFetch: false,
    useOpenClawBrowser: false,
    saveToFile: false,
    debug: false
  });
  
  try {
    const result1 = await converter1.convertUrlToMarkdown('https://example.com');
    console.log(`   ✅ Success: ${result1.markdown.length} characters`);
    console.log(`   Method used: ${result1.metadata.method}`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return false;
  }
  
  // Test 2: SPA page (React) with Playwright
  console.log('\n2. Testing SPA (react.dev) with Playwright...');
  const converter2 = new DomToMarkdownConverter({
    usePlaywright: true,
    useWebFetch: false,
    useOpenClawBrowser: false,
    saveToFile: false,
    debug: false,
    playwrightTimeout: 45000
  });
  
  try {
    const result2 = await converter2.convertUrlToMarkdown('https://react.dev');
    console.log(`   ✅ Success: ${result2.markdown.length} characters`);
    console.log(`   Method used: ${result2.metadata.method}`);
    if (result2.markdown.length > 1000) {
      console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
    } else {
      console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return false;
  }
  
  // Test 3: Fallback when Playwright not available (simulate by disabling)
  console.log('\n3. Testing fallback (Playwright disabled, web_fetch enabled)...');
  const converter3 = new DomToMarkdownConverter({
    usePlaywright: false,
    useWebFetch: true,
    useOpenClawBrowser: false,
    saveToFile: false,
    debug: false
  });
  
  try {
    const result3 = await converter3.convertUrlToMarkdown('https://example.com');
    console.log(`   ✅ Success: ${result3.markdown.length} characters`);
    console.log(`   Method used: ${result3.metadata.method}`);
    if (result3.metadata.method === 'web_fetch') {
      console.log(`   ✅ Correctly used web_fetch as fallback`);
    } else {
      console.log(`   ⚠️ Used ${result3.metadata.method} instead of web_fetch`);
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return false;
  }
  
  console.log('\n🎉 All smoke tests passed!');
  return true;
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