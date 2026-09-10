#!/usr/bin/env node
/**
 * Writes every effect's fully-composed, self-sufficient prompt to
 * out/prompts/<id>.md.
 *
 * This is a thin caller. The composition itself lives in
 * src/prompt-kit/compose.mjs, which the gallery's "Copy prompt" button imports
 * too — `npm run check:compose` proves the two are byte-identical, so the file
 * a blind agent is handed during validation really is the file a user copies.
 */
import {readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {composePrompt, readPropsFromSource, declaresProps, selectModules} from '../src/prompt-kit/compose.mjs';
import {walkEffects, OUT_DIR} from './lib/fs.mjs';
import {readMeta} from './lib/meta.mjs';
import {loadKit, missingKitFiles} from './lib/kit.mjs';

const OUT = join(OUT_DIR, 'prompts');
mkdirSync(OUT, {recursive: true});

const kit = loadKit();
for (const m of missingKitFiles()) {
  console.log(`  kit: no ${m.names.join(' / ')} — ${m.optional ? 'module omitted where selected' : 'SECTION MISSING from every prompt'}`);
}

const emptyTables = [];
const missingModules = new Map();
let n = 0;
const written = new Set();

for (const e of walkEffects()) {
  const meta = readMeta(e.metaPath);
  const brief = readFileSync(e.promptPath, 'utf8');
  const componentSource = readFileSync(e.tsxPath, 'utf8');

  writeFileSync(join(OUT, `${meta.id}.md`), composePrompt({meta, brief, componentSource, kit}));
  written.add(`${meta.id}.md`);
  n++;

  if (readPropsFromSource(componentSource).length === 0) {
    emptyTables.push({id: meta.id, declares: declaresProps(componentSource), file: e.file});
  }
  for (const key of selectModules({meta, componentSource, kit}).missing) {
    if (!missingModules.has(key)) missingModules.set(key, []);
    missingModules.get(key).push(meta.id);
  }
}

/**
 * Delete prompts for effects that no longer exist.
 *
 * The emitter only ever wrote, so `out/prompts/` accumulated a file for every
 * id the library has ever had — eight of them survived the taxonomy rename and
 * sat there for weeks, each a complete, plausible, WRONG brief for an effect
 * that is gone. Anyone browsing the directory would have found them.
 */
const orphans = readdirSync(OUT).filter((f) => f.endsWith('.md') && !written.has(f));
for (const f of orphans) rmSync(join(OUT, f));

console.log(
  `wrote ${n} composed prompts to out/prompts/` +
    (orphans.length ? ` (removed ${orphans.length} for effects that no longer exist)` : ''),
);

if (emptyTables.length) {
  const lying = emptyTables.filter((t) => t.declares);
  console.log(`\n${emptyTables.length} effect(s) ship an EMPTY props table (silently unvalidated):`);
  for (const t of emptyTables) {
    console.log(`  ${t.declares ? 'HAS type Props' : 'no props     '}  ${t.id}  (${t.file})`);
  }
  if (lying.length) {
    console.log(`  ↑ ${lying.length} of those declare \`type Props\` — the destructuring regex missed them.`);
  }
}

for (const [key, ids] of missingModules) {
  console.log(`\nmodule "${key}.md" is selected by ${ids.length} effect(s) but does not exist: ${ids.join(', ')}`);
}
