const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  lt: '<',
  gt: '>',
  nbsp: ' ',
  quot: '"',
  rsquo: "'",
  lsquo: "'",
  ldquo: '"',
  rdquo: '"',
  hellip: '…',
};

const ENTITY_PATTERN = /&(#\d+|#x[0-9a-f]+|[a-z]+);/gi;

const decodeEntity = (entity: string) => {
  if (entity.startsWith('#x') || entity.startsWith('#X')) {
    const codePoint = Number.parseInt(entity.slice(2), 16);
    return Number.isNaN(codePoint) ? `&${entity};` : String.fromCodePoint(codePoint);
  }

  if (entity.startsWith('#')) {
    const codePoint = Number.parseInt(entity.slice(1), 10);
    return Number.isNaN(codePoint) ? `&${entity};` : String.fromCodePoint(codePoint);
  }

  const normalized = entity.toLowerCase();
  return NAMED_ENTITIES[normalized] ?? `&${entity};`;
};

let textarea: HTMLTextAreaElement | null = null;

export const decodeEntities = (value: string | null | undefined): string => {
  if (!value) {
    return '';
  }

  const input = `${value}`;

  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    textarea = textarea ?? window.document.createElement('textarea');
    textarea.innerHTML = input;
    return textarea.value;
  }

  return input.replace(ENTITY_PATTERN, (_, entity: string) => decodeEntity(entity));
};
