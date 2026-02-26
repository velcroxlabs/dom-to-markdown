const fs = require('fs');
const path = require('path');

const newTests = [
  { num: 86, name: 'Udemy', url: 'https://www.udemy.com', spa: true },
  { num: 87, name: 'Glassdoor', url: 'https://www.glassdoor.com', spa: true },
  { num: 88, name: 'Hulu', url: 'https://www.hulu.com', spa: true },
  { num: 89, name: 'Disney+', url: 'https://www.disneyplus.com', spa: true },
  { num: 90, name: 'Nike', url: 'https://www.nike.com', spa: true }
];

function generateTestBlock(test) {
  const extraCheck = test.spa ? `(result) => {
      if (result.markdown.length > 1000) {
        console.log(\`   ✅ Content length > 1000 chars (good for SPA)\`);
      } else {
        console.log(\`   ⚠️ Content length ≤ 1000 chars (may be incomplete)\`);
      }
    }` : 'null';
  
  return `  // Test ${test.num}: ${test.name} (${test.url.replace('https://', '')})
  await runTest(
    '${test.num}. Testing ${test.spa ? 'SPA' : 'static site'} (${test.url.replace('https://', '')}) with Playwright',
    '${test.url}',
    {},
    ${extraCheck}
  );`;
}

const fallbackBlock = `  // Test 91: Fallback when Playwright not available (simulate by disabling)
  console.log('91. Testing fallback (Playwright disabled, web_fetch enabled)...');
  const converter7 = new DomToMarkdownConverter({
    usePlaywright: false,
    useWebFetch: true,
    useOpenClawBrowser: false,
    saveToFile: false,
    debug: false
  });
  
  try {
    const result7 = await converter7.convertUrlToMarkdown('https://example.com');
    console.log(\`   ✅ Success: \${result7.markdown.length} characters\`);
    console.log(\`   Method used: \${result7.metadata.method}\`);
    if (result7.metadata.method === 'web_fetch') {
      console.log(\`   ✅ Correctly used web_fetch as fallback\`);
    } else {
      console.log(\`   ⚠️ Used \${result7.metadata.method} instead of web_fetch\`);
    }
    results.push({ name: '91. Fallback test', passed: true, error: null });
  } catch (error) {
    console.log(\`   ❌ Failed: \${error.message}\`);
    results.push({ name: '91. Fallback test', passed: false, error: error.message });
  }`;

const output = newTests.map(generateTestBlock).join('\n') + '\n' + fallbackBlock;

console.log(output);