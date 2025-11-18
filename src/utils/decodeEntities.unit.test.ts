import { describe, expect, it } from 'vitest';
import { decodeEntities } from './decodeEntities';

describe('decodeEntities', () => {
  it('decodes named entities into their literal characters', () => {
    expect(decodeEntities('Farmers &amp; ranchers brace for season&rsquo;s storms')).toBe(
      'Farmers & ranchers brace for season’s storms',
    );
  });

  it('decodes numeric entities and leaves unknown values untouched', () => {
    expect(decodeEntities('Power demand hits &#8217;record&#8217; levels &unknown;')).toBe("Power demand hits ’record’ levels &unknown;");
  });

  it('returns an empty string for nullish input', () => {
    expect(decodeEntities(undefined)).toBe('');
    expect(decodeEntities(null)).toBe('');
  });
});
