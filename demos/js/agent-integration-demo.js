/**
 * Agent Integration Demo for dom-to-markdown skill
 * 
 * This is a conceptual demonstration of how the skill would be used
 * inside an OpenClaw agent. The actual implementation would be
 * integrated into the agent's tool usage.
 * 
 * In reality, an OpenClaw agent would:
 * 1. Load the skill module
 * 2. Use the browser tool directly (available in agent context)
 * 3. Process the results
 */

// Simulated agent context (in reality, this would be the actual agent)
class SimulatedAgent {
  constructor() {
    // In real OpenClaw, 'browser' is a global function available to agents
    this.browserTool = null;
    this.skillLoaded = false;
  }
  
  // Simulate loading the skill
  async loadSkill() {
    console.log('📦 Loading dom-to-markdown skill...');
    
    // In real OpenClaw, this would be:
    // const skill = require('/home/jarvis/.openclaw/workspace/skills/dom-to-markdown');
    
    // For demo, we'll simulate the skill's functionality
    this.skillLoaded = true;
    console.log('✅ Skill loaded');
  }
  
  // Simulate browser tool usage
  async useBrowserTool(url) {
    console.log(`🌐 Using browser tool for: ${url}`);
    
    // In real OpenClaw, this would be:
    // const result = await browser({ action: 'navigate', profile: 'openclaw', targetUrl: url });
    // const html = await browser({ action: 'act', profile: 'openclaw', request: { kind: 'evaluate', fn: '() => document.documentElement.outerHTML' } });
    
    // For demo, return simulated data
    return {
      success: true,
      html: `<html><body><h1>Simulated page: ${url}</h1><p>This is simulated content extracted by OpenClaw browser tool.</p></body></html>`,
      metadata: {
        extractionMethod: 'openclaw-browser',
        durationMs: 1500,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  // Convert URL to markdown using the skill pattern
  async convertUrlToMarkdown(url) {
    if (!this.skillLoaded) {
      await this.loadSkill();
    }
    
    console.log(`\n🔗 Converting: ${url}`);
    
    // Step 1: Use browser tool to extract content
    const browserResult = await this.useBrowserTool(url);
    
    if (!browserResult.success) {
      return {
        success: false,
        url,
        error: 'Browser extraction failed',
        metadata: browserResult.metadata
      };
    }
    
    // Step 2: Convert HTML to markdown (simulated skill logic)
    const html = browserResult.html;
    const markdown = this.htmlToMarkdown(html);
    
    // Step 3: Save result (simulated)
    const outputPath = this.saveResult(url, markdown);
    
    return {
      success: true,
      url,
      markdown,
      metadata: {
        ...browserResult.metadata,
        outputPath,
        markdownLength: markdown.length,
        htmlLength: html.length,
        compressionRatio: ((html.length - markdown.length) / html.length * 100).toFixed(1) + '%'
      }
    };
  }
  
  // Simulated HTML to markdown conversion
  htmlToMarkdown(html) {
    // Simplified conversion for demo
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<[^>]*>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  
  // Simulated save function
  saveResult(url, markdown) {
    const domain = new URL(url).hostname;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${domain}-${timestamp}.md`;
    const path = `/tmp/${filename}`;
    
    console.log(`💾 Saved to: ${path}`);
    return path;
  }
  
  // Run demo
  async runDemo() {
    console.log('🚀 DOM → Markdown Agent Integration Demo');
    console.log('========================================\n');
    
    const testUrls = [
      'https://openclaw.ai/',
      'https://diariolibre.com/',
      'https://example.com/'
    ];
    
    const results = [];
    
    for (const url of testUrls) {
      const result = await this.convertUrlToMarkdown(url);
      results.push(result);
      
      if (result.success) {
        console.log(`✅ Success: ${result.markdown.length} chars`);
        console.log(`   Compression: ${result.metadata.compressionRatio}`);
        console.log(`   Method: ${result.metadata.extractionMethod}\n`);
      } else {
        console.log(`❌ Failed: ${result.error}\n`);
      }
    }
    
    // Summary
    console.log('\n📊 DEMO SUMMARY');
    console.log('===============');
    
    const successful = results.filter(r => r.success).length;
    console.log(`✅ Successful: ${successful}/${testUrls.length}`);
    
    console.log('\n🎉 Integration pattern verified!');
    console.log('\n📝 REAL USAGE IN OPENCLAW AGENT:');
    console.log('--------------------------------');
    console.log('1. Agent loads the skill module:');
    console.log('   const skill = require("./skills/dom-to-markdown");');
    console.log('');
    console.log('2. Agent uses browser tool (available globally):');
    console.log('   const html = await browser({ action: "navigate", ... });');
    console.log('');
    console.log('3. Agent converts HTML to markdown using skill:');
    console.log('   const result = await skill.convertUrlToMarkdown(url);');
    console.log('');
    console.log('4. Agent processes/saves the markdown result.');
  }
}

// Run the demo
const agent = new SimulatedAgent();
agent.runDemo().catch(console.error);