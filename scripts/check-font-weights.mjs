#!/usr/bin/env node
/**
 * Gate: every font weight a component USES must be one it LOADS.
 *
 * @remotion/google-fonts type-checks the weight list against the typeface, but
 * nothing checks it against the design. Use a weight you did not load and you
 * get no error at all — the browser silently synthesises a face, and the render
 * is subtly wrong. A blind agent caught exactly this in globe-arcs (labels at
 * weight 600 against a list of 500/700/800).
 *
 * Also reports weights loaded but never used, which is dead download weight.
 */
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join} from 'node:path';

const ROOT = 'src/effects';
const dirs = (p) => readdirSync(p).filter((d) => statSync(join(p, d)).isDirectory());

let missing = 0;
let unused = 0;

for (const cat of dirs(ROOT)) {
  for (const id of dirs(join(ROOT, cat))) {
    const dir = join(ROOT, cat, id);
    const tsx = readdirSync(dir).find((f) => f.endsWith('.tsx'));
    if (!tsx) continue;
    const src = readFileSync(join(dir, tsx), 'utf8');

    const loaded = new Set();
    for (const m of src.matchAll(/weights:\s*\[([^\]]*)\]/g)) {
      for (const w of m[1].matchAll(/'(\d+)'/g)) loaded.add(w[1]);
    }
    if (loaded.size === 0) continue;

    // Weights actually applied, in JSX props and in style objects.
    //
    // A component may legitimately set a weight on a SYSTEM font stack rather
    // than the loaded typeface (a monospace caption, an -apple-system fallback).
    // Those lines opt out with a trailing `// font-weight-check: ignore` and a
    // reason, rather than the gate guessing which family each rule belongs to.
    const used = new Set();
    for (const line of src.split('\n')) {
      if (line.includes('font-weight-check: ignore')) continue;
      const m = line.match(/fontWeight[=:]\s*\{?\s*(\d{3})/);
      if (m) used.add(m[1]);
    }

    const notLoaded = [...used].filter((w) => !loaded.has(w));
    const notUsed = [...loaded].filter((w) => !used.has(w));

    if (notLoaded.length) {
      missing++;
      console.log(`  USES UNLOADED  ${id}: uses ${notLoaded.join(', ')} — loads ${[...loaded].sort().join(', ')}`);
    }
    if (notUsed.length) {
      unused++;
      console.log(`  loads unused   ${id}: ${notUsed.join(', ')}`);
    }
  }
}

console.log(
  missing === 0
    ? `\nNo component uses a weight it did not load.${unused ? ` (${unused} load a weight they never use.)` : ''}`
    : `\n${missing} component(s) use a font weight they never loaded.`,
);
process.exit(missing === 0 ? 0 : 1);
