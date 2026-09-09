#!/usr/bin/env node
/** Rewrites the catalogue table in README.md from the actual effects on disk. */
import {readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

const LABEL = {
  text: 'Text & Type', openers: 'Openers', transitions: 'Transitions', effects: 'Visual FX',
  data: 'Data & Charts', motion: 'Motion', backgrounds: 'Backgrounds', ui: 'UI & Social',
  media: 'Media', captions: 'Captions', 'three-d': '3D', audio: 'Audio',
};
const ORDER = ['text', 'openers', 'transitions', 'effects', 'motion', 'backgrounds', 'data', 'ui', 'captions', 'media', 'three-d', 'audio'];

const root = join(process.cwd(), 'src', 'effects');
const dirs = (p) => readdirSync(p).filter((d) => statSync(join(p, d)).isDirectory());

const byCat = new Map();
let total = 0;
for (const cat of dirs(root)) {
  for (const id of dirs(join(root, cat))) {
    const raw = readFileSync(join(root, cat, id, 'meta.ts'), 'utf8');
    const name = raw.match(/\bname:\s*'([^']*)'/)?.[1] ?? id;
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat).push(name);
    total++;
  }
}

const rows = ORDER.filter((c) => byCat.has(c)).map(
  (c) => `| **${LABEL[c]}** | ${byCat.get(c).sort().join(' · ')} |`,
);

const table = [
  `${total} effects across ${byCat.size} categories.`,
  '',
  '| Category | Effects |',
  '|---|---|',
  ...rows,
].join('\n');

const readme = readFileSync('README.md', 'utf8');
const next = readme.replace(
  /(## What's in it\n\n)[\s\S]*?(\n\n---)/,
  `$1${table}$2`,
);
writeFileSync('README.md', next);
console.log(`README: ${total} effects, ${byCat.size} categories`);
