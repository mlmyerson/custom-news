import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchHeadlines, type Headline } from '../services/fetchHeadlines';
import { extractHeadlineKeyphrases } from '../services/extractKeywords';
import { searchOpenverseImages } from '../services/imageSearch';

const PLACEHOLDER_VARIANTS = 3;
const KEYWORD_IMAGE_LIMIT = 3;
const MAX_IMAGES_PER_HEADLINE = 3;

const buildPlaceholderBackgrounds = (headline: Headline, index: number) => {
  const seedSource = headline.url || headline.title || `tile-${index}`;
  const normalizedSeed = seedSource
    .toString()
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()
    .slice(0, 32);

  const seed = normalizedSeed || `tile-${index}`;
  return Array.from({ length: PLACEHOLDER_VARIANTS }, (_, variant) =>
    `https://picsum.photos/seed/${encodeURIComponent(`${seed}-${variant}`)}/900/900`,
  );
};

const applyPlaceholderBackgrounds = (headlines: Headline[]) =>
  headlines.map((headline, index) => {
    // Skip processing if backgroundImages are already populated with multiple images
    if (Array.isArray(headline.backgroundImages) && headline.backgroundImages.length >= MAX_IMAGES_PER_HEADLINE) {
      return headline;
    }

    const providedImages = Array.isArray(headline.backgroundImages)
      ? headline.backgroundImages.filter(Boolean)
      : [];
    const legacySingle = headline.backgroundImage ? [headline.backgroundImage] : [];
    const placeholders = buildPlaceholderBackgrounds(headline, index);
    const merged = [...providedImages, ...legacySingle, ...placeholders];

    return {
      ...headline,
      backgroundImages: Array.from(new Set(merged)).slice(0, MAX_IMAGES_PER_HEADLINE),
    };
  });

const fetchKeywordImagesForHeadline = async (headline: Headline): Promise<string[]> => {
  const phrases = extractHeadlineKeyphrases(headline, KEYWORD_IMAGE_LIMIT);
  if (!phrases.length) {
    return [];
  }

  const collected: string[] = [];
  for (const phrase of phrases) {
    try {
      const urls = await searchOpenverseImages(phrase, MAX_IMAGES_PER_HEADLINE);
      collected.push(...urls);
    } catch (error) {
      console.warn('[images] Failed to fetch phrase images', phrase, error);
    }

    if (collected.length >= MAX_IMAGES_PER_HEADLINE) {
      break;
    }
  }

  return Array.from(new Set(collected)).slice(0, MAX_IMAGES_PER_HEADLINE);
};

export type UseHeadlinesResult = {
  headlines: Headline[];
  loading: boolean;
  error?: string;
  lastUpdated?: string;
  refresh: () => void;
};

export const useHeadlines = (): UseHeadlinesResult => {
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [lastUpdated, setLastUpdated] = useState<string | undefined>();
  const hydrationRun = useRef(0);

  const hydrateKeywordImages = useCallback(
    async (sourceHeadlines: Headline[]) => {
      if (!sourceHeadlines.length) {
        return;
      }

      const runId = ++hydrationRun.current;
      const updates = await Promise.all(
        sourceHeadlines.map(async (headline) => {
          const urls = await fetchKeywordImagesForHeadline(headline);
          return { key: headline.url, urls };
        }),
      );

      if (hydrationRun.current !== runId) {
        return;
      }

      const updateMap = new Map(updates.filter((entry) => entry.urls.length).map((entry) => [entry.key, entry.urls]));
      if (!updateMap.size) {
        return;
      }

      setHeadlines((current) => {
        let changed = false;
        const next = current.map((headline) => {
          const urls = updateMap.get(headline.url);
          if (!urls) {
            return headline;
          }

          const existing = Array.isArray(headline.backgroundImages) ? headline.backgroundImages : [];
          const merged = Array.from(new Set([...urls, ...existing])).slice(0, MAX_IMAGES_PER_HEADLINE);
          if (merged.length === existing.length && merged.every((value, idx) => value === existing[idx])) {
            return headline;
          }

          changed = true;
          return {
            ...headline,
            backgroundImages: merged,
          };
        });

        return changed ? next : current;
      });
    },
    [],
  );

  const loadHeadlines = useCallback(
    async (options?: { bypassCache?: boolean }) => {
      setLoading(true);
      try {
        const data = await fetchHeadlines(options);
        const withPlaceholders = applyPlaceholderBackgrounds(data);
        setHeadlines(withPlaceholders);
        hydrateKeywordImages(withPlaceholders);
        setError(undefined);
        setLastUpdated(new Date().toISOString());
      } catch (err) {
        console.error('[headlines] Failed to load aggregated feed', err);
        setError(err instanceof Error ? err.message : 'Unable to load headlines.');
      } finally {
        setLoading(false);
      }
    },
    [hydrateKeywordImages],
  );

  useEffect(() => {
    loadHeadlines();
  }, [loadHeadlines]);

  const refresh = useCallback(() => {
    loadHeadlines({ bypassCache: true });
  }, [loadHeadlines]);

  return { headlines, loading, error, lastUpdated, refresh };
};
