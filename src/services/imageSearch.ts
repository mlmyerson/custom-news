const OPENVERSE_ENDPOINT = 'https://api.openverse.engineering/v1/images/';
const DEFAULT_LICENSES = 'all';
const DEFAULT_FIELDS = ['url', 'thumbnail'];

const queryCache = new Map<string, Promise<string[]>>();

const buildRequestUrl = (query: string, limit: number) => {
  const search = new URLSearchParams({
    q: query,
    page_size: limit.toString(),
    license_type: DEFAULT_LICENSES,
    fields: DEFAULT_FIELDS.join(','),
  });

  return `${OPENVERSE_ENDPOINT}?${search.toString()}`;
};

const normalizeQuery = (value: string) => value.trim().toLowerCase();

const parseImageResults = (payload: unknown): string[] => {
  if (!payload || typeof payload !== 'object' || !('results' in payload)) {
    return [];
  }

  const { results } = payload as { results?: Array<{ url?: string | null; thumbnail?: string | null }> };
  if (!Array.isArray(results)) {
    return [];
  }

  return results
    .map((result) => result.url ?? result.thumbnail ?? null)
    .filter((url): url is string => typeof url === 'string' && !!url);
};

export const searchOpenverseImages = async (query: string, limit = 3): Promise<string[]> => {
  const normalized = normalizeQuery(query);
  if (!normalized || limit <= 0) {
    return [];
  }

  const cached = queryCache.get(normalized);
  if (cached) {
    return cached;
  }

  const request = fetch(buildRequestUrl(normalized, limit))
    .then(async (response) => {
      if (!response.ok) {
        console.warn('[images] Openverse request failed', response.status, normalized);
        return [];
      }

      const payload = await response.json();
      return parseImageResults(payload).slice(0, limit);
    })
    .catch((error) => {
      console.warn('[images] Openverse request errored', normalized, error);
      return [];
    });

  queryCache.set(normalized, request);
  return request;
};
