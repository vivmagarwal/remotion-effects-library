#!/usr/bin/env node
/**
 * Gate: identity and shape of every meta.ts.
 *
 *   - tagline is 42–79 characters and ends in a full stop
 *   - id is kebab-case, unique, equals the folder name and equals
 *     kebab-case(componentName)
 *   - checkFrame is inside the composition and is not the settled end state
 *   - the required numeric fields are actually numbers
 *
 * `meta.id` keys `out/prompts/<id>.md` while `check-prompt-defaults` used to read
 * `out/prompts/<folder>.md` — rename one without the other and the gate died
 * with an uncaught ENOENT instead of a message.
 */
import {readFileSync} from 'node:fs';
import {walkEffects} from './lib/fs.mjs';
import {readMeta} from './lib/meta.mjs';
import {gate, rel} from './lib/gate.mjs';

const g = gate('check:meta');

/**
 * Every top-level key in `export const meta = {…}`, found INDEPENDENTLY of the
 * reader in `lib/meta.mjs`.
 *
 * This exists because a key can vanish silently. `splitTopLevel` splits on
 * commas, and a `// why this number` comment above a key contains commas — so
 * the key ended up in a fragment that no longer looked like `key: value`, was
 * dropped, and `video-in-text` rendered its gallery card at `checkFrame`
 * despite a `posterFrame: 80` sitting in the file. Nothing failed. The card was
 * just wrong.
 *
 * Two parsers that disagree is a bug; one parser that quietly loses input is
 * not detectable at all. So this one is deliberately written a different way.
 */
const keysInSource = (source) => {
  const anchor = source.match(/export\s+const\s+meta\b[^=]*=\s*\{/);
  if (!anchor) return [];
  const open = anchor.index + anchor[0].length - 1;
  const keys = [];
  let depth = 0;
  let quote = null;
  let atKeyPosition = true;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      atKeyPosition = false;
      continue;
    }
    if (ch === '/' && source[i + 1] === '/') {
      const nl = source.indexOf('\n', i);
      i = nl === -1 ? source.length : nl - 1;
      continue;
    }
    if (ch === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end === -1 ? source.length : end + 1;
      continue;
    }
    if (ch === '{' || ch === '[' || ch === '(') {
      depth++;
      atKeyPosition = ch === '{';
      continue;
    }
    if (ch === '}' || ch === ']' || ch === ')') {
      depth--;
      if (depth === 0) break;
      atKeyPosition = false;
      continue;
    }
    if (ch === ',' && depth === 1) {
      atKeyPosition = true;
      continue;
    }
    if (/\s/.test(ch)) continue;
    if (depth === 1 && atKeyPosition) {
      const m = /^([A-Za-z_$][\w$]*)\s*:/.exec(source.slice(i));
      if (m) keys.push(m[1]);
      atKeyPosition = false;
    }
  }
  return keys;
};

const TAGLINE_MIN = 42;
const TAGLINE_MAX = 79;

/** GlitchText → glitch-text · ChatGptFullUi → chat-gpt-full-ui */
export const kebab = (name) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();

const seenIds = new Map();
const seenNames = new Map();
let checked = 0;

for (const e of walkEffects()) {
  const meta = readMeta(e.metaPath);
  const at = (key) => `${rel(e.metaPath)}:${meta.keyLines[key] ?? 0}`;
  checked++;

  if (typeof meta.id !== 'string' || !meta.id) {
    g.fail(at('id'), 'meta.id is missing or is not a string literal');
    continue;
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(meta.id)) g.fail(at('id'), `id '${meta.id}' is not kebab-case`);
  if (meta.id !== e.id) g.fail(at('id'), `id '${meta.id}' ≠ folder name '${e.id}' — out/prompts/<id>.md and the folder must agree`);
  if (meta.id !== kebab(e.componentName)) {
    g.fail(at('id'), `id '${meta.id}' ≠ kebab-case(${e.componentName}) = '${kebab(e.componentName)}'`);
  }

  if (seenIds.has(meta.id)) g.fail(at('id'), `duplicate id '${meta.id}'`, `also ${seenIds.get(meta.id)}`);
  else seenIds.set(meta.id, e.file);

  if (typeof meta.name === 'string') {
    if (seenNames.has(meta.name)) g.fail(at('name'), `duplicate name '${meta.name}'`, `also ${seenNames.get(meta.name)}`);
    else seenNames.set(meta.name, e.file);
  } else {
    g.fail(at('name'), 'meta.name is missing or is not a string literal');
  }

  const tagline = meta.tagline;
  if (typeof tagline !== 'string') {
    g.fail(at('tagline'), 'meta.tagline is missing or is not a string literal');
  } else {
    if (tagline.length < TAGLINE_MIN || tagline.length > TAGLINE_MAX) {
      g.fail(at('tagline'), `tagline is ${tagline.length} chars, must be ${TAGLINE_MIN}–${TAGLINE_MAX}`, `"${tagline}"`);
    }
    if (!tagline.endsWith('.')) g.fail(at('tagline'), 'tagline does not end in a full stop', `"${tagline}"`);
  }

  for (const k of ['width', 'height', 'fps', 'durationInFrames', 'checkFrame']) {
    if (!Number.isFinite(meta[k])) g.fail(at(k), `meta.${k} is missing or is not a number literal`);
  }

  if (Number.isFinite(meta.checkFrame) && Number.isFinite(meta.durationInFrames)) {
    if (meta.checkFrame <= 0 || meta.checkFrame >= meta.durationInFrames) {
      g.fail(at('checkFrame'), `checkFrame ${meta.checkFrame} is outside 1..${meta.durationInFrames - 1}`);
    }
    if (meta.posterFrame !== undefined) {
      if (!Number.isFinite(meta.posterFrame) || meta.posterFrame < 0 || meta.posterFrame >= meta.durationInFrames) {
        g.fail(at('posterFrame'), `posterFrame ${meta.posterFrame} is outside 0..${meta.durationInFrames - 1}`);
      }
    }
  }

  // Every key the file writes must have survived the read.
  const written = keysInSource(readFileSync(e.metaPath, 'utf8'));
  const lost = written.filter((k) => !(k in meta));
  if (lost.length) {
    g.fail(rel(e.metaPath), `${lost.length} key(s) written in meta.ts never reached the registry`, [
      lost.join(', '),
      'The reader dropped them. A comment above a key used to do this, because the',
      'comment\'s own commas split the entry the key belonged to — and the effect then',
      'silently used the default instead of the value sitting in the file.',
    ]);
  }

  if (!meta.packages.includes('remotion')) {
    g.fail(at('packages'), "meta.packages must include 'remotion' — it feeds every install line in the prompt");
  }
}

g.done(`${checked} meta.ts files — ids, taglines and frames all sound.`);
