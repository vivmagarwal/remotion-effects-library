#!/usr/bin/env node
/**
 * One-shot codemod: give every effect a `theme` prop.
 *
 * Rewrites only the DEFAULTS in the component's destructuring block — the
 * configurable surface — and never literals in the body, which `check:palette`
 * already governs and which are frequently not tokens at all (a scrim's alpha,
 * a gradient stop, a brand recreation).
 *
 * The mapping is chosen so that under the HOUSE theme every value is byte
 * identical to what it replaced: `series` is ordered so `series[2]` IS the lime
 * an effect was already using. Nothing should look different until a different
 * theme is passed, and that is the property that makes this reviewable — any
 * poster that moves is a bug in the codemod, not a design decision.
 *
 * Run: node scripts/apply-theme.mjs [--dry]
 */
import {readFileSync, writeFileSync} from 'node:fs';
import {walkEffects} from './lib/fs.mjs';
import {PROPS_BLOCK_RE} from '../src/prompt-kit/compose.mjs';

const DRY = process.argv.includes('--dry');

/**
 * literal → token. Every entry is exactly the value HOUSE holds for that token,
 * so applying this changes nothing about how the library looks today.
 */
const TOKEN = {
  '#0a0b10': 'bg',
  '#04050a': 'bgDeep',
  '#f6f5f2': 'paper',
  '#101218': 'surface',
  '#ffffff': 'ink',
  '#eef1f7': 'body',
  '#8d93a5': 'muted',
  '#1d1b17': 'paperInk',
  '#4a4e5a': 'paperMuted',
  '#ff5c39': 'accent',
  '#c2410c': 'accentOnPaper',
  '#4cc9f0': 'pair',
  '#c6ff3d': 'series[2]',
  '#ffd166': 'series[3]',
  '#c77dff': 'series[4]',
};

/** The TS type of each token, for the per-file `type Theme` declaration. */
const TOKEN_TYPE = {series: 'readonly string[]'};

/** Which theme field a token expression actually reads. */
const fieldOf = (token) => (token.startsWith('series') ? 'series' : token);

const HOUSE_VALUE = {
  bg: "'#0a0b10'", bgDeep: "'#04050a'", paper: "'#f6f5f2'", surface: "'#101218'",
  ink: "'#ffffff'", body: "'#eef1f7'", muted: "'#8d93a5'",
  paperInk: "'#1d1b17'", paperMuted: "'#4a4e5a'",
  accent: "'#ff5c39'", accentOnPaper: "'#c2410c'", pair: "'#4cc9f0'",
  series: "['#ff5c39', '#4cc9f0', '#c6ff3d', '#ffd166', '#c77dff', '#8d93a5']",
};

let changed = 0;
let skipped = [];

for (const e of walkEffects()) {
  const path = e.tsxPath;
  let src = readFileSync(path, 'utf8');

  if (/\btype Theme\b/.test(src)) { skipped.push([e.id, 'already themed']); continue; }
  const m = src.match(PROPS_BLOCK_RE);
  if (!m) { skipped.push([e.id, 'no destructuring block the emitter can read']); continue; }
  if (!/\btype Props\s*=/.test(src)) { skipped.push([e.id, 'no type Props']); continue; }

  const block = m[1];
  const used = new Map();           // token expression -> theme field
  const rewritten = block.replace(
    /^(\s*)(\w+) = '(#[0-9a-fA-F]{6})',$/gm,
    (line, indent, prop, hex) => {
      const token = TOKEN[hex.toLowerCase()];
      if (!token) return line;
      used.set(token, fieldOf(token));
      return `${indent}${prop} = theme.${token},`;
    },
  );

  if (used.size === 0) { skipped.push([e.id, 'no prop default is a house colour']); continue; }

  // The theme prop has to come FIRST: a default parameter may only read
  // parameters declared before it.
  const withTheme = rewritten.replace(/^\n/, '\n  theme = THEME,\n');

  const fields = [...new Set([...used.values()])].sort();
  const typeDecl =
    `/**\n` +
    ` * The shared theme, narrowed to the tokens this file uses. TypeScript is\n` +
    ` * structural, so the library's full theme object is assignable to it — the\n` +
    ` * vocabulary is shared by NAME rather than by an import, which is what keeps\n` +
    ` * this file runnable on its own.\n` +
    ` */\ntype Theme = {\n` +
    fields.map((f) => `  readonly ${f}: ${TOKEN_TYPE[f] ?? 'string'};`).join('\n') +
    `\n};\n\n/** The house values. Pass a \`theme\` prop to restyle every effect at once. */\nconst THEME: Theme = {\n` +
    fields.map((f) => `  ${f}: ${HOUSE_VALUE[f]},`).join('\n') +
    `\n};\n`;

  // FUNCTION replacements throughout. A string replacement gives `$&`, `$1` and
  // friends special meaning, and these files are full of template literals —
  // the first run turned `{prompt: `${x}`}` into garbage in one component and
  // syntax errors in nine.
  const header = `export const ${e.componentName}: React.FC<Props> = ({${withTheme}\n}) =>`;
  src = src.replace(m[0], () => header);
  src = src.replace(/\ntype Props = \{/, () => `\n${typeDecl}\ntype Props = {`);

  // And declare it on Props, so the table and the type agree.
  src = src.replace(
    /\ntype Props = \{\n/,
    () =>
      `\ntype Props = {\n  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */\n  readonly theme?: Theme;\n`,
  );

  changed++;
  if (!DRY) writeFileSync(path, src);
}

console.log(`apply-theme: ${changed} component(s) ${DRY ? 'would be' : ''} rewritten`);
const reasons = new Map();
for (const [, why] of skipped) reasons.set(why, (reasons.get(why) ?? 0) + 1);
for (const [why, n] of [...reasons].sort((a, b) => b[1] - a[1])) console.log(`  skipped ${n}: ${why}`);
if (process.argv.includes('--list-skipped')) for (const [id, why] of skipped) console.log(`    ${id} — ${why}`);
