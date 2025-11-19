import type { Headline } from './fetchHeadlines';

export type KeywordBubble = {
  phrase: string;
  label: string;
  mentions: number;
  normalizedWeight: number;
  scale: number;
  colors: {
    start: string;
    end: string;
  };
  sampleHeadline?: Headline;
};

type PhraseStats = {
  mentions: number;
  tokenCount: number;
  sampleHeadline?: Headline;
};

const STOP_WORDS = new Set([
  'a',
  'about',
  'after',
  'against',
  'all',
  'along',
  'also',
  'an',
  'and',
  'are',
  'at',
  'be',
  'been',
  'being',
  'but',
  'by',
  'can',
  'could',
  'did',
  'do',
  'does',
  'during',
  'each',
  'for',
  'from',
  'had',
  'has',
  'have',
  'he',
  'her',
  'his',
  'how',
  'in',
  'into',
  'is',
  'it',
  'its',
  'made',
  'make',
  'may',
  'more',
  'most',
  'much',
  'near',
  'new',
  'now',
  'of',
  'off',
  'on',
  'onto',
  'or',
  'out',
  'over',
  'per',
  'says',
  'she',
  'should',
  'so',
  'than',
  'that',
  'the',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'through',
  'to',
  'under',
  'up',
  'was',
  'were',
  'what',
  'when',
  'where',
  'which',
  'who',
  'will',
  'with',
  'would',
]);

const ALLOWED_SHORT_TOKENS = new Set(['ai', 'nato', 'who', 'g7', 'g20']);
const STANDALONE_SHORT_BLOCKLIST = new Set(['us', 'uk', 'eu']);
const JUNK_TERMS = new Set(['breaking news', 'live updates', 'top stories', 'morning briefing']);
const MAX_PHRASE_TOKENS = 3;
const MAX_OUTPUT = 40;
const MIN_SCALE = 0.7;
const MAX_SCALE = 1.6;

const sanitize = (value: string) =>
  value
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/[“”‘’]/g, '')
    .replace(/[^a-z0-9\s-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const shouldKeepToken = (token: string) => {
  if (!token) {
    return false;
  }

  if (STOP_WORDS.has(token)) {
    return false;
  }

  if (token.length < 3 && !ALLOWED_SHORT_TOKENS.has(token)) {
    return false;
  }

  if (/^\d+$/.test(token)) {
    return false;
  }

  return true;
};

const tokenize = (text: string) => sanitize(text).split(' ').filter(shouldKeepToken);

const isJunkPhrase = (phrase: string, tokenCount: number) => {
  if (!phrase || JUNK_TERMS.has(phrase)) {
    return true;
  }

  if (phrase.length < 3 && !ALLOWED_SHORT_TOKENS.has(phrase)) {
    return true;
  }

  if (tokenCount === 1 && STANDALONE_SHORT_BLOCKLIST.has(phrase)) {
    return true;
  }

  return false;
};

const toDisplayToken = (token: string): string => {
  if (!token) {
    return token;
  }

  if (token.includes('-')) {
    return token
      .split('-')
      .map((segment) => toDisplayToken(segment))
      .join('-');
  }

  if (token.length <= 3) {
    return token.toUpperCase();
  }

  return token.charAt(0).toUpperCase() + token.slice(1);
};

const toTitleCase = (phrase: string) => phrase.split(' ').map(toDisplayToken).join(' ');

const hashPhrase = (phrase: string) => {
  let hash = 0;
  for (let i = 0; i < phrase.length; i += 1) {
    hash = (hash << 5) - hash + phrase.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const buildPalette = (phrase: string) => {
  const hue = hashPhrase(phrase) % 360;
  return {
    start: `hsl(${hue} 85% 92%)`,
    end: `hsl(${hue} 70% 58%)`,
  };
};

const registerPhrase = (map: Map<string, PhraseStats>, phrase: string, tokenCount: number, headline: Headline) => {
  const existing = map.get(phrase);
  if (existing) {
    existing.mentions += 1;
    map.set(phrase, existing);
    return;
  }

  map.set(phrase, {
    mentions: 1,
    tokenCount,
    sampleHeadline: headline,
  });
};

const buildCandidatePhrases = (tokens: string[]) => {
  const phrases: string[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    for (let size = 1; size <= MAX_PHRASE_TOKENS; size += 1) {
      const slice = tokens.slice(i, i + size);
      if (slice.length !== size) {
        continue;
      }
      const phrase = slice.join(' ');
      if (isJunkPhrase(phrase, slice.length)) {
        continue;
      }
      phrases.push(phrase);
    }
  }
  return phrases;
};

const rankKeywords = (map: Map<string, PhraseStats>) => {
  const entries = Array.from(map.entries()).map(([phrase, stats]) => ({
    phrase,
    tokenCount: stats.tokenCount,
    mentions: stats.mentions,
    sampleHeadline: stats.sampleHeadline,
    score: stats.mentions + stats.tokenCount * 0.35,
  }));

  entries.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.mentions !== a.mentions) {
      return b.mentions - a.mentions;
    }
    return b.phrase.length - a.phrase.length;
  });

  return entries.slice(0, MAX_OUTPUT);
};

const decorateKeywords = (entries: ReturnType<typeof rankKeywords>): KeywordBubble[] => {
  if (entries.length === 0) {
    return [];
  }

  const maxMentions = entries[0].mentions;

  return entries.map((entry) => {
    const normalized = maxMentions === 0 ? 0 : entry.mentions / maxMentions;
    const scale = MIN_SCALE + normalized * (MAX_SCALE - MIN_SCALE);

    return {
      phrase: entry.phrase,
      label: toTitleCase(entry.phrase),
      mentions: entry.mentions,
      normalizedWeight: normalized,
      scale: Number(scale.toFixed(2)),
      colors: buildPalette(entry.phrase),
      sampleHeadline: entry.sampleHeadline,
    };
  });
};

export const extractHeadlineKeyphrases = (headline: Headline, maxPhrases = 3): string[] => {
  if (!headline || maxPhrases <= 0) {
    return [];
  }

  const content = `${headline.title ?? ''} ${headline.summary ?? ''}`.trim();
  if (!content) {
    return [];
  }

  const tokens = tokenize(content);
  if (!tokens.length) {
    return [];
  }

  const phrases = buildCandidatePhrases(tokens);
  if (!phrases.length) {
    return [];
  }

  const counts = new Map<string, number>();
  phrases.forEach((phrase) => counts.set(phrase, (counts.get(phrase) ?? 0) + 1));

  const ranked = Array.from(counts.entries()).sort((a, b) => {
    if (b[1] !== a[1]) {
      return b[1] - a[1];
    }

    const tokenDiff = b[0].split(' ').length - a[0].split(' ').length;
    if (tokenDiff !== 0) {
      return tokenDiff;
    }

    return b[0].length - a[0].length;
  });

  return ranked.slice(0, maxPhrases).map(([phrase]) => toTitleCase(phrase));
};

export const extractKeywordBubbles = (headlines: Headline[]): KeywordBubble[] => {
  if (!headlines.length) {
    return [];
  }

  const map = new Map<string, PhraseStats>();

  headlines.forEach((headline) => {
    const content = `${headline.title}. ${headline.summary}`;
    const tokens = tokenize(content);
    if (!tokens.length) {
      return;
    }

    const phrases = Array.from(new Set(buildCandidatePhrases(tokens)));
    phrases.forEach((phrase) => registerPhrase(map, phrase, phrase.split(' ').length, headline));
  });

  const ranked = rankKeywords(map);
  return decorateKeywords(ranked);
};
