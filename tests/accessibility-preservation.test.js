/**
 * Unit tests for accessibility preservation functionality
 * 
 * Tests ARIA label, aria-labelledby, aria-describedby, role attributes
 * and alt text preservation.
 */

const { DomToMarkdownConverter } = require('../src/converter');
const fs = require('fs');
const path = require('path');

async function runAccessibilityPreservationTests() {
  console.log('🧪 Accessibility Preservation - Unit Tests\n');
  
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
  // 1. ARIA label on button
  // --------------------------------------------------------------------
  console.log('\n1. ARIA label on button');
  try {
    const html = `<button aria-label="Close dialog">X</button>`;
    const markdown = converter.convertHtmlToMarkdown(html);
    const hasComment = markdown.includes('aria-label="Close dialog"');
    const hasButtonText = markdown.includes('X');
    recordTest('Button with aria-label', hasComment && hasButtonText, 
      `Comment present: ${hasComment}, Text present: ${hasButtonText}`);
  } catch (error) {
    recordTest('Button with aria-label', false, `Error: ${error.message}`);
  }
  
  // --------------------------------------------------------------------
  // 2. ARIA labelledby and role
  // --------------------------------------------------------------------
  console.log('\n2. ARIA labelledby and role');
  try {
    const html = `
      <div>
        <h1 id="title">Main Title</h1>
        <section aria-labelledby="title" role="region">
          <p>Content here</p>
        </section>
      </div>
    `;
    const markdown = converter.convertHtmlToMarkdown(html);
    const hasLabelledby = markdown.includes('aria-labelledby="title"');
    const hasRole = markdown.includes('role="region"');
    const hasContent = markdown.includes('Content here');
    recordTest('Section with aria-labelledby and role', 
      hasLabelledby && hasRole && hasContent,
      `labelledby: ${hasLabelledby}, role: ${hasRole}, content: ${hasContent}`);
  } catch (error) {
    recordTest('Section with aria-labelledby and role', false, `Error: ${error.message}`);
  }
  
  // --------------------------------------------------------------------
  // 3. ARIA describedby
  // --------------------------------------------------------------------
  console.log('\n3. ARIA describedby');
  try {
    const html = `
      <div>
        <p id="desc">Detailed description</p>
        <input type="text" aria-describedby="desc" />
      </div>
    `;
    const markdown = converter.convertHtmlToMarkdown(html);
    const hasDescribedby = markdown.includes('aria-describedby="desc"');
    recordTest('Input with aria-describedby', hasDescribedby, 
      `describedby present: ${hasDescribedby}`);
  } catch (error) {
    recordTest('Input with aria-describedby', false, `Error: ${error.message}`);
  }
  
  // --------------------------------------------------------------------
  // 4. Role attribute on non-semantic element
  // --------------------------------------------------------------------
  console.log('\n4. Role attribute');
  try {
    const html = `<div role="navigation">Links</div>`;
    const markdown = converter.convertHtmlToMarkdown(html);
    const hasRole = markdown.includes('role="navigation"');
    const hasContent = markdown.includes('Links');
    recordTest('Div with role navigation', hasRole && hasContent,
      `role present: ${hasRole}, content present: ${hasContent}`);
  } catch (error) {
    recordTest('Div with role navigation', false, `Error: ${error.message}`);
  }
  
  // --------------------------------------------------------------------
  // 5. Alt text preservation (already implemented)
  // --------------------------------------------------------------------
  console.log('\n5. Alt text preservation');
  try {
    const html = `<img src="test.jpg" alt="A beautiful landscape" title="Scenery">`;
    const markdown = converter.convertHtmlToMarkdown(html);
    const hasAlt = markdown.includes('A beautiful landscape');
    const hasTitle = markdown.includes('Scenery');
    const correctSyntax = markdown.startsWith('![');
    recordTest('Image alt and title', hasAlt && hasTitle && correctSyntax,
      `alt present: ${hasAlt}, title present: ${hasTitle}, syntax: ${correctSyntax}`);
  } catch (error) {
    recordTest('Image alt and title', false, `Error: ${error.message}`);
  }
  
  // --------------------------------------------------------------------
  // 6. Multiple accessibility attributes on same element
  // --------------------------------------------------------------------
  console.log('\n6. Multiple accessibility attributes');
  try {
    const html = `<nav aria-label="Main navigation" role="navigation">Menu</nav>`;
    const markdown = converter.convertHtmlToMarkdown(html);
    const hasLabel = markdown.includes('aria-label="Main navigation"');
    const hasRole = markdown.includes('role="navigation"');
    const hasMenu = markdown.includes('Menu');
    recordTest('Multiple attributes', hasLabel && hasRole && hasMenu,
      `label: ${hasLabel}, role: ${hasRole}, content: ${hasMenu}`);
  } catch (error) {
    recordTest('Multiple attributes', false, `Error: ${error.message}`);
  }
  
  // --------------------------------------------------------------------
  // 7. Block vs inline element handling (comment placement)
  // --------------------------------------------------------------------
  console.log('\n7. Block vs inline handling');
  try {
    // Block element
    const htmlBlock = `<div aria-label="Block">Content</div>`;
    const markdownBlock = converter.convertHtmlToMarkdown(htmlBlock);
    const blockHasComment = markdownBlock.includes('aria-label="Block"');
    const blockHasNewline = markdownBlock.includes('\n');
    // Inline element
    const htmlInline = `<span aria-label="Inline">Text</span>`;
    const markdownInline = converter.convertHtmlToMarkdown(htmlInline);
    const inlineHasComment = markdownInline.includes('aria-label="Inline"');
    const inlineNoExtraNewline = !markdownInline.startsWith('\n');
    
    recordTest('Block/inline comment placement', 
      blockHasComment && inlineHasComment,
      `block comment: ${blockHasComment}, inline comment: ${inlineHasComment}`);
  } catch (error) {
    recordTest('Block/inline comment placement', false, `Error: ${error.message}`);
  }
  
  // --------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------
  const total = testResults.length;
  const passed = testResults.filter(r => r.passed).length;
  const failed = total - passed;
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 SUMMARY: ${passed}/${total} passed (${failed} failed)`);
  console.log('='.repeat(60));
  
  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    testResults.filter(r => !r.passed).forEach(r => {
      console.log(`   ${r.name}: ${r.details}`);
    });
  }
  
  return { total, passed, failed, testResults };
}

// Run if called directly
if (require.main === module) {
  runAccessibilityPreservationTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

module.exports = { runAccessibilityPreservationTests };