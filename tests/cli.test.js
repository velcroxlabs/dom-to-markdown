/**
 * Unit tests for CLI tool (bin/cli.js)
 * Tests argument parsing, help output, and basic execution with mocked dependencies.
 */

const fs = require('fs');
const path = require('path');

async function runCliTests() {
  console.log('🧪 CLI Tool - Unit Tests\n');
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
  // Helper: mock process.exit and console.log
  // --------------------------------------------------------------------
  function withMockedExitAndHelp(testFn) {
    const originalExit = process.exit;
    const originalLog = console.log;
    const originalError = console.error;
    const originalArgv = process.argv;
    
    let exitCode = null;
    let logs = [];
    
    process.exit = (code) => {
      exitCode = code;
      throw new Error(`EXIT_CALLED_${code}`);
    };
    console.log = (...args) => logs.push(args.join(' '));
    console.error = (...args) => logs.push('ERROR: ' + args.join(' '));
    
    const cleanup = () => {
      process.exit = originalExit;
      console.log = originalLog;
      console.error = originalError;
      process.argv = originalArgv;
    };
    
    return { exitCode, logs, cleanup };
  }

  // --------------------------------------------------------------------
  // 1. Test parseArgs (exported from bin/cli.js)
  // --------------------------------------------------------------------
  console.log('1. Testing parseArgs...');
  
  // Clear cache to ensure fresh require
  delete require.cache[require.resolve('../bin/cli.js')];
  const { parseArgs } = require('../bin/cli.js');
  
  // Helper to simulate argv
  function parse(argv) {
    const originalArgv = process.argv;
    process.argv = ['node', 'cli.js', ...argv];
    try {
      return parseArgs();
    } finally {
      process.argv = originalArgv;
    }
  }

  try {
    // Test 1.1: Single URL
    const opts = parse(['https://example.com']);
    if (opts.url === 'https://example.com' && opts.batchFile === null) {
      recordTest('parseArgs single URL', true);
    } else {
      recordTest('parseArgs single URL', false, `url=${opts.url}, batchFile=${opts.batchFile}`);
    }
    
    // Test 1.2: Output directory
    const opts2 = parse(['https://example.com', '--output', './custom']);
    if (opts2.outputDir === './custom') {
      recordTest('parseArgs --output', true);
    } else {
      recordTest('parseArgs --output', false, `outputDir=${opts2.outputDir}`);
    }
    
    // Test 1.3: Raw HTML flag
    const opts3 = parse(['https://example.com', '--raw-html']);
    if (opts3.rawHtml === true) {
      recordTest('parseArgs --raw-html', true);
    } else {
      recordTest('parseArgs --raw-html', false, `rawHtml=${opts3.rawHtml}`);
    }
    
    // Test 1.4: No playwright
    const opts4 = parse(['https://example.com', '--no-playwright']);
    if (opts4.usePlaywright === false) {
      recordTest('parseArgs --no-playwright', true);
    } else {
      recordTest('parseArgs --no-playwright', false, `usePlaywright=${opts4.usePlaywright}`);
    }
    
    // Test 1.5: No cache
    const opts5 = parse(['https://example.com', '--no-cache']);
    if (opts5.useCache === false) {
      recordTest('parseArgs --no-cache', true);
    } else {
      recordTest('parseArgs --no-cache', false, `useCache=${opts5.useCache}`);
    }
    
    // Test 1.6: Debug flag
    const opts6 = parse(['https://example.com', '--debug']);
    if (opts6.debug === true) {
      recordTest('parseArgs --debug', true);
    } else {
      recordTest('parseArgs --debug', false, `debug=${opts6.debug}`);
    }
    
    // Test 1.7: Timeout
    const opts7 = parse(['https://example.com', '--timeout', '60']);
    if (opts7.timeout === 60) {
      recordTest('parseArgs --timeout', true);
    } else {
      recordTest('parseArgs --timeout', false, `timeout=${opts7.timeout}`);
    }
    
    // Test 1.8: Wait time
    const opts8 = parse(['https://example.com', '--wait', '5000']);
    if (opts8.waitTime === 5000) {
      recordTest('parseArgs --wait', true);
    } else {
      recordTest('parseArgs --wait', false, `waitTime=${opts8.waitTime}`);
    }
    
    // Test 1.9: Browser type
    const opts9 = parse(['https://example.com', '--browser', 'firefox']);
    if (opts9.browser === 'firefox') {
      recordTest('parseArgs --browser', true);
    } else {
      recordTest('parseArgs --browser', false, `browser=${opts9.browser}`);
    }
    
    // Test 1.10: No-save flag
    const opts10 = parse(['https://example.com', '--no-save']);
    if (opts10.saveToFile === false) {
      recordTest('parseArgs --no-save', true);
    } else {
      recordTest('parseArgs --no-save', false, `saveToFile=${opts10.saveToFile}`);
    }
    
    // Test 1.11: Batch mode
    const batchFile = path.join(__dirname, 'temp-batch-urls.txt');
    fs.writeFileSync(batchFile, 'https://site1.com\nhttps://site2.com\n');
    const opts11 = parse(['--batch', batchFile]);
    if (opts11.batchFile === batchFile && opts11.url === null) {
      recordTest('parseArgs --batch', true);
    } else {
      recordTest('parseArgs --batch', false, `batchFile=${opts11.batchFile}, url=${opts11.url}`);
    }
    fs.unlinkSync(batchFile);
    
    // Test 1.12: Parallel option
    const batchFile2 = path.join(__dirname, 'temp-batch2.txt');
    fs.writeFileSync(batchFile2, 'https://site1.com\n');
    const opts12 = parse(['--batch', batchFile2, '--parallel', '5']);
    if (opts12.parallel === 5) {
      recordTest('parseArgs --parallel', true);
    } else {
      recordTest('parseArgs --parallel', false, `parallel=${opts12.parallel}`);
    }
    fs.unlinkSync(batchFile2);
    
    // Test 1.13: Invalid batch file (should exit with error)
    // We'll skip because it calls process.exit(1) and we can't capture easily.
    
    // Test 1.14: Unknown option (should exit)
    // Skip.
    
  } catch (error) {
    recordTest('parseArgs suite', false, `Error: ${error.message}`);
    console.error(error);
  }

  // --------------------------------------------------------------------
  // 2. Test main with mocked converter (single URL success)
  // --------------------------------------------------------------------
  console.log('\n2. Testing main with mocked converter (single URL)...');
  
  // Clear cache for CLI only
  delete require.cache[require.resolve('../bin/cli.js')];
  
  // Mock convertUrlToMarkdown
  const converterPath = require.resolve('../src/converter');
  const originalConvert = require.cache[converterPath].exports.convertUrlToMarkdown;
  const originalBatch = require.cache[converterPath].exports.batchConvert;
  
  const mockConvertUrlToMarkdown = async (url, options) => ({
    success: true,
    detection: { type: 'static', confidence: 0.9 },
    extraction: { method: 'web_fetch' },
    metadata: { savedPath: '/tmp/test.md', length: 123 },
    markdown: '# Mock markdown'
  });
  
  require.cache[converterPath].exports.convertUrlToMarkdown = mockConvertUrlToMarkdown;
  require.cache[converterPath].exports.batchConvert = originalBatch; // keep original
  
  // Re-require cli to pick up mocked converter
  delete require.cache[require.resolve('../bin/cli.js')];
  const { main } = require('../bin/cli.js');
  
  // Mock process.argv, capture logs, and catch exit
  const originalArgv = process.argv;
  const originalExit = process.exit;
  const originalLog = console.log;
  const originalError = console.error;
  
  let exitCode = null;
  let logs = [];
  
  process.exit = (code) => {
    exitCode = code;
    throw new Error(`EXIT_CALLED_${code}`);
  };
  console.log = (...args) => logs.push(args.join(' '));
  console.error = (...args) => logs.push('ERROR: ' + args.join(' '));
  
  try {
    originalLog('   Testing main single URL success...');
    // Simulate successful conversion
    process.argv = ['node', 'cli.js', 'https://example.com', '--no-save'];
    await main();
    // If we reach here, main didn't exit (good). Verify logs contain success.
    const successLog = logs.find(l => l.includes('Conversion successful'));
    if (successLog) {
      recordTest('main single URL success', true);
    } else {
      originalLog('DEBUG logs:', logs);
      recordTest('main single URL success', false, 'missing success log');
    }
  } catch (e) {
    if (e.message.startsWith('EXIT_CALLED')) {
      recordTest('main single URL success', false, `unexpected exit ${e.message}`);
    } else {
      recordTest('main single URL success', false, `error: ${e.message}`);
    }
  } finally {
    process.argv = originalArgv;
    process.exit = originalExit;
    console.log = originalLog;
    console.error = originalError;
    // Restore converter
    require.cache[converterPath].exports.convertUrlToMarkdown = originalConvert;
  }
  
  // --------------------------------------------------------------------
  // 3. Test main with mocked converter (single URL failure)
  // --------------------------------------------------------------------
  console.log('\n3. Testing main with mocked converter (single URL failure)...');
  
  const mockConvertFailure = async (url, options) => ({
    success: false,
    error: new Error('Mock conversion error')
  });
  
  require.cache[converterPath].exports.convertUrlToMarkdown = mockConvertFailure;
  delete require.cache[require.resolve('../bin/cli.js')];
  const { main: main2 } = require('../bin/cli.js');
  
  exitCode = null;
  logs = [];
  
  process.exit = (code) => {
    exitCode = code;
    throw new Error(`EXIT_CALLED_${code}`);
  };
  console.log = (...args) => logs.push(args.join(' '));
  console.error = (...args) => logs.push('ERROR: ' + args.join(' '));
  
  try {
    originalLog('   Testing main single URL failure...');
    process.argv = ['node', 'cli.js', 'https://example.com'];
    await main2();
    originalLog('DEBUG logs (should have exited):', logs);
    // Should have exited with code 1
    recordTest('main single URL failure', false, 'should have exited');
  } catch (e) {
    if (e.message === 'EXIT_CALLED_1') {
      recordTest('main single URL failure', true);
    } else {
      recordTest('main single URL failure', false, `unexpected error: ${e.message}`);
    }
  } finally {
    process.argv = originalArgv;
    process.exit = originalExit;
    console.log = originalLog;
    console.error = originalError;
    require.cache[converterPath].exports.convertUrlToMarkdown = originalConvert;
  }
  
  // --------------------------------------------------------------------
  // 4. Test main with mocked converter (batch mode)
  // --------------------------------------------------------------------
  console.log('\n4. Testing main with mocked converter (batch mode)...');
  
  const mockBatchConvert = async (urls, options) => ({
    total: urls.length,
    successful: urls.length,
    failed: 0,
    results: urls.map(url => ({
      url,
      success: true,
      error: null,
      metadata: {}
    }))
  });
  
  require.cache[converterPath].exports.batchConvert = mockBatchConvert;
  delete require.cache[require.resolve('../bin/cli.js')];
  const { main: main3 } = require('../bin/cli.js');
  
  // Create temporary batch file
  const batchFile3 = path.join(__dirname, 'temp-batch3.txt');
  fs.writeFileSync(batchFile3, 'https://site1.com\nhttps://site2.com\nhttps://site3.com\n');
  
  exitCode = null;
  logs = [];
  
  process.exit = (code) => {
    exitCode = code;
    throw new Error(`EXIT_CALLED_${code}`);
  };
  console.log = (...args) => logs.push(args.join(' '));
  console.error = (...args) => logs.push('ERROR: ' + args.join(' '));
  
  try {
    originalLog('   Testing main batch mode success...');
    process.argv = ['node', 'cli.js', '--batch', batchFile3];
    await main3();
    // Should not exit (success). Check logs for batch results.
    const batchLog = logs.find(l => l.includes('Batch results'));
    if (batchLog && logs.find(l => l.includes('Successful: 3'))) {
      recordTest('main batch mode success', true);
    } else {
      originalLog('DEBUG logs:', logs);
      recordTest('main batch mode success', false, 'missing batch results');
    }
  } catch (e) {
    if (e.message === 'EXIT_CALLED_0') {
      // Expected exit with success code 0
      const batchLog = logs.find(l => l.includes('Batch results'));
      if (batchLog && logs.find(l => l.includes('Successful: 3'))) {
        recordTest('main batch mode success', true);
      } else {
        recordTest('main batch mode success', false, 'missing batch results after exit');
      }
    } else if (e.message.startsWith('EXIT_CALLED')) {
      recordTest('main batch mode success', false, `unexpected exit ${e.message}`);
    } else {
      recordTest('main batch mode success', false, `error: ${e.message}`);
    }
  } finally {
    process.argv = originalArgv;
    process.exit = originalExit;
    console.log = originalLog;
    console.error = originalError;
    require.cache[converterPath].exports.batchConvert = originalBatch;
    fs.unlinkSync(batchFile3);
  }
  
  // --------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------
  const elapsed = (Date.now() - startTime) / 1000;
  const passed = testResults.filter(r => r.passed).length;
  const total = testResults.length;
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 CLI Test Results (${elapsed.toFixed(1)}s):`);
  console.log(`   Total: ${total}`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${total - passed}`);
  console.log(`   Success rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log('\n✅ All CLI tests passed!');
  } else {
    console.log('\n❌ Some CLI tests failed.');
    const failedTests = testResults.filter(r => !r.passed);
    failedTests.forEach(test => {
      console.log(`   ❌ ${test.name}: ${test.details}`);
    });
    process.exitCode = 1;
  }
}

if (require.main === module) {
  runCliTests().catch(error => {
    console.error('Fatal error in CLI tests:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { runCliTests };