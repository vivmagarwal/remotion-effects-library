#!/usr/bin/env node
/**
 * Third codemod pass: put TEXT COLOUR in the theme.
 *
 * The first two passes themed prop defaults and the typeface. They deliberately
 * left literals in component bodies alone, because most body literals are not
 * tokens — a scrim's alpha, a gradient stop, a recreated product's palette.
 *
 * The CSS `color` property is the exception, and it is the one that decides
 * whether a light theme is usable. A dark-authored effect with `color:
 * '#ffffff'` in its body renders white type on `broadsheet`'s paper ground,
 * which is not a restyle, it is an unreadable card. Twelve of them did.
 *
 * Only `color:`, and only the six house neutrals, so every rewrite is provably
 * a text colour and provably maps to a token whose HOUSE value is what it
 * replaced — nothing changes until a theme is passed.
 *
 * `theme` is not in scope in every one of those places: plenty of files draw
 * text from a module-scope sub-component. Those revert wholesale rather than
 * get half-edited, and are reported.
 *
 * Run: node scripts/apply-theme-ink.mjs [--dry]
 */
import {readFileSync, writeFileSync} from 'node:fs';
import {execSync} from 'node:child_process';
import {walkEffects} from './lib/fs.mjs';

const DRY = process.argv.includes('--dry');

/** Every one of these is the value HOUSE holds for that token. */
const INK = {
  '#ffffff': 'ink',
  '#eef1f7': 'body',
  '#8d93a5': 'muted',
  '#f6f5f2': 'ink',
  '#1d1b17': 'paperInk',
  '#4a4e5a': 'paperMuted',
};
const HOUSE_VALUE = {
  ink: "'#ffffff'", body: "'#eef1f7'", muted: "'#8d93a5'",
  paperInk: "'#1d1b17'", paperMuted: "'#4a4e5a'",
};

const originals = new Map();
let touched = 0;
const skipped = [];

for (const e of walkEffects()) {
  const src = readFileSync(e.tsxPath, 'utf8');
  if (!/\ntype Theme = \{/.test(src)) { skipped.push([e.id, 'has no Theme block']); continue; }

  const needed = new Set();
  const next = src.replace(/\bcolor: '(#[0-9a-fA-F]{6})'/g, (whole, hex) => {
    const tok = INK[hex.toLowerCase()];
    if (!tok) return whole;
    needed.add(tok);
    return `color: theme.${tok}`;
  });
  if (needed.size === 0) continue;

  let out = next;
  const themeBlock = out.match(/\ntype Theme = \{([\s\S]*?)\n\};/)?.[1] ?? '';
  for (const tok of needed) {
    if (new RegExp(`^  readonly ${tok}: `, 'm').test(themeBlock)) continue;
    out = out.replace(/\ntype Theme = \{\n/, () => `\ntype Theme = {\n  readonly ${tok}: string;\n`);
    out = out.replace(/\nconst THEME: Theme = \{\n/, () => `\nconst THEME: Theme = {\n  ${tok}: ${HOUSE_VALUE[tok]},\n`);
  }

  originals.set(e.tsxPath, src);
  if (!DRY) writeFileSync(e.tsxPath, out);
  touched++;
}

console.log(`apply-theme-ink: rewrote text colour in ${touched} component(s)`);
if (DRY) process.exit(0);

// Revert whatever put `theme` somewhere it does not exist.
let reverted = [];
for (let round = 0; round < 3; round++) {
  let errs = '';
  try {
    execSync('npx tsc --noEmit', {stdio: 'pipe'});
  } catch (err) {
    errs = String(err.stdout ?? '');
  }
  if (!errs.trim()) break;
  const broken = new Set(
    errs.split('\n')
      .filter((l) => /error TS(2304|2552).*'theme'/.test(l))
      .map((l) => l.split('(')[0]),
  );
  if (broken.size === 0) break;
  for (const f of broken) {
    if (!originals.has(f)) continue;
    writeFileSync(f, originals.get(f));
    reverted.push(f.split('/').slice(-1)[0]);
  }
}

console.log(`  kept ${touched - reverted.length}; reverted ${reverted.length} where \`theme\` is not in scope:`);
for (const f of reverted) console.log(`    ${f}`);
