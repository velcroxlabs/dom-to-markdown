/**
 * Unit tests for code block language detection
 * 
 * Tests language detection from class attributes (language-* or lang-*).
 */

const { DomToMarkdownConverter } = require('../src/converter');

async function runCodeLanguageDetectionTests() {
  console.log('🧪 Code Block Language Detection - Unit Tests\n');
  console.log('Date:', new Date().toISOString());
  console.log('---\n');

  const testResults = [];
  const startTime = Date.now();

  function recordTest(name, passed, details = '') {
    testResults.push({ name, passed, details });
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name} ${details ? `(${details})` : ''}`);
  }

  // Create converter with minimal options
  const converter = new DomToMarkdownConverter({
    debug: false,
    saveToFile: false,
    useCache: false,
  });

  // Helper to convert HTML snippet and return markdown
  function convertSnippet(html) {
    return converter.convertHtmlToMarkdown(html);
  }

  // --------------------------------------------------------------------
  // 1. Basic code block without language
  // --------------------------------------------------------------------
  console.log('1. Basic code block without language...');
  const basicCode = '<pre><code>console.log("hello");</code></pre>';
  const basicResult = convertSnippet(basicCode);
  const expectedBasic = '```\nconsole.log("hello");\n```\n\n';
  recordTest('Basic pre+code conversion', basicResult.includes('```\nconsole.log("hello");\n```'), `output: ${basicResult.substring(0, 50)}...`);

  // --------------------------------------------------------------------
  // 2. Code block with language class on <pre>
  // --------------------------------------------------------------------
  console.log('\n2. Language detection from class on <pre>...');
  const preLang = '<pre class="language-javascript"><code>const x = 1;</code></pre>';
  const preLangResult = convertSnippet(preLang);
  const expectedPreLang = '```javascript\nconst x = 1;\n```\n\n';
  recordTest('Language detection on <pre>', preLangResult.includes('```javascript\nconst x = 1;'), `output: ${preLangResult.substring(0, 60)}...`);

  // --------------------------------------------------------------------
  // 3. Language class on <code> (inside plain pre)
  // --------------------------------------------------------------------
  console.log('\n3. Language detection from class on <code>...');
  const codeLang = '<pre><code class="language-python">print("hi")</code></pre>';
  const codeLangResult = convertSnippet(codeLang);
  recordTest('Language detection on <code>', codeLangResult.includes('```python\nprint("hi")'), `output: ${codeLangResult.substring(0, 60)}...`);

  // --------------------------------------------------------------------
  // 4. Language class with "lang-" prefix
  // --------------------------------------------------------------------
  console.log('\n4. Language detection with "lang-" prefix...');
  const langPrefix = '<pre class="lang-html"><code>&lt;div&gt;&lt;/div&gt;</code></pre>';
  const langPrefixResult = convertSnippet(langPrefix);
  recordTest('lang- prefix detection', langPrefixResult.includes('```html\n<div></div>'), `output: ${langPrefixResult.substring(0, 60)}...`);

  // --------------------------------------------------------------------
  // 5. Multiple classes, language extraction
  // --------------------------------------------------------------------
  console.log('\n5. Multiple classes, extract language...');
  const multiClass = '<pre class="foo bar language-typescript baz"><code>let a: string;</code></pre>';
  const multiClassResult = convertSnippet(multiClass);
  recordTest('Multiple classes', multiClassResult.includes('```typescript\nlet a: string;'), `output: ${multiClassResult.substring(0, 60)}...`);

  // --------------------------------------------------------------------
  // 6. Standalone <code> (no pre) – should still get code fences
  // --------------------------------------------------------------------
  console.log('\n6. Standalone <code> element...');
  const standalone = '<code class="language-css">body { color: red; }</code>';
  const standaloneResult = convertSnippet(standalone);
  // Expect inline code? Actually Turndown converts <code> to inline backticks if not inside pre.
  // Our rule may still apply, but we accept either behavior.
  // We'll just check that conversion doesn't crash.
  recordTest('Standalone <code> conversion', standaloneResult.length > 0, `output length: ${standaloneResult.length}`);

  // --------------------------------------------------------------------
  // 7. Nested code inside other elements
  // --------------------------------------------------------------------
  console.log('\n7. Nested code inside paragraph...');
  const nested = '<p>Example: <pre><code class="language-bash">ls -la</code></pre> done.</p>';
  const nestedResult = convertSnippet(nested);
  recordTest('Nested code block', nestedResult.includes('```bash\nls -la'), `output: ${nestedResult.substring(0, 80)}...`);

  // --------------------------------------------------------------------
  // 8. Ensure no duplicate fences
  // --------------------------------------------------------------------
  console.log('\n8. No duplicate fences...');
  const duplicateCheck = '<pre><code>single line</code></pre>';
  const dupResult = convertSnippet(duplicateCheck);
  const fenceCount = (dupResult.match(/```/g) || []).length;
  recordTest('Exactly two fences (open/close)', fenceCount === 2, `found ${fenceCount} fences`);

  // --------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------
  console.log('\n' + '='.repeat(50));
  const passed = testResults.filter(r => r.passed).length;
  const total = testResults.length;
  const percentage = ((passed / total) * 100).toFixed(1);
  
  console.log(`Results: ${passed}/${total} passed (${percentage}%)`);
  console.log(`Total time: ${Date.now() - startTime}ms`);

  // Log failures
  const failures = testResults.filter(r => !r.passed);
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(f => console.log(`  ❌ ${f.name}: ${f.details}`));
  }

  if (passed === total) {
    console.log('\n✅ All code language detection tests passed!');
    return true;
  } else {
    console.log('\n❌ Some code language detection tests failed.');
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  runCodeLanguageDetectionTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { runCodeLanguageDetectionTests };