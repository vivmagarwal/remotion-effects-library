#!/usr/bin/env node
/** Rewrites the catalogue table in README.md from the actual effects on disk. */
import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {ROOT, walkEffects} from './lib/fs.mjs';
import {readMeta} from './lib/meta.mjs';
import {CATEGORY_LABEL, CATEGORY_ORDER} from './lib/taxonomy.mjs';

const byCat = new Map();
let total = 0;
for (const e of walkEffects()) {
  const meta = readMeta(e.metaPath);
  if (!byCat.has(e.category)) byCat.set(e.category, []);
  byCat.get(e.category).push(meta.name ?? e.id);
  total++;
}

// Categories the taxonomy knows, in display order, then anything left over so a
// half-migrated library still lists every effect instead of dropping folders.
const order = [...CATEGORY_ORDER.filter((c) => byCat.has(c)), ...[...byCat.keys()].filter((c) => !CATEGORY_ORDER.includes(c)).sort()];

const rows = order.map((c) => `| **${CATEGORY_LABEL[c] ?? c}** | ${byCat.get(c).sort().join(' · ')} |`);

const table = [
  `${total} effects across ${byCat.size} categories.`,
  '',
  '| Category | Effects |',
  '|---|---|',
  ...rows,
].join('\n');

const readmePath = join(ROOT, 'README.md');
const readme = readFileSync(readmePath, 'utf8');
const next = readme.replace(/(## What's in it\n\n)[\s\S]*?(\n\n---)/, `$1${table}$2`);
writeFileSync(readmePath, next);

const unknown = order.filter((c) => !CATEGORY_ORDER.includes(c));
console.log(`README: ${total} effects, ${byCat.size} categories`);
if (unknown.length) console.log(`  not in scripts/lib/taxonomy.mjs: ${unknown.join(', ')}`);
