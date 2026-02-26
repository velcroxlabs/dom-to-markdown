/**
 * Integration tests for image resizing with real sharp
 * 
 * Tests _resizeImageIfNeeded with actual sharp library.
 * Requires sharp to be installed.
 */

const fs = require('fs');
const path = require('path');
const { DomToMarkdownConverter } = require('../src/converter');

// Detect WSL2 to skip sharp integration tests (bus error)
function isWSL2() {
  if (process.platform !== 'linux') return false;
  try {
    const version = fs.readFileSync('/proc/version', 'utf8').toLowerCase();
    return version.includes('wsl2') || version.includes('microsoft');
  } catch (e) {
    return false;
  }
}

async function runImageResizingIntegrationTests() {
  console.log('🧪 Image Resizing - Integration Tests (Real Sharp)\n');
  
  const testResults = [];
  
  // Helper: create temporary directory
  const tempDir = path.join(__dirname, '..', 'test-temp-resize-integration');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Helper: cleanup after tests
  const cleanup = () => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  };
  
  // Skip integration tests on WSL2 due to sharp bus error
  if (isWSL2()) {
    console.log('⏭️  WSL2 detected, skipping sharp integration tests due to bus error');
    cleanup();
    return {
      success: true,
      totalTests: 0,
      passedTests: 0,
      successRate: 100,
      results: [],
      skipped: true,
      wsl2Skipped: true
    };
  }

  // Check if sharp is available
  let sharp;
  try {
    sharp = require('sharp');
    console.log('✅ Sharp library loaded successfully');
  } catch (error) {
    console.log('⏭️  Sharp not available, skipping integration tests');
    cleanup();
    return {
      success: true,
      totalTests: 0,
      passedTests: 0,
      successRate: 100,
      results: [],
      skipped: true
    };
  }
  
  // Helper: create a test image using sharp
  async function createTestImage(width, height, format = 'jpeg', outputPath) {
    const image = sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    });
    switch (format) {
      case 'jpeg':
      case 'jpg':
        return image.jpeg({ quality: 90 }).toFile(outputPath);
      case 'png':
        return image.png().toFile(outputPath);
      case 'webp':
        return image.webp({ quality: 90 }).toFile(outputPath);
      default:
        throw new Error(`Unsupported format for test: ${format}`);
    }
  }
  
  // Helper: get image dimensions using sharp
  async function getImageDimensions(imagePath) {
    const metadata = await sharp(imagePath).metadata();
    return { width: metadata.width, height: metadata.height };
  }
  
  // Test 1: Resize JPEG when dimensions exceed limits
  console.log('1. Testing JPEG resizing...');
  try {
    const converter = new DomToMarkdownConverter({
      debug: false,
      saveToFile: false,
      imageMaxWidth: 100,
      imageMaxHeight: 100,
      imageQuality: 80
    });
    
    const testImagePath = path.join(tempDir, 'test-200x200.jpg');
    await createTestImage(200, 200, 'jpeg', testImagePath);
    
    const originalDims = await getImageDimensions(testImagePath);
    console.log(`   Created test image: ${originalDims.width}x${originalDims.height}`);
    
    // Ensure sharp is available (should be)
    if (!converter.isSharpAvailable()) {
      throw new Error('Sharp not available according to converter');
    }
    
    await converter._resizeImageIfNeeded(testImagePath);
    
    const newDims = await getImageDimensions(testImagePath);
    console.log(`   After resize: ${newDims.width}x${newDims.height}`);
    
    // Should be resized to <= 100x100
    const passed = newDims.width <= 100 && newDims.height <= 100;
    
    testResults.push({
      name: 'JPEG resizing',
      passed,
      details: { originalDims, newDims }
    });
    
    console.log(`   ${passed ? '✅' : '❌'} JPEG resized correctly`);
    
  } catch (error) {
    testResults.push({
      name: 'JPEG resizing',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Failed: ${error.message}`);
  }
  
  // Test 2: Skip resizing when dimensions already within limits
  console.log('\n2. Testing skip resizing (dimensions within limits)...');
  try {
    const converter = new DomToMarkdownConverter({
      debug: false,
      saveToFile: false,
      imageMaxWidth: 300,
      imageMaxHeight: 300,
      imageQuality: 80
    });
    
    const testImagePath = path.join(tempDir, 'test-small.jpg');
    await createTestImage(150, 150, 'jpeg', testImagePath);
    
    const originalDims = await getImageDimensions(testImagePath);
    // Get file size before resize
    const originalSize = fs.statSync(testImagePath).size;
    
    await converter._resizeImageIfNeeded(testImagePath);
    
    const newDims = await getImageDimensions(testImagePath);
    const newSize = fs.statSync(testImagePath).size;
    
    // Dimensions should remain unchanged
    const dimensionsUnchanged = originalDims.width === newDims.width && originalDims.height === newDims.height;
    // File size may change slightly due to recompression, but we can assume it's similar
    // We'll just check that file still exists and dimensions unchanged
    const passed = dimensionsUnchanged;
    
    testResults.push({
      name: 'Skip resizing when within limits',
      passed,
      details: { originalDims, newDims, originalSize, newSize }
    });
    
    console.log(`   ${passed ? '✅' : '❌'} Resize skipped as expected`);
    console.log(`   Dimensions unchanged: ${originalDims.width}x${originalDims.height}`);
    
  } catch (error) {
    testResults.push({
      name: 'Skip resizing when within limits',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Failed: ${error.message}`);
  }
  
  // Test 3: Format-specific handling (PNG)
  console.log('\n3. Testing PNG resizing...');
  try {
    const converter = new DomToMarkdownConverter({
      debug: false,
      saveToFile: false,
      imageMaxWidth: 80,
      imageMaxHeight: 80,
      imageQuality: 80
    });
    
    const testImagePath = path.join(tempDir, 'test-150x150.png');
    await createTestImage(150, 150, 'png', testImagePath);
    
    const originalDims = await getImageDimensions(testImagePath);
    
    await converter._resizeImageIfNeeded(testImagePath);
    
    const newDims = await getImageDimensions(testImagePath);
    const passed = newDims.width <= 80 && newDims.height <= 80;
    
    testResults.push({
      name: 'PNG resizing',
      passed,
      details: { originalDims, newDims }
    });
    
    console.log(`   ${passed ? '✅' : '❌'} PNG resized correctly`);
    
  } catch (error) {
    testResults.push({
      name: 'PNG resizing',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Failed: ${error.message}`);
  }
  
  // Test 4: Skip vector formats (SVG) - mock because sharp can't create SVG
  console.log('\n4. Testing SVG skip...');
  try {
    const converter = new DomToMarkdownConverter({
      debug: false,
      saveToFile: false,
      imageMaxWidth: 100,
      imageMaxHeight: 100
    });
    
    const svgPath = path.join(tempDir, 'test.svg');
    fs.writeFileSync(svgPath, '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="red"/></svg>');
    
    // We'll mock sharp metadata to return format 'svg'
    // Since we can't rely on sharp to read SVG, we need to intercept require.
    // Instead, we'll directly test the logic by checking that the converter's
    // internal method will skip when metadata.format === 'svg'.
    // We'll do a unit-style mock by temporarily replacing require('sharp').
    const originalRequire = require.cache['sharp'];
    delete require.cache['sharp'];
    // Create a mock sharp that returns svg metadata
    const mockSharp = (path) => ({
      metadata: async () => ({ width: 200, height: 200, format: 'svg' }),
      resize: () => { throw new Error('Should not be called'); },
      toFile: async () => { throw new Error('Should not be called'); }
    });
    // Override require for 'sharp'
    const Module = require('module');
    const originalRequireFn = Module.prototype.require;
    Module.prototype.require = function(id) {
      if (id === 'sharp') {
        return mockSharp;
      }
      return originalRequireFn.apply(this, arguments);
    };
    
    // Temporarily override isSharpAvailable to true
    const originalSharpAvailable = converter.isSharpAvailable;
    converter.isSharpAvailable = () => true;
    
    await converter._resizeImageIfNeeded(svgPath);
    
    // Restore
    Module.prototype.require = originalRequireFn;
    if (originalRequire) {
      require.cache['sharp'] = originalRequire;
    }
    converter.isSharpAvailable = originalSharpAvailable;
    
    // If we reached here without error, the format was skipped
    const passed = true;
    testResults.push({
      name: 'SVG format skipped',
      passed,
      details: { format: 'svg' }
    });
    
    console.log(`   ✅ SVG format skipped`);
    
  } catch (error) {
    testResults.push({
      name: 'SVG format skipped',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Failed: ${error.message}`);
  }
  
  // Test 5: Infinite max dimensions skip
  console.log('\n5. Testing infinite max dimensions skip...');
  try {
    const converter = new DomToMarkdownConverter({
      debug: false,
      saveToFile: false,
      imageMaxWidth: Infinity,
      imageMaxHeight: Infinity,
      imageQuality: 80
    });
    
    const testImagePath = path.join(tempDir, 'test-inf.jpg');
    await createTestImage(200, 200, 'jpeg', testImagePath);
    
    const originalDims = await getImageDimensions(testImagePath);
    
    // Override isSharpAvailable to true but we should detect infinite dimensions before requiring sharp
    // We'll check if sharp is required (should not be). We'll intercept require.
    let sharpRequired = false;
    const Module = require('module');
    const originalRequire = Module.prototype.require;
    Module.prototype.require = function(id) {
      if (id === 'sharp') {
        sharpRequired = true;
      }
      return originalRequire.apply(this, arguments);
    };
    
    await converter._resizeImageIfNeeded(testImagePath);
    
    Module.prototype.require = originalRequire;
    
    const passed = !sharpRequired;
    testResults.push({
      name: 'Infinite dimensions skip',
      passed,
      details: { sharpRequired, originalDims }
    });
    
    console.log(`   ${passed ? '✅' : '❌'} Sharp not required when max dimensions infinite`);
    
  } catch (error) {
    testResults.push({
      name: 'Infinite dimensions skip',
      passed: false,
      error: error.message
    });
    console.log(`   ❌ Failed: ${error.message}`);
  }
  
  // Cleanup
  cleanup();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMAGE RESIZING INTEGRATION TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passedTests = testResults.filter(t => t.passed).length;
  const totalTests = testResults.length;
  const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 100;
  
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
  
  const reportPath = path.join(reportDir, `image-resizing-integration-test-${Date.now()}.json`);
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
  runImageResizingIntegrationTests()
    .then(result => {
      console.log('\n' + '='.repeat(60));
      console.log(result.success ? '✅ ALL IMAGE RESIZING INTEGRATION TESTS PASSED' : '⚠️ SOME TESTS FAILED');
      console.log('='.repeat(60));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner error:', error);
      process.exit(1);
    });
}

module.exports = { runImageResizingIntegrationTests };