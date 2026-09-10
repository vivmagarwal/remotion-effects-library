#!/usr/bin/env node
/**
 * Gate: every `meta.tags` and `meta.concepts` entry comes from the controlled
 * vocabulary in `src/tags.ts`.
 *
 * Before the vocabulary existed there were 373 distinct tags over 88 effects,
 * 251 of them used exactly once, and 333 concepts of which 307 were singletons.
 * The gallery's "learn by concept" index was 333 orphans. Free text belongs in
 * `description`, which the gallery already indexes.
 */
import {readFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {ROOT, walkEffects} from './lib/fs.mjs';
import {readMeta} from './lib/meta.mjs';
import {stringArrayExport} from './lib/ts.mjs';
import {gate, rel} from './lib/gate.mjs';

const g = gate('check:vocab');
const TAGS_FILE = join(ROOT, 'src', 'tags.ts');

if (!existsSync(TAGS_FILE)) {
  g.fail('src/tags.ts', 'missing — check:vocab has no vocabulary to check against.', [
    'It must export TAGS and CONCEPTS as readonly string arrays (CONTRACT §3).',
  ]);
  g.done('');
}

const src = readFileSync(TAGS_FILE, 'utf8');
const TAGS = stringArrayExport(src, 'TAGS');
const CONCEPTS = stringArrayExport(src, 'CONCEPTS');

if (!TAGS) g.fail(rel(TAGS_FILE), 'no `export const TAGS = [...]` found');
if (!CONCEPTS) g.fail(rel(TAGS_FILE), 'no `export const CONCEPTS = [...]` found');
if (!TAGS || !CONCEPTS) g.done('');

const dupes = (list, label) => {
  const seen = new Set();
  for (const x of list) {
    if (seen.has(x)) g.fail(rel(TAGS_FILE), `${label} lists '${x}' twice`);
    seen.add(x);
  }
};
dupes(TAGS, 'TAGS');
dupes(CONCEPTS, 'CONCEPTS');

const tagSet = new Set(TAGS);
const conceptSet = new Set(CONCEPTS);
const usedTags = new Set();
const usedConcepts = new Set();

for (const e of walkEffects()) {
  const meta = readMeta(e.metaPath);
  const bad = (kind, values, allowed, line) => {
    const off = values.filter((v) => !allowed.has(v));
    if (off.length) {
      g.fail(`${rel(e.metaPath)}:${line ?? 0}`, `${meta.id}: ${off.length} ${kind} outside src/tags.ts`, off.map((v) => `  '${v}'`));
    }
  };
  bad('tag(s)', meta.tags, tagSet, meta.keyLines.tags);
  bad('concept(s)', meta.concepts, conceptSet, meta.keyLines.concepts);
  for (const t of meta.tags) usedTags.add(t);
  for (const c of meta.concepts) usedConcepts.add(c);
}

const unusedTags = TAGS.filter((t) => !usedTags.has(t));
const unusedConcepts = CONCEPTS.filter((c) => !usedConcepts.has(c));
if (unusedTags.length) g.note(`${unusedTags.length} allowed tag(s) unused: ${unusedTags.join(', ')}`);
if (unusedConcepts.length) g.note(`${unusedConcepts.length} allowed concept(s) unused: ${unusedConcepts.join(', ')}`);

g.done(`every tag and concept is in src/tags.ts (${TAGS.length} tags, ${CONCEPTS.length} concepts).`);
