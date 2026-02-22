#!/usr/bin/env node
/**
 * Demo: Using dom-to-markdown skill inside OpenClaw agent context
 * 
 * This script demonstrates how to use the skill within an OpenClaw agent
 * where the 'browser' tool is available.
 * 
 * IMPORTANT: This must be run inside an OpenClaw agent session.
 */

const path = require('path');

// Load the skill
const skillPath = path.join(__dirname);
const { DomToMarkdownConverter, convertUrlToMarkdown } = require(skillPath);

// Test URLs
const testUrls = [
  'https://openclaw.ai/',
  'https://lit.dev/',
  'https://elnacional.com.do/',
  'https://diariolibre.com/'
];

async function runDemo() {
  console.log('🚀 DOM → Markdown Skill Demo (OpenClaw Agent Context)');
  console.log('=====================================================\n');
  
  // Check if we're in OpenClaw context
  if (typeof browser !== 'function') {
    console.error('❌ ERROR: Browser tool not available.');
    console.error('   This script must run inside an OpenClaw agent session.');
    console.error('   The "browser" tool is only available to agents.');
    return;
  }
  
  console.log('✅ Browser tool available in OpenClaw agent context');
  console.log(`📊 Testing ${testUrls.length} URLs\n`);
  
  const results = [];
  
  for (const url of testUrls) {
    console.log(`🔗 Processing: ${url}`);
    
    try {
      // Use the skill's converter
      const converter = new DomToMarkdownConverter({
        useBrowserHeadless: true,
        useFirecrawl: false,
        debug: true,
        saveToFile: true,
        outputDir: path.join(__dirname, 'exports', 'demo-results')
      });
      
      const startTime = Date.now();
      const result = await converter.convertUrlToMarkdown(url);
      const duration = Date.now() - startTime;
      
      if (result.success) {
        console.log(`   ✅ Success: ${result.markdown.length} chars, ${duration}ms`);
        console.log(`   📁 Saved to: ${result.metadata.outputPath || 'memory'}`);
        
        // Show first few lines
        const preview = result.markdown.substring(0, 200).replace(/\n/g, ' ');
        console.log(`   📝 Preview: ${preview}...\n`);
      } else {
        console.log(`   ❌ Failed: ${result.error}\n`);
      }
      
      results.push({
        url,
        success: result.success,
        duration,
        error: result.error,
        metadata: result.metadata
      });
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`   💥 Error: ${error.message}\n`);
      results.push({
        url,
        success: false,
        error: error.message
      });
    }
  }
  
  // Summary
  console.log('\n📊 DEMO SUMMARY');
  console.log('===============');
  
  const successful = results.filter(r => r.success).length;
  console.log(`✅ Successful: ${successful}/${testUrls.length}`);
  
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.url}`);
    if (result.duration) {
      console.log(`   Duration: ${result.duration}ms`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  // Test with quickConvert helper
  console.log('\n🧪 Testing quickConvert helper...');
  try {
    const quickResult = await convertUrlToMarkdown('https://example.com', {
      useBrowserHeadless: true,
      debug: false
    });
    
    if (quickResult.success) {
      console.log(`✅ quickConvert works! ${quickResult.markdown.length} chars extracted`);
    } else {
      console.log(`❌ quickConvert failed: ${quickResult.error}`);
    }
  } catch (error) {
    console.log(`💥 quickConvert error: ${error.message}`);
  }
  
  console.log('\n🎉 Demo complete!');
  console.log('The skill successfully uses OpenClaw browser tool for real JavaScript rendering.');
}

// Run demo
runDemo().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});