  // Test 6: Next.js SPA
  await runTest(
    '6. Testing SPA (nextjs.org) with Playwright',
    'https://nextjs.org',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 7: Static page (wikipedia.org) with Playwright
  await runTest(
    '7. Testing static page (wikipedia.org) with Playwright',
    'https://www.wikipedia.org',
    {}
  );

  // Test 8: SPA (reddit.com) with Playwright
  await runTest(
    '8. Testing SPA (reddit.com) with Playwright',
    'https://www.reddit.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 9: Static site (bbc.com/news) with Playwright
  await runTest(
    '9. Testing static site (bbc.com/news) with Playwright',
    'https://www.bbc.com/news',
    {}
  );

  // Test 10: Static site (microsoft.com) with Playwright
  await runTest(
    '10. Testing static site (microsoft.com) with Playwright',
    'https://www.microsoft.com',
    {}
  );

  // Test 11: Static site (stackoverflow.com) with Playwright
  await runTest(
    '11. Testing static site (stackoverflow.com) with Playwright',
    'https://stackoverflow.com',
    {}
  );