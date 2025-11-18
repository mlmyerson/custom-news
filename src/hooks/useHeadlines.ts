import { useCallback, useEffect, useState } from 'react';
import { fetchHeadlines, type Headline } from '../services/fetchHeadlines';

const PLACEHOLDER_VARIANTS = 3;

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

const applyBackgrounds = (headlines: Headline[]) =>
  headlines.map((headline, index) => {
    const providedImages = Array.isArray(headline.backgroundImages)
      ? headline.backgroundImages.filter(Boolean)
      : [];
    const legacySingle = headline.backgroundImage ? [headline.backgroundImage] : [];
    const placeholders = buildPlaceholderBackgrounds(headline, index);

    const merged = [...providedImages, ...legacySingle, ...placeholders];
    const uniqueImages = Array.from(new Set(merged)).slice(0, PLACEHOLDER_VARIANTS);

    return {
      ...headline,
      backgroundImages: uniqueImages,
    };
  });

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

  const loadHeadlines = useCallback(
    async (options?: { bypassCache?: boolean }) => {
      setLoading(true);
      try {
        const data = await fetchHeadlines(options);
        setHeadlines(applyBackgrounds(data));
        setError(undefined);
        setLastUpdated(new Date().toISOString());
      } catch (err) {
        console.error('[headlines] Failed to load aggregated feed', err);
        setError(err instanceof Error ? err.message : 'Unable to load headlines.');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadHeadlines();
  }, [loadHeadlines]);

  const refresh = useCallback(() => {
    loadHeadlines({ bypassCache: true });
  }, [loadHeadlines]);

  return { headlines, loading, error, lastUpdated, refresh };
};
