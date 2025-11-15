import { useCallback, useEffect, useState } from 'react';
import { fetchHeadlines, type Headline } from '../services/fetchHeadlines';

export type UseHeadlinesResult = {
  headlines: Headline[];
  loading: boolean;
  error?: string;
  refresh: () => void;
};

export const useHeadlines = (): UseHeadlinesResult => {
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const loadHeadlines = useCallback(
    async (options?: { bypassCache?: boolean }) => {
      setLoading(true);
      try {
        const data = await fetchHeadlines(options);
        setHeadlines(data);
        setError(undefined);
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

  return { headlines, loading, error, refresh };
};
