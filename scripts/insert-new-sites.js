const fs = require('fs');
const path = require('path');

const smokePath = path.join(__dirname, '../tests/playwright-smoke.js');
let content = fs.readFileSync(smokePath, 'utf8');

// Find the line index of "// Test 45: Google Cloud"
const lines = content.split('\n');
let idx45 = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('// Test 45: Google Cloud')) {
    idx45 = i;
    break;
  }
}
if (idx45 === -1) {
  console.error('Could not find test 45');
  process.exit(1);
}

// Find the next blank line after the test block (there is one)
let idxBlank = idx45;
while (idxBlank < lines.length && lines[idxBlank].trim() !== '') {
  idxBlank++;
}
if (idxBlank >= lines.length) {
  console.error('Could not find blank line after test 45');
  process.exit(1);
}

// Insert new tests after the blank line
const newTests = [
  '  // Test 46: Weather.com',
  '  await runTest(',
  '    \'46. Testing static site (weather.com) with Playwright\',',
  '    \'https://www.weather.com\',',
  '    {}',
  '  );',
  '',
  '  // Test 47: ESPN (sports)',
  '  await runTest(',
  '    \'47. Testing SPA (espn.com) with Playwright\',',
  '    \'https://www.espn.com\',',
  '    {},',
  '    (result) => {',
  '      if (result.markdown.length > 1000) {',
  '        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);',
  '      } else {',
  '        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);',
  '      }',
  '    }',
  '  );',
  '',
  '  // Test 48: Quora (Q&A)',
  '  await runTest(',
  '    \'48. Testing SPA (quora.com) with Playwright\',',
  '    \'https://www.quora.com\',',
  '    {},',
  '    (result) => {',
  '      if (result.markdown.length > 1000) {',
  '        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);',
  '      } else {',
  '        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);',
  '      }',
  '    }',
  '  );',
  '',
  '  // Test 49: W3Schools (education)',
  '  await runTest(',
  '    \'49. Testing static site (w3schools.com) with Playwright\',',
  '    \'https://www.w3schools.com\',',
  '    {}',
  '  );',
  '',
  '  // Test 50: Coursera (online learning)',
  '  await runTest(',
  '    \'50. Testing SPA (coursera.org) with Playwright\',',
  '    \'https://www.coursera.org\',',
  '    {},',
  '    (result) => {',
  '      if (result.markdown.length > 1000) {',
  '        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);',
  '      } else {',
  '        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);',
  '      }',
  '    }',
  '  );',
  ''
];

// Insert after the blank line
lines.splice(idxBlank + 1, 0, ...newTests);

// Now update fallback test numbers from 46 to 51
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('// Test 46: Fallback when Playwright not available')) {
    lines[i] = '  // Test 51: Fallback when Playwright not available (simulate by disabling)';
  }
  if (lines[i].includes('46. Testing fallback (Playwright disabled, web_fetch enabled)...')) {
    lines[i] = '  console.log(\'51. Testing fallback (Playwright disabled, web_fetch enabled)...\');';
  }
  if (lines[i].includes('results.push({ name: \'46. Fallback test\'')) {
    lines[i] = lines[i].replace(/46\. Fallback test/g, '51. Fallback test');
  }
}

const newContent = lines.join('\n');
fs.writeFileSync(smokePath, newContent);
console.log('Added 5 new smoke tests and updated fallback test number to 51.');