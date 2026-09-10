#!/usr/bin/env node
/**
 * Second codemod pass: put the typeface in the theme.
 *
 * The trick is that no body edit is needed. Every component already writes
 * `style={{fontFamily}}` — the ES shorthand for `fontFamily: fontFamily` —
 * reading a module-scope const from its own `loadFont` call. Adding a
 * `fontFamily` PROP shadows that const inside the component, so every existing
 * shorthand starts reading the prop instead, and the prop defaults to
 * `theme.<role>` whose inline default is that same module const.
 *
 * So: identical pixels until a theme is passed, one new documented prop, and
 * not one line of JSX touched.
 *
 * Run: node scripts/apply-theme-fonts.mjs [--dry]
 */
import {readFileSync, writeFileSync} from 'node:fs';
import {walkEffects} from './lib/fs.mjs';
import {PROPS_BLOCK_RE} from '../src/prompt-kit/compose.mjs';

const DRY = process.argv.includes('--dry');

/** Google family → the theme role it plays. */
const ROLE = {
  Archivo: 'display', ArchivoBlack: 'display', Anton: 'display', AntonSC: 'display',
  BebasNeue: 'display', Oswald: 'display', Orbitron: 'display',
  PlayfairDisplay: 'display', DMSerifDisplay: 'display',
  Inter: 'text', Sora: 'text', DMSans: 'text', Outfit: 'text',
  SpaceGrotesk: 'text', Montserrat: 'text',
  JetBrainsMono: 'mono', DMMono: 'mono', VT323: 'mono',
  Kalam: 'hand',
};

let changed = 0;
const skipped = [];

for (const e of walkEffects()) {
  let src = readFileSync(e.tsxPath, 'utf8');

  if (/readonly fontFamily\?/.test(src)) { skipped.push([e.id, 'already has a fontFamily prop']); continue; }

  const decls = [...src.matchAll(/^const \{fontFamily(?:: (\w+))?\} = (\w+)\(/gm)];
  if (decls.length === 0) { skipped.push([e.id, 'loads no font']); continue; }
  if (decls.length > 1) { skipped.push([e.id, `loads ${decls.length} fonts — needs a hand`]); continue; }
  if (decls[0][1]) { skipped.push([e.id, `binds the family as \`${decls[0][1]}\`, not \`fontFamily\``]); continue; }

  // Which family, from the import that defines the loader it calls.
  const loader = decls[0][2];
  const imp =
    src.match(new RegExp(`import \\{loadFont as ${loader}\\} from '@remotion/google-fonts/(\\w+)'`)) ??
    (loader === 'loadFont' ? src.match(/import \{loadFont\} from '@remotion\/google-fonts\/(\w+)'/) : null);
  if (!imp) { skipped.push([e.id, `cannot tell which family \`${loader}\` loads`]); continue; }

  const role = ROLE[imp[1]];
  if (!role) { skipped.push([e.id, `no theme role for ${imp[1]}`]); continue; }

  const m = src.match(PROPS_BLOCK_RE);
  if (!m) { skipped.push([e.id, 'no destructuring block the emitter can read']); continue; }

  // A component with no house-coloured prop default — a brand recreation, a
  // palette-driven sampler — still has a typeface, and "one structure that all
  // of them take" means all of them. Create the block if the colour pass did
  // not.
  let block0 = m[1];
  if (!/\btype Theme = \{/.test(src)) {
    src = src.replace(
      /\ntype Props = \{/,
      () =>
        `\n/**\n * The shared theme, narrowed to the tokens this file uses. TypeScript is\n` +
        ` * structural, so the library's full theme object is assignable to it.\n */\n` +
        `type Theme = {\n};\n\n/** The house values. Pass a \`theme\` prop to restyle every effect at once. */\n` +
        `const THEME: Theme = {\n};\n\ntype Props = {`,
    );
    src = src.replace(
      /\ntype Props = \{\n/,
      () =>
        `\ntype Props = {\n  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */\n  readonly theme?: Theme;\n`,
    );
    block0 = block0.replace(/^\n/, () => '\n  theme = THEME,\n');
    src = src.replace(m[0], () => `export const ${e.componentName}: React.FC<Props> = ({${block0}\n}) =>`);
  }

  // Add the role to this file's Theme type + default, if the colour pass did not.
  // Scoped to the Theme block: a bare `readonly text: string;` also occurs in
  // unrelated types (`type Word = {readonly text: string}`), and matching those
  // left two files with a `theme.text` reference and no `text` on their Theme.
  const themeBlock = src.match(/\ntype Theme = \{([\s\S]*?)\n\};/)?.[1] ?? '';
  if (!new RegExp(`^  readonly ${role}: `, 'm').test(themeBlock)) {
    src = src.replace(/\ntype Theme = \{\n/, () => `\ntype Theme = {\n  readonly ${role}: string;\n`);
    src = src.replace(/\nconst THEME: Theme = \{\n/, () => `\nconst THEME: Theme = {\n  ${role}: fontFamily,\n`);
  }

  // The prop. Named `fontFamily` so it shadows the module const and every
  // existing `style={{fontFamily}}` shorthand picks it up untouched.
  src = src.replace(
    /\ntype Props = \{\n/,
    () =>
      `\ntype Props = {\n  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */\n  readonly fontFamily?: string;\n`,
  );
  const block = block0.replace(/^\n  theme = THEME,\n/, () => `\n  theme = THEME,\n  fontFamily = theme.${role},\n`);
  if (block === block0) { skipped.push([e.id, 'no `theme = THEME` to anchor to']); continue; }
  const before = `export const ${e.componentName}: React.FC<Props> = ({${block0}\n}) =>`;
  src = src.replace(src.includes(before) ? before : m[0], () => `export const ${e.componentName}: React.FC<Props> = ({${block}\n}) =>`);

  changed++;
  if (!DRY) writeFileSync(e.tsxPath, src);
}

console.log(`apply-theme-fonts: ${changed} component(s) ${DRY ? 'would be' : ''} rewritten`);
const reasons = new Map();
for (const [, why] of skipped) reasons.set(why, (reasons.get(why) ?? 0) + 1);
for (const [why, n] of [...reasons].sort((a, b) => b[1] - a[1])) console.log(`  skipped ${n}: ${why}`);
if (process.argv.includes('--list-skipped')) for (const [id, why] of skipped) console.log(`    ${id} — ${why}`);
