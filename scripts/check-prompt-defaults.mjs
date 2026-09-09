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
 * emit-prompts.mjs now generates a props table from the source, so this checks
 * that generation actually covered everything.
 *
 *   node scripts/check-prompt-defaults.mjs          # every effect
 *   node scripts/check-prompt-defaults.mjs globe-arcs quote-slam
 */
import {readFileSync, readdirSync, statSync, existsSync} from 'node:fs';
import {join} from 'node:path';

const ROOT = 'src/effects';
const PROMPTS = 'out/prompts';
const only = process.argv.slice(2);

if (!existsSync(PROMPTS)) {
  console.error(`${PROMPTS} not found — run \`npm run prompts\` first.`);
  process.exit(1);
}

const dirs = (p) => readdirSync(p).filter((d) => statSync(join(p, d)).isDirectory());

const failures = [];
const propless = [];
let checked = 0;

for (const cat of dirs(ROOT)) {
  for (const id of dirs(join(ROOT, cat))) {
    if (only.length && !only.includes(id)) continue;

    const dir = join(ROOT, cat, id);
    const tsx = readdirSync(dir).find((f) => f.endsWith('.tsx'));
    if (!tsx) continue;

    const src = readFileSync(join(dir, tsx), 'utf8');
    const prompt = readFileSync(join(PROMPTS, `${id}.md`), 'utf8');

    // Some components (the transition presentations) take no props at all, so
    // there is nothing to state. Not a parse failure.
    const block = src.match(/export const \w+: React\.FC<Props> = \(\{([\s\S]*?)\n\}\) =>/)?.[1];
    if (!block) {
      propless.push(id);
      continue;
    }
    checked++;

    const missing = [];
    for (const line of block.split('\n')) {
      const m = line.match(/^\s*(\w+)\s*=\s*(.+?),\s*$/);
      if (!m) continue;
      const [, name, valueRaw] = m;
      const value = valueRaw.trim();
      // Scalars only. Array/object defaults are named constants described in prose.
      if (!/^'[^']*'$|^-?[\d.]+$|^true$|^false$/.test(value)) continue;
      const literal = value.replace(/^'|'$/g, '');
      if (!prompt.includes(name)) missing.push(`${name} — prop name never mentioned`);
      else if (literal.length > 1 && !prompt.includes(literal)) missing.push(`${name} = ${value}`);
    }

    if (missing.length) failures.push({id, missing});
  }
}

for (const f of failures) {
  console.log(`  MISSING  ${f.id}`);
  for (const m of f.missing) console.log(`             ${m}`);
}

console.log(
  failures.length === 0
    ? `\n${checked} prompts checked — every prop default is stated.` +
      (propless.length ? `\n${propless.length} take no props (${propless.join(', ')}).` : '')
    : `\n${failures.length} of ${checked} prompts omit a default.`,
);
process.exit(failures.length === 0 ? 0 : 1);
