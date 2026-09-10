#!/usr/bin/env node
/**
 * Gate: every prop default in a component must appear in that effect's composed
 * prompt.
 *
 * Blind agents reported the same defect every single round — "backgroundColor
 * is the one prop with no default", "title and subtitle have no example copy at
 * all". A brief that omits a default is a brief you cannot rebuild the effect
 * from, which is the whole promise of this library.
 *
 * This used to re-implement the props parser as a line regex
 * (`/^\s*(\w+)\s*=\s*(.+?),\s*$/`), which was strictly weaker than the emitter's
 * scanner: a multi-line default was checked by neither. It now imports the one
 * scanner from src/prompt-kit/compose.mjs.
 *
 *   node scripts/check-prompt-defaults.mjs          # every effect
 *   node scripts/check-prompt-defaults.mjs globe-arcs quote-slam
 */
import {readFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {readPropsFromSource, declaresProps} from '../src/prompt-kit/compose.mjs';
import {walkEffects, OUT_DIR} from './lib/fs.mjs';
import {readMeta} from './lib/meta.mjs';

const PROMPTS = join(OUT_DIR, 'prompts');
const only = process.argv.slice(2);

if (!existsSync(PROMPTS)) {
  console.error(`out/prompts not found — run \`npm run prompts\` first.`);
  process.exit(1);
}

const failures = [];
const unparsed = [];
const propless = [];
let checked = 0;

for (const e of walkEffects()) {
  const meta = readMeta(e.metaPath);
  if (only.length && !only.includes(meta.id) && !only.includes(e.id)) continue;

  const promptPath = join(PROMPTS, `${meta.id}.md`);
  if (!existsSync(promptPath)) {
    failures.push({id: meta.id, missing: [`out/prompts/${meta.id}.md was never written`]});
    continue;
  }

  const src = readFileSync(e.tsxPath, 'utf8');
  const prompt = readFileSync(promptPath, 'utf8');
  const props = readPropsFromSource(src);

  if (props.length === 0) {
    // A file with a `type Props` that yields no table is a PARSE failure, not a
    // propless component — the prompt silently ships with no props table.
    if (declaresProps(src)) unparsed.push({id: meta.id, file: e.file});
    else propless.push(meta.id);
    continue;
  }
  checked++;

  const missing = [];
  for (const {name, def} of props) {
    const value = def.trim();
    // Scalars only. Array/object defaults are named constants described in prose.
    if (!/^'[^']*'$|^-?[\d.]+$|^true$|^false$/.test(value)) continue;
    const literal = value.replace(/^'|'$/g, '');
    if (!prompt.includes(name)) missing.push(`${name} — prop name never mentioned`);
    else if (literal.length > 1 && !prompt.includes(literal)) missing.push(`${name} = ${value}`);
  }

  if (missing.length) failures.push({id: meta.id, missing});
}

for (const f of failures) {
  console.log(`  MISSING  ${f.id}`);
  for (const m of f.missing) console.log(`             ${m}`);
}
for (const u of unparsed) {
  console.log(`  UNPARSED ${u.id} (${u.file})`);
  console.log(`             declares \`type Props\` but the destructuring block did not match —`);
  console.log(`             the shipped prompt has NO props table. Expected shape:`);
  console.log(`             export const X: React.FC<Props> = ({ … \\n}) =>`);
}

const bad = failures.length + unparsed.length;
console.log(
  bad === 0
    ? `\n${checked} prompts checked — every prop default is stated.` +
        (propless.length ? `\n${propless.length} take no props (${propless.join(', ')}).` : '')
    : `\n${failures.length} of ${checked} prompts omit a default; ${unparsed.length} component(s) produced no table at all.`,
);
process.exit(bad === 0 ? 0 : 1);
