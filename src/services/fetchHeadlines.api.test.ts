import { describe, expect, it } from 'vitest';

const TEST_TIMEOUT_MS = Number(process.env.API_CONNECTIVITY_TIMEOUT ?? 30_000);
const REQUEST_TIMEOUT_MS = Number(process.env.API_CONNECTIVITY_REQUEST_TIMEOUT ?? 8_000);

const ENDPOINTS = [
  { name: 'The Guardian RSS', url: 'https://www.theguardian.com/world/rss' },
  { name: 'NYT World RSS', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml' },
  { name: 'Associated Press RSS', url: 'https://apnews.com/apf-topnews?format=xml' },
  { name: 'BBC World RSS', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'PBS NewsHour RSS', url: 'https://www.pbs.org/newshour/feeds/rss/headlines' },
  { name: 'ProPublica RSS', url: 'https://www.propublica.org/feeds/featured-stories' },
  { name: 'NPR RSS', url: 'https://feeds.npr.org/1001/rss.xml' },
  { name: 'Reuters World RSS', url: 'https://www.reuters.com/world/rss' },
];

const fetchWithTimeout = async (url: string) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'custom-news-connectivity-test/1.0',
        accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
      },
    });

    return response.ok;
  } catch (error) {
    console.warn(`[api-test] Request to ${url} failed`, error);
    return false;
  } finally {
    clearTimeout(timer);
  }
};

describe('headline API connectivity', () => {
  const shouldRunApiTests = process.env.RUN_API_TESTS === 'true';
  const testMethod = shouldRunApiTests ? it : it.skip;
  
  testMethod(
    'can reach at least one upstream endpoint',
    async () => {
      const results = await Promise.all(
        ENDPOINTS.map(async (endpoint) => ({ endpoint: endpoint.name, ok: await fetchWithTimeout(endpoint.url) })),
      );

      const successful = results.filter((result) => result.ok);
      const summary = JSON.stringify(results);

      expect(successful.length, `Connectivity results: ${summary}`).toBeGreaterThan(0);
    },
    TEST_TIMEOUT_MS,
  );
});
