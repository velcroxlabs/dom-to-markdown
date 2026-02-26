/**
 * Smoke test for Playwright integration
 */

const { DomToMarkdownConverter } = require('../src/converter');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSmokeTest() {
  console.log('🧪 Playwright Smoke Test\n');
  
  const results = [];
  const delayBetweenTests = 2000; // 2 seconds politeness
  
  async function runTest(name, url, options, extraCheck = null) {
    console.log(`${name}...`);
    const converter = new DomToMarkdownConverter({
      usePlaywright: true,
      useWebFetch: false,
      useOpenClawBrowser: false,
      saveToFile: false,
      debug: false,
      playwrightTimeout: 45000,
      ...options
    });
    
    try {
      const result = await converter.convertUrlToMarkdown(url);
      console.log(`   ✅ Success: ${result.markdown.length} characters`);
      console.log(`   Method used: ${result.metadata.method}`);
      if (extraCheck) {
        extraCheck(result);
      }
      results.push({ name, passed: true, error: null });
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      results.push({ name, passed: false, error: error.message });
    }
    await sleep(delayBetweenTests);
  }
  
  // Test 1: Static page with Playwright (should work)
  await runTest(
    '1. Testing static page (example.com) with Playwright',
    'https://example.com',
    {}
  );
  
  // Test 2: SPA page (React) with Playwright
  await runTest(
    '2. Testing SPA (react.dev) with Playwright',
    'https://react.dev',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );
  
  // Test 3: Vue.js SPA
  await runTest(
    '3. Testing SPA (vuejs.org) with Playwright',
    'https://vuejs.org',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );
  
  // Test 4: Complex static site (GitHub)
  await runTest(
    '4. Testing complex static site (github.com) with Playwright',
    'https://github.com',
    {}
  );
  
  // Test 5: Angular SPA
  await runTest(
    '5. Testing SPA (angular.io) with Playwright',
    'https://angular.io',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );
  
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
  
  // Test 12: E-commerce site (amazon.com) with Playwright
  await runTest(
    '12. Testing e-commerce site (amazon.com) with Playwright',
    'https://www.amazon.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 13: Social media (twitter.com) with Playwright
  await runTest(
    '13. Testing social media (twitter.com) with Playwright',
    'https://twitter.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 14: Simple static site (news.ycombinator.com) with Playwright
  await runTest(
    '14. Testing simple static site (news.ycombinator.com) with Playwright',
    'https://news.ycombinator.com',
    {}
  );

  // Test 15: News site (nytimes.com) with Playwright
  await runTest(
    '15. Testing news site (nytimes.com) with Playwright',
    'https://www.nytimes.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 16: Blog platform (medium.com) with Playwright
  await runTest(
    '16. Testing blog platform (medium.com) with Playwright',
    'https://medium.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );
  
  // Test 17: Apple site
  await runTest(
    '17. Testing Apple site (apple.com) with Playwright',
    'https://www.apple.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 18: YouTube
  await runTest(
    '18. Testing YouTube (youtube.com) with Playwright',
    'https://www.youtube.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 19: Netflix
  await runTest(
    '19. Testing Netflix (netflix.com) with Playwright',
    'https://www.netflix.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 20: Spotify
  await runTest(
    '20. Testing Spotify (spotify.com) with Playwright',
    'https://www.spotify.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 21: LinkedIn
  await runTest(
    '21. Testing SPA (linkedin.com) with Playwright',
    'https://www.linkedin.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 22: Instagram
  await runTest(
    '22. Testing SPA (instagram.com) with Playwright',
    'https://www.instagram.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 23: Twitch
  await runTest(
    '23. Testing SPA (twitch.tv) with Playwright',
    'https://www.twitch.tv',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 24: Notion
  await runTest(
    '24. Testing SPA (notion.so) with Playwright',
    'https://www.notion.so',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 25: Dropbox
  await runTest(
    '25. Testing SPA (dropbox.com) with Playwright',
    'https://www.dropbox.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 26: Google (static)
  await runTest(
    '26. Testing static site (google.com) with Playwright',
    'https://www.google.com',
    {}
  );

  // Test 27: Airbnb (SPA)
  await runTest(
    '27. Testing SPA (airbnb.com) with Playwright',
    'https://www.airbnb.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 28: Slack (SPA)
  await runTest(
    '28. Testing SPA (slack.com) with Playwright',
    'https://slack.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 29: Zoom (SPA)
  await runTest(
    '29. Testing SPA (zoom.us) with Playwright',
    'https://zoom.us',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 30: Figma (SPA)
  await runTest(
    '30. Testing SPA (figma.com) with Playwright',
    'https://www.figma.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 31: eBay (e-commerce)
  await runTest(
    '31. Testing SPA (ebay.com) with Playwright',
    'https://www.ebay.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 32: CNN (news)
  await runTest(
    '32. Testing SPA (cnn.com) with Playwright',
    'https://www.cnn.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 33: NASA (government)
  await runTest(
    '33. Testing SPA (nasa.gov) with Playwright',
    'https://www.nasa.gov',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 34: Harvard (education)
  await runTest(
    '34. Testing SPA (harvard.edu) with Playwright',
    'https://www.harvard.edu',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 35: GitLab (tech)
  await runTest(
    '35. Testing SPA (gitlab.com) with Playwright',
    'https://www.gitlab.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );
  // Test 36: Mozilla (developer)
  await runTest(
    '36. Testing static site (mozilla.org) with Playwright',
    'https://www.mozilla.org',
    {}
  );

  // Test 37: Docker (container platform)
  await runTest(
    '37. Testing static site (docker.com) with Playwright',
    'https://www.docker.com',
    {}
  );

  // Test 38: Cloudflare (CDN)
  await runTest(
    '38. Testing static site (cloudflare.com) with Playwright',
    'https://www.cloudflare.com',
    {}
  );

  // Test 39: Stack Exchange (network)
  await runTest(
    '39. Testing static site (stackexchange.com) with Playwright',
    'https://stackexchange.com',
    {}
  );

  // Test 40: WordPress (CMS)
  await runTest(
    '40. Testing static site (wordpress.org) with Playwright',
    'https://wordpress.org',
    {}
  );

  // Test 41: npm (package registry)
  await runTest(
    '41. Testing SPA (npmjs.com) with Playwright',
    'https://www.npmjs.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 42: DigitalOcean (cloud provider)
  await runTest(
    '42. Testing SPA (digitalocean.com) with Playwright',
    'https://www.digitalocean.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 43: Heroku (platform as a service)
  await runTest(
    '43. Testing SPA (heroku.com) with Playwright',
    'https://www.heroku.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 44: AWS (Amazon Web Services)
  await runTest(
    '44. Testing SPA (aws.amazon.com) with Playwright',
    'https://aws.amazon.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 45: Google Cloud
  await runTest(
    '45. Testing SPA (cloud.google.com) with Playwright',
    'https://cloud.google.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 46: Weather.com
  await runTest(
    '46. Testing static site (weather.com) with Playwright',
    'https://www.weather.com',
    {}
  );

  // Test 47: ESPN (sports)
  await runTest(
    '47. Testing SPA (espn.com) with Playwright',
    'https://www.espn.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 48: Quora (Q&A)
  await runTest(
    '48. Testing SPA (quora.com) with Playwright',
    'https://www.quora.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 49: W3Schools (education)
  await runTest(
    '49. Testing static site (w3schools.com) with Playwright',
    'https://www.w3schools.com',
    {}
  );

  // Test 50: Coursera (online learning)
  await runTest(
    '50. Testing SPA (coursera.org) with Playwright',
    'https://www.coursera.org',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 51: IMDb (movie database)
  await runTest(
    '51. Testing SPA (imdb.com) with Playwright',
    'https://www.imdb.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 52: Forbes (business news)
  await runTest(
    '52. Testing SPA (forbes.com) with Playwright',
    'https://www.forbes.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 53: TechCrunch (tech news)
  await runTest(
    '53. Testing SPA (techcrunch.com) with Playwright',
    'https://techcrunch.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 54: The Verge (tech news)
  await runTest(
    '54. Testing SPA (theverge.com) with Playwright',
    'https://www.theverge.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 55: Bloomberg (financial news)
  await runTest(
    '55. Testing SPA (bloomberg.com) with Playwright',
    'https://www.bloomberg.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 56: Aliexpress (e-commerce)
  await runTest(
    '56. Testing SPA (aliexpress.com) with Playwright',
    'https://www.aliexpress.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 57: Etsy (handmade marketplace)
  await runTest(
    '57. Testing SPA (etsy.com) with Playwright',
    'https://www.etsy.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 58: Pinterest (visual discovery)
  await runTest(
    '58. Testing SPA (pinterest.com) with Playwright',
    'https://www.pinterest.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 59: Discord (chat platform)
  await runTest(
    '59. Testing SPA (discord.com) with Playwright',
    'https://discord.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 60: PayPal (payment platform)
  await runTest(
    '60. Testing SPA (paypal.com) with Playwright',
    'https://www.paypal.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 61: Facebook (social media)
  await runTest(
    '61. Testing SPA (facebook.com) with Playwright',
    'https://www.facebook.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 62: Shopify (e-commerce platform)
  await runTest(
    '62. Testing SPA (shopify.com) with Playwright',
    'https://www.shopify.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 63: Trello (project management)
  await runTest(
    '63. Testing SPA (trello.com) with Playwright',
    'https://www.trello.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 64: Atlassian (software)
  await runTest(
    '64. Testing SPA (atlassian.com) with Playwright',
    'https://www.atlassian.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 65: Stripe (payment processing)
  await runTest(
    '65. Testing SPA (stripe.com) with Playwright',
    'https://www.stripe.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 66: TikTok (social media)
  await runTest(
    '66. Testing SPA (tiktok.com) with Playwright',
    'https://www.tiktok.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 67: WhatsApp (messaging)
  await runTest(
    '67. Testing SPA (whatsapp.com) with Playwright',
    'https://www.whatsapp.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 68: Yahoo (portal)
  await runTest(
    '68. Testing SPA (yahoo.com) with Playwright',
    'https://www.yahoo.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 69: Adobe (software)
  await runTest(
    '69. Testing SPA (adobe.com) with Playwright',
    'https://www.adobe.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 70: IBM (technology)
  await runTest(
    '70. Testing SPA (ibm.com) with Playwright',
    'https://www.ibm.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 71: Booking.com (travel)
  await runTest(
    '71. Testing SPA (booking.com) with Playwright',
    'https://www.booking.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 72: Craigslist (classifieds)
  await runTest(
    '72. Testing SPA (craigslist.org) with Playwright',
    'https://www.craigslist.org',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 73: WordPress.com (blogging platform)
  await runTest(
    '73. Testing SPA (wordpress.com) with Playwright',
    'https://www.wordpress.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 74: WikiHow (how‑to guides)
  await runTest(
    '74. Testing SPA (wikihow.com) with Playwright',
    'https://www.wikihow.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 75: TED (talks)
  await runTest(
    '75. Testing SPA (ted.com) with Playwright',
    'https://www.ted.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 76: Bitbucket (code hosting)
  await runTest(
    '76. Testing SPA (bitbucket.org) with Playwright',
    'https://bitbucket.org',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 77: Asana (project management)
  await runTest(
    '77. Testing SPA (asana.com) with Playwright',
    'https://asana.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 78: dev.to (developer community)
  await runTest(
    '78. Testing SPA (dev.to) with Playwright',
    'https://dev.to',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 79: Hashnode (blogging platform)
  await runTest(
    '79. Testing SPA (hashnode.com) with Playwright',
    'https://hashnode.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );


  // Test 80: Substack (newsletter platform)
  await runTest(
    '80. Testing SPA (substack.com) with Playwright',
    'https://substack.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 81: Science Magazine (sciencemag.org)
  await runTest(
    '81. Testing static site (sciencemag.org) with Playwright',
    'https://www.sciencemag.org',
    {}
  );

  // Test 82: Nature (nature.com)
  await runTest(
    '82. Testing SPA (nature.com) with Playwright',
    'https://www.nature.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 83: arXiv (arxiv.org)
  await runTest(
    '83. Testing static site (arxiv.org) with Playwright',
    'https://arxiv.org',
    {}
  );

  // Test 84: Kickstarter (kickstarter.com)
  await runTest(
    '84. Testing SPA (kickstarter.com) with Playwright',
    'https://www.kickstarter.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

  // Test 85: Product Hunt (producthunt.com)
  await runTest(
    '85. Testing SPA (producthunt.com) with Playwright',
    'https://www.producthunt.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );
// Test 86: Udemy (www.udemy.com)
  await runTest(
    '86. Testing SPA (www.udemy.com) with Playwright',
    'https://www.udemy.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

// Test 87: Glassdoor (www.glassdoor.com)
  await runTest(
    '87. Testing SPA (www.glassdoor.com) with Playwright',
    'https://www.glassdoor.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

// Test 88: Hulu (www.hulu.com)
  await runTest(
    '88. Testing SPA (www.hulu.com) with Playwright',
    'https://www.hulu.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

// Test 89: Disney+ (www.disneyplus.com)
  await runTest(
    '89. Testing SPA (www.disneyplus.com) with Playwright',
    'https://www.disneyplus.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

// Test 90: Nike (www.nike.com)
  await runTest(
    '90. Testing SPA (www.nike.com) with Playwright',
    'https://www.nike.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );
  // Test 91: Whitehouse (www.whitehouse.gov)
  await runTest(
    '91. Testing static site (www.whitehouse.gov) with Playwright',
    'https://www.whitehouse.gov',
    {}
  );

// Test 92: CDC (www.cdc.gov)
  await runTest(
    '92. Testing static site (www.cdc.gov) with Playwright',
    'https://www.cdc.gov',
    {}
  );

// Test 93: United Nations (www.un.org)
  await runTest(
    '93. Testing static site (www.un.org) with Playwright',
    'https://www.un.org',
    {}
  );

// Test 94: DuckDuckGo (duckduckgo.com)
  await runTest(
    '94. Testing static site (duckduckgo.com) with Playwright',
    'https://duckduckgo.com',
    {}
  );

// Test 95: Ubuntu (ubuntu.com)
  await runTest(
    '95. Testing SPA (ubuntu.com) with Playwright',
    'https://ubuntu.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

// Test 96: Archive.org (archive.org)
  await runTest(
    '96. Testing static site (archive.org) with Playwright',
    'https://archive.org',
    {}
  );

// Test 97: Fandom (fandom.com)
  await runTest(
    '97. Testing SPA (fandom.com) with Playwright',
    'https://www.fandom.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

// Test 98: BBC UK (bbc.co.uk)
  await runTest(
    '98. Testing static site (bbc.co.uk) with Playwright',
    'https://www.bbc.co.uk',
    {}
  );

// Test 99: National Geographic (nationalgeographic.com)
  await runTest(
    '99. Testing static site (nationalgeographic.com) with Playwright',
    'https://www.nationalgeographic.com',
    {}
  );

// Test 100: SoundCloud (soundcloud.com)
  await runTest(
    '100. Testing SPA (soundcloud.com) with Playwright',
    'https://soundcloud.com',
    {},
    (result) => {
      if (result.markdown.length > 1000) {
        console.log(`   ✅ Content length > 1000 chars (good for SPA)`);
      } else {
        console.log(`   ⚠️ Content length ≤ 1000 chars (may be incomplete)`);
      }
    }
  );

// Test 101: Fallback when Playwright not available (simulate by disabling)
  console.log('101. Testing fallback (Playwright disabled, web_fetch enabled)...');
  const converter7 = new DomToMarkdownConverter({
    usePlaywright: false,
    useWebFetch: true,
    useOpenClawBrowser: false,
    saveToFile: false,
    debug: false
  });
  
  try {
    const result7 = await converter7.convertUrlToMarkdown('https://example.com');
    console.log(`   ✅ Success: ${result7.markdown.length} characters`);
    console.log(`   Method used: ${result7.metadata.method}`);
    if (result7.metadata.method === 'web_fetch') {
      console.log(`   ✅ Correctly used web_fetch as fallback`);
    } else {
      console.log(`   ⚠️ Used ${result7.metadata.method} instead of web_fetch`);
    }
    results.push({ name: '101. Fallback test', passed: true, error: null });
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    results.push({ name: '101. Fallback test', passed: false, error: error.message });
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SMOKE TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const successRate = (passed / total) * 100;
  
  console.log(`\nTotal tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  console.log(`Success rate: ${successRate.toFixed(1)}%\n`);
  
  for (const r of results) {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} ${r.name}`);
    if (!r.passed) {
      console.log(`   Error: ${r.error}`);
    }
  }
  
  // Determine overall success: require at least 80% pass rate
  const overallSuccess = successRate >= 80.0;
  
  if (overallSuccess) {
    console.log('\n🎉 Smoke tests passed (meets 80% threshold)!');
  } else {
    console.log('\n⚠️ Smoke tests failed (below 80% threshold).');
  }
  
  return overallSuccess;
}

if (require.main === module) {
  runSmokeTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

module.exports = { runSmokeTest };