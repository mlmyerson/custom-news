const ENV = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const GLOBAL_CONFIG = typeof window !== 'undefined' && window.__NEWS_SOURCE_CONFIG__ ? window.__NEWS_SOURCE_CONFIG__ : {};

const getConfigValue = (configKey, envKey, fallback = '') => {
  if (GLOBAL_CONFIG[configKey]) {
    return GLOBAL_CONFIG[configKey];
  }

  if (envKey && ENV[envKey]) {
    return ENV[envKey];
  }

  return fallback;
};

const DEFAULT_PROXY_ORIGIN = getConfigValue('proxyOrigin', 'VITE_NEWS_PROXY_ORIGIN', 'https://r.jina.ai/');
const withProxy = (url) => {
  if (!url) {
    return url;
  }

  if (!DEFAULT_PROXY_ORIGIN) {
    return url;
  }

  const normalizedProxy = DEFAULT_PROXY_ORIGIN.endsWith('/') ? DEFAULT_PROXY_ORIGIN : `${DEFAULT_PROXY_ORIGIN}/`;
  return `${normalizedProxy}${url}`;
};

const GUARDIAN_API_KEY = getConfigValue('guardianKey', 'VITE_GUARDIAN_API_KEY');
const NYT_API_KEY = getConfigValue('nytKey', 'VITE_NYT_API_KEY');
const NEWSAPI_KEY = getConfigValue('newsApiKey', 'VITE_NEWSAPI_KEY');
const BING_API_KEY = getConfigValue('bingKey', 'VITE_BING_API_KEY');

const sanitizeKeyword = (keyword) => keyword?.trim() ?? '';

const toIsoString = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

const normalizeArticle = (article) => {
  if (!article.url) {
    return null;
  }

  return {
    title: article.title?.trim() || article.url,
    url: article.url,
    source: article.source?.trim() || 'Unknown',
    snippet: article.snippet?.trim() || null,
    published_at: toIsoString(article.published_at),
  };
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.json();
};

const fetchText = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.text();
};

const keywordToRegex = (keyword) => {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped, 'i');
};

const stripHtml = (value) => value?.replace(/<[^>]+>/g, '').trim() ?? '';

const mapAndFilterArticles = (articles = []) =>
  articles
    .map((article) => normalizeArticle(article))
    .filter((article) => Boolean(article));

export const searchGuardian = async (keyword) => {
  const query = sanitizeKeyword(keyword);
  if (!query || !GUARDIAN_API_KEY) {
    return [];
  }

  const params = new URLSearchParams({
    q: query,
    'api-key': GUARDIAN_API_KEY,
    'show-fields': 'trailText',
    'page-size': '20',
  });

  try {
    const data = await fetchJson(`https://content.guardianapis.com/search?${params.toString()}`);
    const results = data?.response?.results ?? [];

    return mapAndFilterArticles(
      results.map((item) => ({
        title: item.webTitle,
        url: item.webUrl,
        source: item.sectionName || 'The Guardian',
        snippet: stripHtml(item.fields?.trailText ?? ''),
        published_at: item.webPublicationDate,
      })),
    );
  } catch (error) {
    console.warn('[newsSources] Guardian search failed', error);
    return [];
  }
};

export const searchNYT = async (keyword) => {
  const query = sanitizeKeyword(keyword);
  if (!query || !NYT_API_KEY) {
    return [];
  }

  const params = new URLSearchParams({ q: query, 'api-key': NYT_API_KEY });

  try {
    const data = await fetchJson(`https://api.nytimes.com/svc/search/v2/articlesearch.json?${params.toString()}`);
    const docs = data?.response?.docs ?? [];

    return mapAndFilterArticles(
      docs.map((doc) => ({
        title: doc.headline?.main,
        url: doc.web_url,
        source: doc.source || 'The New York Times',
        snippet: doc.snippet,
        published_at: doc.pub_date,
      })),
    );
  } catch (error) {
    console.warn('[newsSources] NYT search failed', error);
    return [];
  }
};

export const searchNewsAPI = async (keyword) => {
  const query = sanitizeKeyword(keyword);
  if (!query || !NEWSAPI_KEY) {
    return [];
  }

  const params = new URLSearchParams({ q: query, apiKey: NEWSAPI_KEY, sortBy: 'publishedAt', language: 'en' });

  try {
    const data = await fetchJson(`https://newsapi.org/v2/everything?${params.toString()}`);
    const articles = data?.articles ?? [];

    return mapAndFilterArticles(
      articles.map((item) => ({
        title: item.title,
        url: item.url,
        source: item.source?.name || 'NewsAPI',
        snippet: item.description,
        published_at: item.publishedAt,
      })),
    );
  } catch (error) {
    console.warn('[newsSources] NewsAPI search failed', error);
    return [];
  }
};

export const searchBingNews = async (keyword) => {
  const query = sanitizeKeyword(keyword);
  if (!query || !BING_API_KEY) {
    return [];
  }

  const params = new URLSearchParams({ q: query, freshness: 'Day', textDecorations: 'false', textFormat: 'Raw' });

  try {
    const data = await fetchJson(`https://api.bing.microsoft.com/v7.0/news/search?${params.toString()}`, {
      headers: {
        'Ocp-Apim-Subscription-Key': BING_API_KEY,
      },
    });

    const articles = data?.value ?? [];

    return mapAndFilterArticles(
      articles.map((item) => ({
        title: item.name,
        url: item.url,
        source: item.provider?.[0]?.name || 'Bing News',
        snippet: item.description,
        published_at: item.datePublished,
      })),
    );
  } catch (error) {
    console.warn('[newsSources] Bing News search failed', error);
    return [];
  }
};

export const searchGDELT = async (keyword) => {
  const query = sanitizeKeyword(keyword);
  if (!query) {
    return [];
  }

  const params = new URLSearchParams({ query, mode: 'ArtList', format: 'json', timespan: '1d' });

  try {
    const data = await fetchJson(`https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`);
    const articles = data?.articles ?? [];

    return mapAndFilterArticles(
      articles.map((item) => ({
        title: item.title,
        url: item.url,
        source: item.domain || 'GDELT',
        snippet: item.summary || item.seendate,
        published_at: item.seendate,
      })),
    );
  } catch (error) {
    console.warn('[newsSources] GDELT search failed', error);
    return [];
  }
};

const parseRssFeed = async (url) => {
  const xmlText = await fetchText(withProxy(url));
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  return Array.from(doc.querySelectorAll('item'));
};

const searchRssSources = async (keyword, sources, sourceLabel) => {
  const query = sanitizeKeyword(keyword);
  if (!query) {
    return [];
  }

  const regex = keywordToRegex(query);

  try {
    const results = await Promise.all(
      sources.map(async (url) => {
        try {
          const items = await parseRssFeed(url);
          return items
            .filter((item) => regex.test(item.textContent || ''))
            .map((item) => ({
              title: item.querySelector('title')?.textContent?.trim(),
              url: item.querySelector('link')?.textContent?.trim(),
              source: sourceLabel,
              snippet: stripHtml(item.querySelector('description')?.textContent ?? ''),
              published_at: item.querySelector('pubDate')?.textContent,
            }));
        } catch (innerError) {
          console.warn(`[newsSources] RSS fetch failed for ${url}`, innerError);
          return [];
        }
      }),
    );

    return mapAndFilterArticles(results.flat());
  } catch (error) {
    console.warn('[newsSources] RSS search failed', error);
    return [];
  }
};

export const searchReutersRSS = (keyword) =>
  searchRssSources(keyword, [
    'https://feeds.reuters.com/reuters/topNews',
    'https://feeds.reuters.com/reuters/worldNews',
    'https://feeds.reuters.com/reuters/businessNews',
  ], 'Reuters');

export const searchAPRSS = (keyword) =>
  searchRssSources(keyword, [
    'https://apnews.com/apf-topnews?format=RSS',
    'https://apnews.com/hub/world-news?format=RSS',
    'https://apnews.com/hub/politics?format=RSS',
  ], 'Associated Press');

export const searchBBCRSS = (keyword) =>
  searchRssSources(keyword, [
    'https://feeds.bbci.co.uk/news/rss.xml',
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://feeds.bbci.co.uk/news/technology/rss.xml',
  ], 'BBC News');

export const searchReddit = async (keyword) => {
  const query = sanitizeKeyword(keyword);
  if (!query) {
    return [];
  }

  const params = new URLSearchParams({ q: query, sort: 'relevance', limit: '20', t: 'day' });

  try {
    const data = await fetchJson(`https://www.reddit.com/search.json?${params.toString()}`);
    const posts = data?.data?.children ?? [];

    return mapAndFilterArticles(
      posts.map(({ data: post }) => ({
        title: post.title,
        url: post.url_overridden_by_dest || `https://www.reddit.com${post.permalink}`,
        source: `r/${post.subreddit}`,
        snippet: post.selftext?.slice(0, 280) || post.title,
        published_at: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : null,
      })),
    );
  } catch (error) {
    console.warn('[newsSources] Reddit search failed', error);
    return [];
  }
};

export const searchHN = async (keyword) => {
  const query = sanitizeKeyword(keyword);
  if (!query) {
    return [];
  }

  const params = new URLSearchParams({ query, tags: 'story' });

  try {
    const data = await fetchJson(`https://hn.algolia.com/api/v1/search?${params.toString()}`);
    const hits = data?.hits ?? [];

    return mapAndFilterArticles(
      hits.map((hit) => ({
        title: hit.title || hit.story_title || stripHtml(hit._highlightResult?.title?.value ?? ''),
        url: hit.url || hit.story_url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        source: 'Hacker News',
        snippet: hit.story_text || hit.comment_text || null,
        published_at: hit.created_at,
      })),
    );
  } catch (error) {
    console.warn('[newsSources] Hacker News search failed', error);
    return [];
  }
};

const normalizeUrlForDedupe = (url) => {
  if (!url) {
    return '';
  }

  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url.trim();
  }
};

const normalizeTitleForDedupe = (title) => title?.replace(/[^a-z0-9]/gi, '').toLowerCase() ?? '';

const dedupeArticles = (articles) => {
  const urlSeen = new Set();
  const titleSeen = new Set();

  return articles.filter((article) => {
    const urlKey = normalizeUrlForDedupe(article.url);
    const titleKey = normalizeTitleForDedupe(article.title);

    if (urlKey && urlSeen.has(urlKey)) {
      return false;
    }

    if (!urlKey && titleKey && titleSeen.has(titleKey)) {
      return false;
    }

    if (urlKey) {
      urlSeen.add(urlKey);
    }

    if (titleKey) {
      titleSeen.add(titleKey);
    }

    return true;
  });
};

export const searchAllSources = async (keyword) => {
  const query = sanitizeKeyword(keyword);
  if (!query) {
    return [];
  }

  const searches = [
    searchGuardian(query),
    searchNYT(query),
    searchNewsAPI(query),
    searchBingNews(query),
    searchGDELT(query),
    searchReutersRSS(query),
    searchAPRSS(query),
    searchBBCRSS(query),
    searchReddit(query),
    searchHN(query),
  ];

  const results = await Promise.all(searches.map((promise) => promise.catch(() => [])));
  return dedupeArticles(results.flat());
};

export default {
  searchGuardian,
  searchNYT,
  searchNewsAPI,
  searchBingNews,
  searchGDELT,
  searchReutersRSS,
  searchAPRSS,
  searchBBCRSS,
  searchReddit,
  searchHN,
  searchAllSources,
};
