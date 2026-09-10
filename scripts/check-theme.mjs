#!/usr/bin/env node
/**
 * Gate: one theme vocabulary, and every inline default agrees with it.
 *
 * A component may not import the theme — its brief is handed to an agent with
 * an empty directory — so each file declares the subset of tokens it uses and
 * inlines their house values. That is the only shape that is both standalone
 * and consistent, and it has an obvious failure mode: 96 copies that drift.
 *
 * So this checks the two things that make the copies safe:
 *
 *   1. Every token a file declares is in `src/theme.ts`, with that type. A file
 *      inventing `bgColor` or typing `series` as `string` is a fork of the
 *      vocabulary, and a fork means `THEMES.console` silently misses it.
 *   2. Every inline default equals the house value. If they drift, passing no
 *      theme stops meaning "the house look" and the library has no default.
 *
 * Run: node scripts/check-theme.mjs
 */
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {walkEffects, ROOT} from './lib/fs.mjs';
import {gate, rel} from './lib/gate.mjs';

const g = gate('check:theme');

/* ── the canonical vocabulary, read from src/theme.ts itself ─────────────── */

const themeSrc = readFileSync(join(ROOT, 'src', 'theme.ts'), 'utf8');

const typeBlock = themeSrc.match(/export type Theme = \{([\s\S]*?)\n\};/)?.[1];
if (!typeBlock) throw new Error('check:theme: src/theme.ts has no `export type Theme = {…}`');
const CANON_TYPE = new Map();
for (const m of typeBlock.matchAll(/^\s*readonly (\w+): ([^;]+);$/gm)) {
  CANON_TYPE.set(m[1], m[2].trim());
}

const houseBlock = themeSrc.match(/export const HOUSE: Theme = \{([\s\S]*?)\n\};/)?.[1];
if (!houseBlock) throw new Error('check:theme: src/theme.ts has no `export const HOUSE: Theme = {…}`');
const CANON_VALUE = new Map();
for (const m of houseBlock.matchAll(/^  (\w+): (.+),$/gm)) CANON_VALUE.set(m[1], m[2].trim());

if (CANON_TYPE.size < 10) throw new Error(`check:theme: only parsed ${CANON_TYPE.size} tokens from src/theme.ts`);

/* ── every effect ─────────────────────────────────────────────────────────── */

let themed = 0;
const unthemed = [];

for (const e of walkEffects()) {
  const src = readFileSync(e.tsxPath, 'utf8');
  const where = rel(e.tsxPath);

  const decl = src.match(/\ntype Theme = \{([\s\S]*?)\n\};/);
  if (!decl) { unthemed.push(e.id); continue; }
  themed++;

  const fields = [...decl[1].matchAll(/^  readonly (\w+): ([^;]+);$/gm)].map((m) => [m[1], m[2].trim()]);
  if (fields.length === 0) g.fail(where, `${e.id}: declares \`type Theme\` with no tokens in it`);

  for (const [name, type] of fields) {
    if (!CANON_TYPE.has(name)) {
      g.fail(where, `${e.id}: \`${name}\` is not a theme token`, [
        `src/theme.ts defines: ${[...CANON_TYPE.keys()].join(', ')}`,
        'A token that only one file knows about cannot be set by a theme.',
      ]);
      continue;
    }
    if (type !== CANON_TYPE.get(name)) {
      g.fail(where, `${e.id}: \`${name}\` is typed \`${type}\`, canon says \`${CANON_TYPE.get(name)}\``);
    }
  }

  // The inline default must BE the house value.
  const def = src.match(/\nconst THEME: Theme = \{([\s\S]*?)\n\};/);
  if (!def) {
    g.fail(where, `${e.id}: declares \`type Theme\` but has no \`const THEME: Theme = {…}\` default`, [
      'Without it the file is not standalone: nothing supplies the tokens when no theme is passed.',
    ]);
    continue;
  }
  const declared = new Set(fields.map(([n]) => n));
  const given = new Set();
  for (const m of def[1].matchAll(/^  (\w+): (.+),$/gm)) {
    const [, name, value] = m;
    given.add(name);
    if (!CANON_VALUE.has(name)) continue;
    // A font token defaults to the file's OWN loaded family, by design: that is
    // what keeps a pasted file rendering in the face it was written for.
    if (/^(display|text|mono|hand)$/.test(name)) {
      if (!/^(fontFamily|\w+)$/.test(value.trim())) {
        g.fail(where, `${e.id}: \`${name}\` should default to this file's loaded family, got \`${value}\``);
      }
      continue;
    }
    if (value !== CANON_VALUE.get(name)) {
      g.fail(where, `${e.id}: \`${name}\` defaults to \`${value}\`, house is \`${CANON_VALUE.get(name)}\``, [
        'Passing no theme has to mean the house look, or the library has no default.',
      ]);
    }
  }
  for (const name of declared) {
    if (!given.has(name)) g.fail(where, `${e.id}: \`${name}\` is on its Theme type but missing from THEME`);
  }

  if (!/\n  theme = THEME,/.test(src)) {
    g.fail(where, `${e.id}: has a Theme but never destructures \`theme = THEME\``, [
      'It has to be the FIRST destructured parameter — a default parameter may only',
      'read parameters declared before it.',
    ]);
  }
}

g.note(`${themed} of ${themed + unthemed.length} components take a theme.`);
if (unthemed.length) {
  g.note(`not themed: ${unthemed.join(', ')}`);
}

g.done(`${CANON_TYPE.size} tokens; every declared token and inline default matches src/theme.ts.`);
