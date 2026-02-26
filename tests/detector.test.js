/**
 * Unit tests for page type detector
 * 
 * Tests framework detection, confidence scoring, and page classification.
 */

const { PageTypeDetector } = require('../src/detector');

async function runDetectorTests() {
  console.log('🧪 Page Type Detector - Unit Tests\n');
  
  const testResults = [];
  
  // Helper to add test result
  function recordTest(name, passed, details = '') {
    testResults.push({ name, passed, details });
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name} ${details ? `(${details})` : ''}`);
  }
  
  // Create detector with debug on for visibility
  const detector = new PageTypeDetector({ debug: false });
  
  // --------------------------------------------------------------------
  // 1. Framework detection: Svelte
  
  console.log('1. Svelte framework detection');
  const svelteHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Svelte App</title>
      <script src="/svelte.js"></script>
    </head>
    <body>
      <div id="app" data-svelte="true"></div>
      <div class="svelte-abc123">Hello Svelte</div>
      <script>window.__SVELTE__ = {}</script>
    </body>
    </html>
  `;
  
  try {
    const frameworks = detector.detectFrameworks(svelteHtml);
    const svelteDetected = frameworks.svelte !== undefined;
    const svelteConfidence = svelteDetected ? frameworks.svelte.confidence : 0;
    
    recordTest('Svelte detection', svelteDetected, `confidence: ${svelteConfidence}`);
    
    if (svelteDetected) {
      // Check that confidence is reasonable (should be >0.5)
      const confidencePass = svelteConfidence > 0.5;
      recordTest('Svelte confidence score', confidencePass, `score=${svelteConfidence}`);
      
      // Verify matches include expected patterns
      const matches = frameworks.svelte.matches;
      const hasDataSvelte = matches.some(m => m.includes('data-svelte'));
      const hasClassPattern = matches.some(m => m.includes('class'));
      recordTest('Data-svelte pattern matched', hasDataSvelte);
      recordTest('Class pattern matched', hasClassPattern);
    }
  } catch (error) {
    recordTest('Svelte detection', false, `error: ${error.message}`);
  }
  
  // --------------------------------------------------------------------
  // 2. Framework detection: React (existing test for reference)
  
  console.log('\n2. React framework detection');
  const reactHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>React App</title>
      <script src="/react.js"></script>
    </head>
    <body>
      <div id="root" data-reactroot></div>
      <script>window.__NEXT_DATA__ = {}</script>
    </body>
    </html>
  `;
  
  try {
    const frameworks = detector.detectFrameworks(reactHtml);
    const reactDetected = frameworks.react !== undefined;
    const reactConfidence = reactDetected ? frameworks.react.confidence : 0;
    
    recordTest('React detection', reactDetected, `confidence: ${reactConfidence}`);
    
    if (reactDetected) {
      // Should also detect nextjs due to __NEXT_DATA__
      const nextDetected = frameworks.nextjs !== undefined;
      recordTest('Next.js detection from React HTML', nextDetected);
    }
  } catch (error) {
    recordTest('React detection', false, `error: ${error.message}`);
  }
  
  // --------------------------------------------------------------------
  // 3. Page classification (SPA vs static)
  
  console.log('\n3. Page classification');
  
  // SPA classification with Svelte
  try {
    const frameworks = detector.detectFrameworks(svelteHtml);
    const classification = detector.classifyPage(svelteHtml, frameworks);
    
    recordTest('Svelte page classification', classification.type === 'spa', `type: ${classification.type}`);
    recordTest('Svelte classification confidence', classification.confidence >= 0.5, `confidence: ${classification.confidence}`);
    recordTest('Svelte frameworks present', classification.frameworks.svelte !== undefined);
  } catch (error) {
    recordTest('Svelte classification', false, `error: ${error.message}`);
  }
  
  // Static page classification (no frameworks)
  const staticHtml = `
    <!DOCTYPE html>
    <html>
    <head><title>Static Page</title></head>
    <body>
      <h1>Static Content</h1>
      <p>This is a static page with no JavaScript frameworks.</p>
      <p>Multiple paragraphs.</p>
      <p>More content.</p>
    </body>
    </html>
  `;
  
  try {
    const frameworks = detector.detectFrameworks(staticHtml);
    const classification = detector.classifyPage(staticHtml, frameworks);
    
    recordTest('Static page classification', classification.type === 'static', `type: ${classification.type}`);
    recordTest('Static classification confidence', classification.confidence >= 0.5, `confidence: ${classification.confidence}`);
    recordTest('No frameworks detected', Object.keys(classification.frameworks).length === 0);
  } catch (error) {
    recordTest('Static classification', false, `error: ${error.message}`);
  }
  
  // --------------------------------------------------------------------
  // 4. Confidence scoring verification
  
  console.log('\n4. Confidence scoring verification');
  
  // Test that confidence scores are within [0,1]
  try {
    const testHtmls = [
      { name: 'Svelte', html: svelteHtml },
      { name: 'React', html: reactHtml },
      { name: 'Static', html: staticHtml }
    ];
    
    for (const { name, html } of testHtmls) {
      const frameworks = detector.detectFrameworks(html);
      const classification = detector.classifyPage(html, frameworks);
      
      const confidenceValid = classification.confidence >= 0 && classification.confidence <= 1;
      recordTest(`${name} confidence in [0,1]`, confidenceValid, `confidence=${classification.confidence}`);
      
      // Ensure each detected framework confidence is within [0,1]
      for (const [fw, info] of Object.entries(frameworks)) {
        const fwConfidenceValid = info.confidence >= 0 && info.confidence <= 1;
        recordTest(`${name} ${fw} confidence valid`, fwConfidenceValid, `confidence=${info.confidence}`);
      }
    }
  } catch (error) {
    recordTest('Confidence scoring', false, `error: ${error.message}`);
  }
  
  // --------------------------------------------------------------------
  // 5. Extraction method suggestion
  
  console.log('\n5. Extraction method suggestion');
  
  try {
    const frameworks = detector.detectFrameworks(svelteHtml);
    const classification = detector.classifyPage(svelteHtml, frameworks);
    const suggestion = detector.suggestExtractionMethod(classification);
    
    recordTest('Suggestion method present', suggestion.method !== undefined);
    recordTest('Suggestion reason present', suggestion.reason !== undefined);
    recordTest('Suggestion confidence matches', suggestion.confidence === classification.confidence);
    
    // For SPA, method should be playwright (if confidence high enough)
    if (classification.type === 'spa' && classification.confidence >= detector.options.minSpaConfidence) {
      recordTest('SPA suggests playwright', suggestion.method === 'playwright');
    }
  } catch (error) {
    recordTest('Extraction suggestion', false, `error: ${error.message}`);
  }
  
  // --------------------------------------------------------------------
  // Summary
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 DETECTOR TEST SUMMARY');
  console.log('='.repeat(60));
  
  const total = testResults.length;
  const passed = testResults.filter(r => r.passed).length;
  const failed = total - passed;
  
  console.log(`Total tests: ${total}`);
  console.log(`Passed: ${passed} (${Math.round(passed / total * 100)}%)`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed tests:');
    testResults.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.name}: ${r.details || 'No details'}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  return { total, passed, failed, testResults };
}

// Run if called directly
if (require.main === module) {
  runDetectorTests().then(({ failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { runDetectorTests };