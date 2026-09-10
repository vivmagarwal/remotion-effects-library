/**
 * Tiny readers for the handful of plain-data TypeScript files the gates have to
 * agree with — `src/types.ts`, `src/tags.ts`, `src/gallery/categories.ts`.
 *
 * Deliberately not a parser: each of these files is a literal by convention, and
 * a gate that needs a TS loader is a gate nobody runs.
 */

/** The balanced literal that follows `open` at `from`, quote-aware. */
const balanced = (source, from, open, close) => {
  let depth = 0;
  let quote = null;
  for (let i = from; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return source.slice(from + 1, i);
    }
  }
  return null;
};

/** `export const NAME = [...]` → the string literals inside, in order. */
export const stringArrayExport = (source, name) => {
  const m = source.match(new RegExp(`export\\s+const\\s+${name}\\b[^=]*=\\s*(?:\\w+\\s*<[^>]*>\\s*)?\\[`));
  if (!m) return null;
  const body = balanced(source, m.index + m[0].length - 1, '[', ']');
  if (body === null) return null;
  return [...body.matchAll(/'([^']*)'|"([^"]*)"/g)].map((x) => x[1] ?? x[2]);
};

/** `export const NAME: Record<…> = {a: 'A', …}` → the keys, in order. */
export const objectKeysExport = (source, name) => {
  const m = source.match(new RegExp(`export\\s+const\\s+${name}\\b[^=]*=\\s*\\{`));
  if (!m) return null;
  const body = balanced(source, m.index + m[0].length - 1, '{', '}');
  if (body === null) return null;
  return [...body.matchAll(/(?:^|\n)\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z_$][\w$]*))\s*:/g)].map(
    (x) => x[1] ?? x[2] ?? x[3],
  );
};

/** `export type Name = 'a' | 'b' | …` → the members, in order. */
export const unionMembers = (source, typeName) => {
  const m = source.match(new RegExp(`export\\s+type\\s+${typeName}\\s*=([\\s\\S]*?);`));
  if (!m) return null;
  return [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]);
};
