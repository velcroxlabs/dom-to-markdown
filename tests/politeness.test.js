/**
 * Unit and integration tests for politeness module
 * Tests robots.txt parsing, caching, rate limiting, and integration with converter.
 */

const PolitenessManager = require('../src/politeness');
const { DomToMarkdownConverter } = require('../src/converter');
const fs = require('fs');
const path = require('path');

async function runPolitenessTests() {
  console.log('🧪 Politeness Module Tests\n');
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
  // 1. Unit tests: parsing and pattern matching (no network)
  // --------------------------------------------------------------------
  console.log('1. Unit tests (parsing, wildcard matching)...');
  
  // Create manager with mock fetcher
  const mockRobots = {
    'example.com': `User-agent: *
Disallow: /admin
Allow: /public
Crawl-delay: 2`,
    'google.com': `User-agent: *
Disallow: /search
Allow: /search/about
Crawl-delay: 1
User-agent: Googlebot
Disallow: /private`,
    'github.com': `User-agent: *
Disallow: /search?*
Allow: /search
Crawl-delay: 0.5`,
  };

  const mockFetcher = async (robotsUrl) => {
    const domain = robotsUrl.replace('https://', '').replace('/robots.txt', '');
    return mockRobots[domain] || null;
  };

  const manager = new PolitenessManager({
    debug: false,
    respectRobotsTxt: true,
    fetchRobotsTxt: mockFetcher,
    requestDelay: 100,
  });

  // 1.1 parseRobotsTxt
  const rules = manager.parseRobotsTxt(mockRobots['example.com']);
  recordTest('parseRobotsTxt wildcard disallow', rules['*'] && rules['*'].disallow.includes('/admin'));
  recordTest('parseRobotsTxt allow', rules['*'] && rules['*'].allow.includes('/public'));
  recordTest('parseRobotsTxt crawl-delay', rules['*'] && rules['*'].crawlDelay === 2);

  // 1.2 wildcard pattern matching
  const regex1 = manager.wildcardToRegex('/admin/*');
  recordTest('wildcard /admin/* matches /admin/panel', regex1.test('/admin/panel'));
  recordTest('wildcard /admin/* does not match /admin (no slash)', !regex1.test('/admin'));
  const regex2 = manager.wildcardToRegex('*.jpg$');
  recordTest('wildcard *.jpg$ matches /image.jpg', regex2.test('/image.jpg'));
  recordTest('wildcard *.jpg$ does not match /image.png', !regex2.test('/image.png'));

  // 1.3 isAllowed with mock data
  const adminResult = await manager.isAllowed('https://example.com/admin');
  recordTest('isAllowed disallows /admin', !adminResult.allowed);
  const publicResult = await manager.isAllowed('https://example.com/public');
  recordTest('isAllowed allows /public', publicResult.allowed);
  recordTest('isAllowed returns crawlDelay', adminResult.crawlDelay === 2);

  // 1.4 caching
  const rules1 = await manager._fetchRobotsTxtInternal('example.com');
  const rules2 = await manager._fetchRobotsTxtInternal('example.com'); // second call should use cache
  recordTest('caching returns same object', rules1 && rules2 && rules1 === rules2);

  // 1.5 respectRobotsTxt disabled
  const manager2 = new PolitenessManager({
    respectRobotsTxt: false,
    fetchRobotsTxt: mockFetcher,
  });
  const result = await manager2.isAllowed('https://example.com/admin');
  recordTest('respectRobotsTxt false -> always allowed', result.allowed === true);

  // --------------------------------------------------------------------
  // 2. Integration test: real robots.txt fetching (3 domains)
  // --------------------------------------------------------------------
  console.log('\n2. Integration test: real robots.txt fetching (3 domains)...');
  
  // Use real fetcher (web_fetch or fetch). We'll skip if no network available.
  // We'll test with three domains that are known to have robots.txt.
  const testDomains = ['w3.org', 'google.com', 'mozilla.org'];
  const realManager = new PolitenessManager({
    debug: false,
    respectRobotsTxt: true,
    requestDelay: 2000,
  });

  for (const domain of testDomains) {
    try {
      const rules = await realManager.fetchRobotsTxt(domain);
      if (rules) {
        recordTest(`fetchRobotsTxt ${domain}`, true, 'fetched and parsed');
        // Quick check that rules have expected structure
        if (rules['*']) {
          recordTest(`  -> wildcard rules present`, true);
        }
      } else {
        // Some domains may not have robots.txt (example.com does)
        recordTest(`fetchRobotsTxt ${domain}`, false, 'no robots.txt found');
      }
    } catch (error) {
      recordTest(`fetchRobotsTxt ${domain}`, false, `error: ${error.message}`);
    }
  }

  // --------------------------------------------------------------------
  // 3. Rate limiting delay test
  // --------------------------------------------------------------------
  console.log('\n3. Rate limiting delay test...');
  const delayManager = new PolitenessManager({
    debug: false,
    requestDelay: 200, // 200 ms
  });
  const start = Date.now();
  await delayManager.delay(); // first call should not wait (lastRequestTime = 0)
  const elapsed1 = Date.now() - start;
  recordTest('first delay immediate', elapsed1 < 50, `waited ${elapsed1}ms`);

  // second call should wait at least requestDelay
  const start2 = Date.now();
  await delayManager.delay();
  const elapsed2 = Date.now() - start2;
  recordTest('second delay respects requestDelay', elapsed2 >= 190, `waited ${elapsed2}ms`);

  // test crawlDelay parameter
  const start3 = Date.now();
  await delayManager.delay(0.5); // 0.5 seconds = 500 ms
  const elapsed3 = Date.now() - start3;
  recordTest('crawlDelay overrides requestDelay', elapsed3 >= 500, `waited ${elapsed3}ms`);

  // --------------------------------------------------------------------
  // 4. Integration with converter
  // --------------------------------------------------------------------
  console.log('\n4. Integration with converter...');
  
  // Create converter with politeness enabled
  const converter = new DomToMarkdownConverter({
    debug: false,
    saveToFile: false,
    politeness: true,
    politenessOptions: {
      respectRobotsTxt: true,
      requestDelay: 100,
      debug: false,
    },
  });
  
  // Check that politenessManager is instantiated
  recordTest('converter creates politenessManager', converter.politenessManager !== null);
  
  // Simulate a URL that is disallowed by robots.txt (mock)
  // We'll replace the manager's fetchRobotsTxt with mock
  // This is a bit hacky but okay for test
  converter.politenessManager.fetchRobotsTxt = async (domain) => {
    if (domain === 'disallowed.example.com') {
      // Return parsed structure matching parseRobotsTxt output
      return {
        '*': { disallow: ['/'], allow: [], crawlDelay: null }
      };
    }
    return null;
  };
  
  // Debug: call isAllowed directly to see what happens
  const debugAllowed = await converter.politenessManager.isAllowed('https://disallowed.example.com/');
  console.log(`Debug isAllowed result: ${JSON.stringify(debugAllowed)}`);
  
  const conversionResult = await converter.convertUrlToMarkdown('https://disallowed.example.com/');
  if (!conversionResult.success && conversionResult.error && conversionResult.error.includes('disallowed by robots.txt')) {
    recordTest('converter respects robots.txt disallow', true);
  } else {
    recordTest('converter respects robots.txt disallow', false, `expected disallowed, got ${conversionResult.success ? 'success' : conversionResult.error}`);
  }

  // --------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------
  console.log('\n' + '='.repeat(50));
  const passed = testResults.filter(r => r.passed).length;
  const total = testResults.length;
  const percentage = ((passed / total) * 100).toFixed(1);
  
  console.log(`Results: ${passed}/${total} passed (${percentage}%)`);
  console.log(`Total time: ${Date.now() - startTime}ms`);

  // Log failures
  const failures = testResults.filter(r => !r.passed);
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(f => console.log(`  ❌ ${f.name}: ${f.details}`));
  }

  if (passed === total) {
    console.log('\n✅ All politeness tests passed!');
    return true;
  } else {
    console.log('\n❌ Some politeness tests failed.');
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  runPolitenessTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { runPolitenessTests };