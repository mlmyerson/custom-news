import type { Headline } from './fetchHeadlines';

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

