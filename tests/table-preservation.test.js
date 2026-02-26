/**
 * Unit tests for table preservation functionality
 * 
 * Tests table conversion with colspan, rowspan, alignment, and complex structures.
 */

const { DomToMarkdownConverter } = require('../src/converter');
const fs = require('fs');
const path = require('path');

async function runTablePreservationTests() {
  console.log('🧪 Table Preservation - Unit Tests\n');
  
  const testResults = [];
  
  // Helper to add test result
  function recordTest(name, passed, details = '') {
    testResults.push({ name, passed, details });
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name} ${details ? `(${details})` : ''}`);
  }
  
  // Create converter with debug off
  const converter = new DomToMarkdownConverter({
    debug: false,
    saveToFile: false
  });
  
  // --------------------------------------------------------------------
  // 1. Basic table structure
  // --------------------------------------------------------------------
  console.log('\n1. Basic table structure');
  try {
    const html = `
<table>
  <tr>
    <th>Header 1</th>
    <th>Header 2</th>
  </tr>
  <tr>
    <td>Cell 1.1</td>
    <td>Cell 1.2</td>
  </tr>
  <tr>
    <td>Cell 2.1</td>
    <td>Cell 2.2</td>
  </tr>
</table>`;
    const markdown = converter.convertHtmlToMarkdown(html);
    
    // Should have header separator row
    const hasSeparator = markdown.includes('---');
    const hasPipeCount = (markdown.match(/\|/g) || []).length >= 8; // At least 8 pipes for 2 columns x 3 rows
    const hasHeader = markdown.includes('Header 1') && markdown.includes('Header 2');
    
    const passed = hasSeparator && hasPipeCount && hasHeader;
    recordTest('Basic table conversion', passed, 
      passed ? `${markdown.split('\n').length} lines` : `Missing separator or pipes`);
    
    if (!passed) {
      console.log('Markdown output:', markdown);
    }
  } catch (error) {
    recordTest('Basic table conversion', false, `Error: ${error.message}`);
  }
  
  // --------------------------------------------------------------------
  // 2. Table with colspan
  // --------------------------------------------------------------------
  console.log('\n2. Table with colspan');
  try {
    const html = `
<table>
  <tr>
    <th colspan="2">Wide Header</th>
  </tr>
  <tr>
    <td>Cell A</td>
    <td>Cell B</td>
  </tr>
</table>`;
    const markdown = converter.convertHtmlToMarkdown(html);
    
    // Should have only 2 columns in separator
    const lines = markdown.trim().split('\n');
    const separatorLine = lines.find(l => l.includes('---'));
    const separatorCols = separatorLine ? (separatorLine.match(/\|/g) || []).length - 1 : 0;
    
    const passed = separatorCols === 2;
    recordTest('Colspan handling', passed, 
      passed ? `Columns: ${separatorCols}` : `Expected 2 columns, got ${separatorCols}`);
    
    if (!passed) {
      console.log('Markdown output:', markdown);
    }
  } catch (error) {
    recordTest('Colspan handling', false, `Error: ${error.message}`);
  }
  
  // --------------------------------------------------------------------
  // 3. Table with rowspan
  // --------------------------------------------------------------------
  console.log('\n3. Table with rowspan');
  try {
    const html = `
<table>
  <tr>
    <td rowspan="2">Spanned</td>
    <td>Cell 1</td>
  </tr>
  <tr>
    <td>Cell 2</td>
  </tr>
</table>`;
    const markdown = converter.convertHtmlToMarkdown(html);
    
    // Should have 2 rows, first column merged
    const lines = markdown.trim().split('\n').filter(l => l.trim().startsWith('|'));
    const rowCount = lines.length;
    const expectedRows = 3; // header row + 2 data rows
    const passed = rowCount === expectedRows;
    
    recordTest('Rowspan handling', passed, 
      passed ? `Rows: ${rowCount}` : `Expected ${expectedRows} rows, got ${rowCount}`);
    
    if (!passed) {
      console.log('Markdown output:', markdown);
      console.log('Lines:', lines);
    }
  } catch (error) {
    recordTest('Rowspan handling', false, `Error: ${error.message}`);
  }
  
  // --------------------------------------------------------------------
  // 4. Table with alignment (left, center, right)
  // --------------------------------------------------------------------
  console.log('\n4. Table alignment');
  try {
    const html = `
<table>
  <tr>
    <th align="left">Left</th>
    <th align="center">Center</th>
    <th align="right">Right</th>
  </tr>
  <tr>
    <td align="left">L</td>
    <td align="center">C</td>
    <td align="right">R</td>
  </tr>
</table>`;
    const markdown = converter.convertHtmlToMarkdown(html);
    
    // Check separator line for alignment markers
    const lines = markdown.trim().split('\n');
    const separatorLine = lines.find(l => l.includes('---'));
    const hasLeftAlign = separatorLine.includes(':---');
    const hasCenterAlign = separatorLine.includes(':---:');
    const hasRightAlign = separatorLine.includes('---:');
    
    const passed = hasLeftAlign && hasCenterAlign && hasRightAlign;
    recordTest('Alignment handling', passed, 
      passed ? 'All alignments present' : 
      `Left:${hasLeftAlign} Center:${hasCenterAlign} Right:${hasRightAlign}`);
    
    if (!passed) {
      console.log('Markdown output:', markdown);
      console.log('Separator line:', separatorLine);
    }
  } catch (error) {
    recordTest('Alignment handling', false, `Error: ${error.message}`);
  }
  
  // --------------------------------------------------------------------
  // 5. Complex table with mixed colspan/rowspan
  // --------------------------------------------------------------------
  console.log('\n5. Complex table');
  try {
    const html = `
<table>
  <tr>
    <th colspan="2">Header A</th>
    <th rowspan="2">Header B</th>
  </tr>
  <tr>
    <td>Cell 1</td>
    <td>Cell 2</td>
  </tr>
</table>`;
    const markdown = converter.convertHtmlToMarkdown(html);
    
    // Should produce a valid markdown table (no parse errors)
    const lines = markdown.trim().split('\n').filter(l => l.trim().startsWith('|'));
    const hasValidStructure = lines.length >= 2;
    
    // Count columns in separator
    const separatorLine = lines.find(l => l.includes('---'));
    const colCount = separatorLine ? (separatorLine.match(/\|/g) || []).length - 1 : 0;
    const expectedCols = 3; // colspan=2 + rowspan=1 = 3 columns total
    
    const passed = hasValidStructure && colCount === expectedCols;
    recordTest('Mixed colspan/rowspan', passed, 
      passed ? `${colCount} columns` : `Expected ${expectedCols} columns, got ${colCount}`);
    
    if (!passed) {
      console.log('Markdown output:', markdown);
    }
  } catch (error) {
    recordTest('Mixed colspan/rowspan', false, `Error: ${error.message}`);
  }
  
  // --------------------------------------------------------------------
  // 6. Table with escaped pipe characters
  // --------------------------------------------------------------------
  console.log('\n6. Escaped pipe characters');
  try {
    const html = `
<table>
  <tr>
    <td>Cell with | pipe</td>
    <td>Another | pipe | here</td>
  </tr>
</table>`;
    const markdown = converter.convertHtmlToMarkdown(html);
    
    // Pipes inside cell should be escaped with backslash
    const hasEscapedPipe = markdown.includes('\\|');
    const passed = hasEscapedPipe;
    
    recordTest('Pipe escaping', passed, 
      passed ? 'Pipes escaped' : 'Pipes not escaped');
    
    if (!passed) {
      console.log('Markdown output:', markdown);
    }
  } catch (error) {
    recordTest('Pipe escaping', false, `Error: ${error.message}`);
  }
  
  // --------------------------------------------------------------------
  // 7. Table with alignment propagation (colspan alignment)
  // --------------------------------------------------------------------
  console.log('\n7. Alignment propagation');
  try {
    const html = `
<table>
  <tr>
    <td colspan="2" align="center">Centered wide cell</td>
  </tr>
  <tr>
    <td align="left">Left</td>
    <td align="right">Right</td>
  </tr>
</table>`;
    const markdown = converter.convertHtmlToMarkdown(html);
    
    // Check separator line for alignment markers
    const lines = markdown.trim().split('\n');
    const separatorLine = lines.find(l => l.includes('---'));
    // Should have :---: for first column (colspan=2) and left/right for others?
    // Actually the first column is colspan=2, so separator should have two columns with center alignment
    const separatorParts = separatorLine.split('|').filter(p => p.trim().length > 0);
    const firstSeparator = separatorParts[0] ? separatorParts[0].trim() : '';
    const secondSeparator = separatorParts[1] ? separatorParts[1].trim() : '';
    
    // Both columns should be centered because the colspan cell is centered
    const firstCentered = firstSeparator === ':---:';
    const secondCentered = secondSeparator === ':---:';
    
    const passed = firstCentered && secondCentered;
    recordTest('Alignment propagation', passed, 
      passed ? 'Centered across columns' : 
      `First: ${firstSeparator}, Second: ${secondSeparator}`);
    
    if (!passed) {
      console.log('Markdown output:', markdown);
      console.log('Separator parts:', separatorParts);
    }
  } catch (error) {
    recordTest('Alignment propagation', false, `Error: ${error.message}`);
  }
  
  // --------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------
  console.log('\n' + '='.repeat(60));
  console.log('📊 TABLE TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passedTests = testResults.filter(t => t.passed).length;
  const totalTests = testResults.length;
  const successRate = (passedTests / totalTests) * 100;
  
  console.log(`\nTotal tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success rate: ${successRate.toFixed(1)}%\n`);
  
  // Save test report
  const reportDir = path.join(__dirname, '..', 'test-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportPath = path.join(reportDir, `table-preservation-test-${Date.now()}.json`);
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
  runTablePreservationTests()
    .then(result => {
      console.log('\n' + '='.repeat(60));
      console.log(result.success ? '✅ ALL TABLE TESTS PASSED' : '⚠️ SOME TABLE TESTS FAILED');
      console.log('='.repeat(60));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Table test runner error:', error);
      process.exit(1);
    });
}

module.exports = { runTablePreservationTests };