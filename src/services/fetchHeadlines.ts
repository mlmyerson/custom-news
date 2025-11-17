const GUARDIAN_API_KEY = import.meta.env.VITE_GUARDIAN_API_KEY as string | undefined;
const NYT_API_KEY = import.meta.env.VITE_NYT_API_KEY as string | undefined;

// don't return any mocking information anymore unless its for a test. No mocks should be shown on the live page

export type Headline = {
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
};

type HeadlineFetcher = () => Promise<Headline[]>;

type SourceConfig = {
  name: string;
  fetcher: HeadlineFetcher;
};

const stripHtml = (value: string | undefined) => value?.replace(/<[^>]+>/g, '').trim() ?? '';

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

const fetchGuardianHeadlines: HeadlineFetcher = async () => {
  if (!GUARDIAN_API_KEY) {
    throw new Error('Missing VITE_GUARDIAN_API_KEY');
  }

  const params = new URLSearchParams({
    'api-key': GUARDIAN_API_KEY,
    'page-size': '12',
    'order-by': 'newest',
    'show-fields': 'trailText',
    section: 'world',
  });

  const response = await fetch(`https://content.guardianapis.com/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Guardian API responded with ${response.status}`);
  }

  const payload = await response.json();
  const results = payload?.response?.results ?? [];

  return results.map((item: any) => ({
    title: item.webTitle,
    summary: stripHtml(item.fields?.trailText ?? ''),
    source: 'The Guardian',
    url: item.webUrl,
    publishedAt: parseDate(item.webPublicationDate),
  }));
};

const fetchNytHeadlines: HeadlineFetcher = async () => {
  if (!NYT_API_KEY) {
    throw new Error('Missing VITE_NYT_API_KEY');
  }

  const params = new URLSearchParams({ 'api-key': NYT_API_KEY });
  const response = await fetch(`https://api.nytimes.com/svc/topstories/v2/home.json?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`NYT API responded with ${response.status}`);
  }

  const payload = await response.json();
  const results = payload?.results ?? [];

  return results.map((item: any) => ({
    title: item.title,
    summary: item.abstract,
    source: 'The New York Times',
    url: item.url,
    publishedAt: parseDate(item.published_date),
  }));
};

const parseRssFeed = async (url: string, source: string): Promise<Headline[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${source} RSS responded with ${response.status}`);
  }

  const xmlText = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const items = Array.from(doc.querySelectorAll('item')).slice(0, 10);

  return items.map((item) => ({
    title: item.querySelector('title')?.textContent?.trim() ?? 'Untitled story',
    summary: stripHtml(item.querySelector('description')?.textContent ?? ''),
    source,
    url: item.querySelector('link')?.textContent?.trim() ?? '#',
    publishedAt: parseDate(item.querySelector('pubDate')?.textContent),
  }));
};

const fetchNprHeadlines: HeadlineFetcher = () => parseRssFeed('https://feeds.npr.org/1001/rss.xml', 'NPR');
const fetchReutersHeadlines: HeadlineFetcher = () =>
  parseRssFeed('https://www.reutersagency.com/feed/?best-topics=business-and-finance', 'Reuters');

const SOURCE_FETCHERS: SourceConfig[] = [
  { name: 'The Guardian', fetcher: fetchGuardianHeadlines },
  { name: 'The New York Times', fetcher: fetchNytHeadlines },
  { name: 'NPR', fetcher: fetchNprHeadlines },
  { name: 'Reuters', fetcher: fetchReutersHeadlines },
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
