import { decodeEntities } from '../utils/decodeEntities';

const DEFAULT_PROXY_TEMPLATE = 'https://api.allorigins.win/raw?url={url}';
const HEADLINE_PROXY_TEMPLATE = (import.meta.env.VITE_HEADLINES_PROXY_ORIGIN as string | undefined)?.trim();

const withProxy = (url: string) => {
  const template = HEADLINE_PROXY_TEMPLATE ?? DEFAULT_PROXY_TEMPLATE;
  if (!template) {
    return url;
  }

  if (template.includes('{url}')) {
    return template.replace('{url}', encodeURIComponent(url));
  }

  const normalizedProxy = template.endsWith('/') ? template : `${template}/`;
  return `${normalizedProxy}${url}`;
};

// don't return any mocking information anymore unless its for a test. No mocks should be shown on the live page

export type Headline = {
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  backgroundImage?: string;
  backgroundImages?: string[];
};

type HeadlineFetcher = () => Promise<Headline[]>;

type SourceConfig = {
  name: string;
  fetcher: HeadlineFetcher;
};

const stripHtml = (value: string | undefined) => {
  const stripped = value?.replace(/<[^>]+>/g, '').trim() ?? '';
  return stripped ? decodeEntities(stripped) : '';
};
const sanitizeText = (value: string | null | undefined, fallback = '') => {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return fallback;
  }

  return decodeEntities(trimmed);
};

const normalizeUrl = (value: string) => {
  try {
    const url = new URL(value);
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return value.trim();
  }
};

const dedupeHeadlines = (headlines: Headline[]): Headline[] => {
  const seen = new Set<string>();

  return headlines.filter((headline) => {
    const key = `${normalizeUrl(headline.url).toLowerCase()}|${headline.title.trim().toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const sortHeadlines = (headlines: Headline[]): Headline[] =>
  [...headlines].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

const parseDate = (value?: string | null) => {
  if (!value) {
    return new Date().toISOString();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
};

const fetchGuardianHeadlines: HeadlineFetcher = () =>
  parseRssFeed('https://www.theguardian.com/world/rss', 'The Guardian');

const fetchNytHeadlines: HeadlineFetcher = () =>
  parseRssFeed('https://rss.nytimes.com/services/xml/rss/nyt/World.xml', 'The New York Times');

const fetchApHeadlines: HeadlineFetcher = () =>
  parseRssFeed('https://apnews.com/apf-topnews?format=xml', 'Associated Press');

const fetchBbcHeadlines: HeadlineFetcher = () =>
  parseRssFeed('https://feeds.bbci.co.uk/news/world/rss.xml', 'BBC News');

const fetchPbsHeadlines: HeadlineFetcher = () =>
  parseRssFeed('https://www.pbs.org/newshour/feeds/rss/headlines', 'PBS NewsHour');

const fetchProPublicaHeadlines: HeadlineFetcher = () =>
  parseRssFeed('https://www.propublica.org/feeds/featured-stories', 'ProPublica');

const parseRssFeed = async (url: string, source: string): Promise<Headline[]> => {
  const response = await fetch(withProxy(url));
  if (!response.ok) {
    throw new Error(`${source} RSS responded with ${response.status}`);
  }

  const xmlText = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const items = Array.from(doc.querySelectorAll('item')).slice(0, 10);

  return items.map((item) => ({
    title: sanitizeText(item.querySelector('title')?.textContent, 'Untitled story'),
    summary: stripHtml(item.querySelector('description')?.textContent ?? ''),
    source,
    url: item.querySelector('link')?.textContent?.trim() ?? '#',
    publishedAt: parseDate(item.querySelector('pubDate')?.textContent),
  }));
};

const fetchNprHeadlines: HeadlineFetcher = () => parseRssFeed('https://feeds.npr.org/1001/rss.xml', 'NPR');
const fetchReutersHeadlines: HeadlineFetcher = () => parseRssFeed('https://www.reuters.com/world/rss', 'Reuters');

const SOURCE_FETCHERS: SourceConfig[] = [
  { name: 'Associated Press', fetcher: fetchApHeadlines },
  { name: 'BBC News', fetcher: fetchBbcHeadlines },
  { name: 'NPR', fetcher: fetchNprHeadlines },
  { name: 'PBS NewsHour', fetcher: fetchPbsHeadlines },
  { name: 'ProPublica', fetcher: fetchProPublicaHeadlines },
  { name: 'Reuters', fetcher: fetchReutersHeadlines },
  { name: 'The Guardian', fetcher: fetchGuardianHeadlines },
  { name: 'The New York Times', fetcher: fetchNytHeadlines },
];

export const HEADLINE_SOURCE_NAMES = SOURCE_FETCHERS.map((source) => source.name);

const CACHE_PREFIX = 'custom-news:headlines:';
const getCacheKey = () => `${CACHE_PREFIX}${new Date().toISOString().slice(0, 10)}`;

const readCache = (): Headline[] | null => {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return null;
  }

  try {
    const serialized = window.localStorage.getItem(getCacheKey());
    if (!serialized) {
      return null;
    }

    const parsed = JSON.parse(serialized);
    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn('[headlines] Failed to read cache', error);
    return null;
  }
};

const writeCache = (headlines: Headline[]) => {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return;
  }

  try {
    window.localStorage.setItem(getCacheKey(), JSON.stringify(headlines));
  } catch (error) {
    console.warn('[headlines] Failed to write cache', error);
  }
};

export const fetchHeadlines = async ({ bypassCache = false }: { bypassCache?: boolean } = {}) => {
  if (!bypassCache) {
    const cached = readCache();
    if (cached) {
      return cached;
    }
  }

  const results = await Promise.allSettled(SOURCE_FETCHERS.map((source) => source.fetcher()));
  const aggregated = results.flatMap((result, index) => {
    const source = SOURCE_FETCHERS[index];

    if (result.status === 'fulfilled') {
      return result.value;
    }

    console.warn(`[headlines] ${source.name} failed`, result.reason);
    return [];
  });

  const normalized = sortHeadlines(dedupeHeadlines(aggregated));

  if (normalized.length === 0) {
    console.warn('[headlines] No live sources returned data. Skipping cache write.');
    return [];
  }

  writeCache(normalized);
  return normalized;
};
