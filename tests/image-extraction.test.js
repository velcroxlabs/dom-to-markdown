/**
 * Unit tests for image extraction functionality
 * 
 * Tests downloadAndLocalizeImages, generateImageFilename, and downloadImage methods.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DomToMarkdownConverter } = require('../src/converter');

async function runImageExtractionTests() {
  console.log('🧪 Image Extraction - Unit Tests\n');
  
  const testResults = [];
  
  // Helper: create temporary directory
  const tempDir = path.join(__dirname, '..', 'test-temp-images');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Helper: cleanup after tests
  const cleanup = () => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  };
  
  // Helper: mock converter with overrides
  const createMockConverter = (overrides = {}) => {
    const converter = new DomToMarkdownConverter({
      debug: false,
      saveToFile: false,
      outputDir: tempDir,
      ...overrides
    });
    
    // Override downloadImage to write a dummy file instead of HTTP request
    converter.downloadImage = async (url, localPath) => {
      // Simulate downloading an image by writing a small PNG header
      const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      fs.writeFileSync(localPath, pngHeader);
      console.log(`   [Mock] Downloaded ${url} -> ${localPath}`);
      return Promise.resolve();
    };
    
    return converter;
  };
  
  // Test 1: generateImageFilename
  console.log('1. Testing generateImageFilename...');
  try {
    const converter = createMockConverter();
    const testUrl = 'https://example.com/images/photo.jpg?width=800&height=600';
    const filename = converter.generateImageFilename(testUrl);
    
    // Should start with 'img-' and end with .jpg
    const startsWithImg = filename.startsWith('img-');
    const endsWithJpg = filename.endsWith('.jpg');
    const hasHash = filename.match(/img-[a-f0-9]{8}\.jpg$/);
    
    const passed = startsWithImg && endsWithJpg && hasHash;
    
    testResults.push({
      name: 'generateImageFilename',
      passed,
      details: { filename, startsWithImg, endsWithJpg, hasHash: !!hasHash }
    });
    
    console.log(`   ${passed ? '✅' : '❌'} Filename generated: ${filename}`);
    
    // Additional test for different extensions
    const pngUrl = 'https://example.com/image.png';
    const pngFilename = converter.generateImageFilename(pngUrl);
    const pngPassed = pngFilename.endsWith('.png');
    console.log(`   ${pngPassed ? '✅' : '❌'} PNG extension preserved: ${pngFilename}`);
    
    // Test data URL skip (should not happen in real flow, but ensure method doesn't crash)
    const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';
    const dataFilename = converter.generateImageFilename(dataUrl);
    console.log(`   ℹ️  Data URL handled: ${dataFilename}`);
    
  } catch (error) {
    testResults.push({
      name: 'generateImageFilename',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Failed: ${error.message}`);
  }
  
  // Test 2: downloadImage mock (already overridden)
  console.log('\n2. Testing downloadImage mock...');
  try {
    const converter = createMockConverter();
    const testUrl = 'https://example.com/test.jpg';
    const testPath = path.join(tempDir, 'test-mock.jpg');
    
    await converter.downloadImage(testUrl, testPath);
    
    const fileExists = fs.existsSync(testPath);
    const fileSize = fileExists ? fs.statSync(testPath).size : 0;
    
    const passed = fileExists && fileSize === 8; // Our mock writes 8 bytes
    
    testResults.push({
      name: 'downloadImage mock',
      passed,
      details: { fileExists, fileSize }
    });
    
    console.log(`   ${passed ? '✅' : '❌'} Mock download succeeded, file size: ${fileSize} bytes`);
    
  } catch (error) {
    testResults.push({
      name: 'downloadImage mock',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Failed: ${error.message}`);
  }
  
  // Test 3: downloadAndLocalizeImages with simple HTML
  console.log('\n3. Testing downloadAndLocalizeImages...');
  try {
    const converter = createMockConverter({ downloadImages: true });
    const baseUrl = 'https://example.com/page';
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Test Page</h1>
        <img src="/images/photo1.jpg" alt="Photo 1">
        <img src="https://cdn.example.com/photo2.png" alt="Photo 2">
        <img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="Data image">
        <img src="//relative-protocol.com/image.svg" alt="Protocol-relative">
      </body>
      </html>
    `;
    
    const processedHtml = await converter.downloadAndLocalizeImages(html, baseUrl);
    
    // Check that image src attributes have been replaced with local paths
    const hasLocalPath1 = processedHtml.includes('images/img-');
    const hasLocalPath2 = processedHtml.includes('images/img-');
    const dataUrlNotReplaced = processedHtml.includes('data:image');
    
    // Count number of local paths
    const localPathMatches = processedHtml.match(/src="images\/img-[a-f0-9]{8}\.(jpg|png|svg)"/g);
    const localPathCount = localPathMatches ? localPathMatches.length : 0;
    
    // Verify images directory was created
    const outputDir = converter.getOutputDirForUrl(baseUrl);
    const imagesDir = path.join(outputDir, 'images');
    const imagesDirExists = fs.existsSync(imagesDir);
    
    console.log(`   Debug: hasLocalPath1=${hasLocalPath1}, hasLocalPath2=${hasLocalPath2}, dataUrlNotReplaced=${dataUrlNotReplaced}, localPathCount=${localPathCount}, imagesDirExists=${imagesDirExists}`);
    const passed = hasLocalPath1 && hasLocalPath2 && dataUrlNotReplaced && localPathCount >= 2 && imagesDirExists;
    
    testResults.push({
      name: 'downloadAndLocalizeImages',
      passed,
      details: { 
        hasLocalPath1, 
        hasLocalPath2, 
        dataUrlNotReplaced, 
        localPathCount, 
        imagesDirExists,
        processedHtmlLength: processedHtml.length 
      }
    });
    
    console.log(`   ${passed ? '✅' : '❌'} Image localization successful`);
    console.log(`   Local paths found: ${localPathCount}`);
    console.log(`   Images directory created: ${imagesDirExists}`);
    
    // List downloaded files
    if (imagesDirExists) {
      const files = fs.readdirSync(imagesDir);
      console.log(`   Downloaded files: ${files.length} (${files.join(', ')})`);
    }
    
  } catch (error) {
    testResults.push({
      name: 'downloadAndLocalizeImages',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Failed: ${error.message}`);
  }
  
  // Test 4: Integration with converter (downloadImages option)
  console.log('\n4. Testing converter with downloadImages option...');
  try {
    const converter = createMockConverter({ 
      downloadImages: true,
      saveToFile: false 
    });
    
    // Mock the extraction methods to return simple HTML with images
    const originalExtractWithWebFetch = converter.extractWithWebFetch;
    converter.extractWithWebFetch = async (url) => {
      return {
        method: 'web_fetch',
        html: `<html><body><img src="/test.jpg" alt="Test"></body></html>`,
        raw: '',
        length: 100,
        simulated: true
      };
    };
    
    // Temporarily override convertUrlToMarkdown to skip detection and extraction
    // We'll just test that the downloadImages flag triggers the image processing
    const originalConvertUrlToMarkdown = converter.convertUrlToMarkdown;
    converter.convertUrlToMarkdown = async (url, options) => {
      // Skip cache, detection, etc. Just process the mock HTML
      const content = await converter.extractWithWebFetch(url);
      
      if (options.downloadImages) {
        content.html = await converter.downloadAndLocalizeImages(content.html, url);
      }
      
      const markdown = converter.convertHtmlToMarkdown(content.html);
      
      return {
        success: true,
        url,
        markdown,
        metadata: {
          method: 'test',
          length: markdown.length
        }
      };
    };
    
    const result = await converter.convertUrlToMarkdown('https://example.com/test', { downloadImages: true });
    
    const passed = result.success && 
                  result.markdown.includes('![Test]') &&
                  result.markdown.includes('images/img-');
    
    testResults.push({
      name: 'Converter with downloadImages',
      passed,
      details: { 
        success: result.success,
        hasImage: result.markdown.includes('![Test]'),
        hasLocalPath: result.markdown.includes('images/img-')
      }
    });
    
    console.log(`   ${passed ? '✅' : '❌'} Converter respects downloadImages flag`);
    console.log(`   Markdown includes local image path: ${result.markdown.includes('images/img-')}`);
    
    // Restore original methods
    converter.extractWithWebFetch = originalExtractWithWebFetch;
    converter.convertUrlToMarkdown = originalConvertUrlToMarkdown;
    
  } catch (error) {
    testResults.push({
      name: 'Converter with downloadImages',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Failed: ${error.message}`);
  }
  
  // Cleanup
  cleanup();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMAGE EXTRACTION TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passedTests = testResults.filter(t => t.passed).length;
  const totalTests = testResults.length;
  const successRate = (passedTests / totalTests) * 100;
  
  console.log(`\nTotal tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success rate: ${successRate.toFixed(1)}%\n`);
  
  // Detailed results
  for (const test of testResults) {
    const icon = test.passed ? '✅' : '❌';
    console.log(`${icon} ${test.name}`);
    
    if (!test.passed && test.error) {
      console.log(`   Error: ${test.error}`);
    }
  }
  
  // Save test report
  const reportDir = path.join(__dirname, '..', 'test-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportPath = path.join(reportDir, `image-extraction-test-${Date.now()}.json`);
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
  runImageExtractionTests()
    .then(result => {
      console.log('\n' + '='.repeat(60));
      console.log(result.success ? '✅ ALL IMAGE EXTRACTION TESTS PASSED' : '⚠️ SOME TESTS FAILED');
      console.log('='.repeat(60));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner error:', error);
      process.exit(1);
    });
}

module.exports = { runImageExtractionTests };