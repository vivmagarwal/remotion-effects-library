/**
 * ONE meta.ts reader.
 *
 * Four scripts used to parse meta.ts with their own ad-hoc regexes, and the
 * emitter's `pick('id')` was `/\bid:\s*'([^']*)'/` — which matches the FIRST
 * `id:` anywhere in the file, prose included. One description mentioning `id:`
 * and the build silently produced the wrong prompt filename.
 *
 * This reader is anchored: it finds `export const meta`, takes the balanced
 * object literal that follows, and only reads keys at the TOP LEVEL of that
 * literal. Nested objects (`credit`) and long prose are inert.
 */
import {readFileSync} from 'node:fs';
import {splitTopLevel} from '../../src/prompt-kit/compose.mjs';

const NUMBER_KEYS = new Set(['width', 'height', 'fps', 'durationInFrames', 'checkFrame', 'posterFrame']);
const LIST_KEYS = new Set(['tags', 'packages', 'concepts', 'requires', 'audience']);

const unquote = (s) => {
  const q = s[0];
  if (q !== "'" && q !== '"' && q !== '`') return undefined;
  let out = '';
  for (let i = 1; i < s.length; i++) {
    const ch = s[i];
    if (ch === '\\') {
      const n = s[++i];
      out += n === 'n' ? '\n' : n === 't' ? '\t' : (n ?? '');
      continue;
    }
    if (ch === q) return i === s.length - 1 ? out : undefined; // a bare literal, not an expression
    out += ch;
  }
  return undefined;
};

const parseValue = (raw) => {
  const s = raw.trim();
  if (!s) return undefined;
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  const str = unquote(s);
  if (str !== undefined) return str;
  if (s.startsWith('[') && s.endsWith(']')) {
    return splitTopLevel(s.slice(1, -1)).map(parseValue).filter((v) => v !== undefined);
  }
  if (s.startsWith('{') && s.endsWith('}')) {
    const obj = {};
    for (const [k, v] of entriesOf(s.slice(1, -1))) obj[k] = parseValue(v);
    return obj;
  }
  return {raw: s}; // an identifier or expression — kept so callers can see it, never mistaken for a literal
};

const KEY_RE = /^\s*(?:readonly\s+)?(['"]?)([A-Za-z_$][\w$-]*)\1\s*:\s*([\s\S]*)$/;

function* entriesOf(body) {
  for (const part of splitTopLevel(body)) {
    const m = part.match(KEY_RE);
    if (m) yield [m[2], m[3]];
  }
}

/** The balanced `{…}` that follows `export const meta`. Quote-aware. */
const metaLiteral = (source) => {
  const anchor = source.match(/export\s+const\s+meta\b[^=]*=\s*\{/);
  if (!anchor) return null;
  const open = anchor.index + anchor[0].length - 1;
  let depth = 0;
  let quote = null;
  for (let i = open; i < source.length; i++) {
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
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return {body: source.slice(open + 1, i), open};
    }
  }
  return null;
};

const lineOf = (source, index) => source.slice(0, index).split('\n').length;

/**
 * Parse a meta.ts source string.
 *
 * @returns the EffectMeta fields, plus `keyLines` ({key: 1-based line}) so a
 *          gate can point at the exact line it is complaining about.
 */
export const parseMeta = (source, label = 'meta.ts') => {
  const lit = metaLiteral(source);
  if (!lit) throw new Error(`${label}: no \`export const meta = {…}\` found`);

  const out = {};
  const keyLines = {};
  for (const [key, rawValue] of entriesOf(lit.body)) {
    const v = parseValue(rawValue);
    if (NUMBER_KEYS.has(key)) out[key] = typeof v === 'number' ? v : Number.NaN;
    else if (LIST_KEYS.has(key)) out[key] = Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
    else out[key] = v;
    // Locate the key for error messages. meta.ts packs several fields onto one
    // line (`difficulty: 'starter', checkFrame: 96`), so anchor on a line start,
    // an opening brace or a comma — not on a line start alone.
    const m = new RegExp(`(^|[\\n,{])\\s*${key}\\s*:`).exec(lit.body);
    keyLines[key] = m
      ? lineOf(source, lit.open + 1 + m.index + m[0].indexOf(key))
      : lineOf(source, lit.open);
  }

  for (const k of LIST_KEYS) if (!(k in out)) out[k] = [];
  out.keyLines = keyLines;
  return out;
};

/** Read and parse one meta.ts. */
export const readMeta = (metaPath) => parseMeta(readFileSync(metaPath, 'utf8'), metaPath);
