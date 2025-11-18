import { useCallback, useEffect, useRef, useState } from 'react';
import { searchAllSources } from '../../modules/newsSources';
import type { Article } from '../types/article';
import { decodeEntities } from '../utils/decodeEntities';

export type UseArticleSearchResult = {
  articles: Article[];
  loading: boolean;
  error?: string;
  refresh: () => void;
};

const cleanText = (value: unknown) => {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  return trimmed ? decodeEntities(trimmed) : '';
};

const mapToArticles = (items: any[]): Article[] =>
  items
    .filter((item) => typeof item === 'object' && item !== null && typeof item.url === 'string')
    .map((item) => ({
      title: cleanText(item.title) || item.url,
      url: item.url,
      source: cleanText(item.source) || 'Unknown',
      snippet: cleanText(item.snippet) || null,
      published_at: typeof item.published_at === 'string' ? item.published_at : null,
    }));

export const useArticleSearch = (topic: string | null): UseArticleSearchResult => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const activeTopicRef = useRef<string | null>(null);

  const runSearch = useCallback(async (keyword: string | null) => {
    if (!keyword) {
      activeTopicRef.current = null;
      setArticles([]);
      setError(undefined);
      setLoading(false);
      return;
    }

    activeTopicRef.current = keyword;
    setLoading(true);
    setError(undefined);

    try {
      const results = await searchAllSources(keyword);
      if (activeTopicRef.current !== keyword) {
        return;
      }

      setArticles(mapToArticles(results ?? []));
    } catch (err) {
      if (activeTopicRef.current !== keyword) {
        return;
      }

      console.error('[articles] Failed to search news sources', err);
      setArticles([]);
      setError('Unable to fetch articles right now.');
    } finally {
      if (activeTopicRef.current === keyword) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    runSearch(topic);
  }, [topic, runSearch]);

  const refresh = useCallback(() => {
    if (activeTopicRef.current) {
      runSearch(activeTopicRef.current);
    }
  }, [runSearch]);

  return { articles, loading, error, refresh };
};
