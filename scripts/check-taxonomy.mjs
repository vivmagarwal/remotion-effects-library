#!/usr/bin/env node
/**
 * Gate: the taxonomy has ONE shape, spelled the same in all three places.
 *
 *   src/types.ts             the `Category` union the compiler enforces
 *   src/gallery/categories.ts  CATEGORY_LABEL + CATEGORY_ORDER (the source)
 *   scripts/lib/taxonomy.mjs   the mirror the .mjs scripts read
 *
 * Adding a category used to mean editing three files, one of which
 * (scripts/update-readme.mjs) nobody remembered. A category present in two of
 * them and absent from the third silently drops effects out of the README and
 * out of the gallery's chip rail.
 */
import {readFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {ROOT, walkEffects} from './lib/fs.mjs';
import {readMeta} from './lib/meta.mjs';
import {CATEGORY_LABEL, CATEGORY_ORDER} from './lib/taxonomy.mjs';
import {stringArrayExport, objectKeysExport, unionMembers} from './lib/ts.mjs';
import {gate, rel} from './lib/gate.mjs';

const g = gate('check:taxonomy');

const TYPES = join(ROOT, 'src', 'types.ts');
const CATS = join(ROOT, 'src', 'gallery', 'categories.ts');

const mirrorOrder = [...CATEGORY_ORDER];
const mirrorLabels = Object.keys(CATEGORY_LABEL);

const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const only = (a, b) => a.filter((x) => !b.includes(x));

// scripts/lib/taxonomy.mjs must be internally consistent first.
if (!same([...mirrorOrder].sort(), [...mirrorLabels].sort())) {
  g.fail('scripts/lib/taxonomy.mjs', 'CATEGORY_ORDER and CATEGORY_LABEL cover different categories', [
    `in ORDER only: ${only(mirrorOrder, mirrorLabels).join(', ') || '—'}`,
    `in LABEL only: ${only(mirrorLabels, mirrorOrder).join(', ') || '—'}`,
  ]);
}

if (!existsSync(TYPES)) {
  g.fail(rel(TYPES), 'src/types.ts is missing — nothing defines the Category union.');
} else {
  const union = unionMembers(readFileSync(TYPES, 'utf8'), 'Category');
  if (!union) {
    g.fail(rel(TYPES), 'no `export type Category = \'a\' | \'b\' | …` found');
  } else {
    const missing = only(mirrorOrder, union);
    const extra = only(union, mirrorOrder);
    if (missing.length) g.fail(rel(TYPES), 'Category union is missing categories the taxonomy defines', missing.join(', '));
    if (extra.length) g.fail(rel(TYPES), 'Category union has categories scripts/lib/taxonomy.mjs does not', extra.join(', '));
  }
}

if (!existsSync(CATS)) {
  g.fail(rel(CATS), 'src/gallery/categories.ts is missing — the gallery has no labels.');
} else {
  const src = readFileSync(CATS, 'utf8');
  const labels = objectKeysExport(src, 'CATEGORY_LABEL');
  const order = stringArrayExport(src, 'CATEGORY_ORDER');
  if (!labels) g.fail(rel(CATS), 'no `export const CATEGORY_LABEL = {…}` found');
  else {
    const missing = only(mirrorOrder, labels);
    const extra = only(labels, mirrorOrder);
    if (missing.length) g.fail(rel(CATS), 'CATEGORY_LABEL is missing categories', missing.join(', '));
    if (extra.length) g.fail(rel(CATS), 'CATEGORY_LABEL has categories the mirror does not', extra.join(', '));
    // Labels must match text-for-text, not just cover the same keys.
    for (const k of mirrorOrder) {
      const m = src.match(new RegExp(`(?:^|\\n)\\s*(?:'${k}'|"${k}"|${k.replace(/[^\w$]/g, '')})\\s*:\\s*'([^']*)'`));
      if (m && m[1] !== CATEGORY_LABEL[k]) {
        g.fail(rel(CATS), `label for \`${k}\` disagrees with scripts/lib/taxonomy.mjs`, `categories.ts: '${m[1]}'  ·  taxonomy.mjs: '${CATEGORY_LABEL[k]}'`);
      }
    }
  }
  if (!order) g.fail(rel(CATS), 'no `export const CATEGORY_ORDER = [...]` found');
  else if (!same(order, mirrorOrder)) {
    g.fail(rel(CATS), 'CATEGORY_ORDER is a different display order from scripts/lib/taxonomy.mjs', [
      `categories.ts: ${order.join(' ')}`,
      `taxonomy.mjs : ${mirrorOrder.join(' ')}`,
    ]);
  }
}

// Every effect on disk must live in a category the taxonomy knows.
const strays = new Map();
for (const e of walkEffects()) {
  if (!mirrorOrder.includes(e.category)) {
    if (!strays.has(e.category)) strays.set(e.category, []);
    strays.get(e.category).push(e.id);
  }
  const meta = readMeta(e.metaPath);
  if (meta.category !== e.category) {
    g.fail(rel(e.metaPath) + `:${meta.keyLines.category ?? 0}`, `meta.category '${meta.category}' ≠ folder '${e.category}'`);
  }
}
for (const [cat, ids] of strays) {
  g.fail(`src/effects/${cat}/`, `folder category '${cat}' is not in the taxonomy`, `${ids.length} effect(s): ${ids.join(', ')}`);
}

g.done(`${mirrorOrder.length} categories agree across types.ts, categories.ts and scripts/lib/taxonomy.mjs.`);
