#!/usr/bin/env node
/**
 * Gate: the gallery must render a variant with the variant's props.
 *
 * `meta.variants` expands one component into many compositions, and a variant
 * IS its props — the registry carries them as `variantProps`. Every `<Player>`
 * and `<Thumbnail>` in the gallery therefore has to be handed them.
 *
 * All three call sites omitted `inputProps`. 82 edododraw templates and 3
 * handheld-drift presets — 85 of the gallery's 181 compositions — rendered the
 * component's DEFAULTS under 85 different names and descriptions. Server-side
 * stills were correct throughout, because `renderStill` is driven from the
 * registry rather than from the gallery, so no gate could see it. A human
 * opened the page and saw 82 identical cards.
 *
 * Run: node scripts/check-gallery-variants.mjs
 */
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {ROOT} from './lib/fs.mjs';
import {gate} from './lib/gate.mjs';

const g = gate('check:gallery-variants');
const rel = 'src/gallery/App.tsx';
const src = readFileSync(join(ROOT, rel), 'utf8');

/** End index of a JSX opening tag starting at `from`, brace-aware. */
const openingTagEnd = (s, from) => {
  let depth = 0;
  for (let i = from; i < s.length; i++) {
    const c = s[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '>' && depth === 0) return i;
  }
  return s.length;
};

let found = 0;
for (const m of src.matchAll(/<(Player|Thumbnail)\b/g)) {
  const el = src.slice(m.index, openingTagEnd(src, m.index + m[0].length));
  // `component=` is what separates a real call site from the several places the
  // comments in this file discuss `<Thumbnail>` in prose. Matching the bare tag
  // reported three sentences as bugs.
  if (!/\bcomponent\s*=/.test(el)) continue;
  found++;
  const line = src.slice(0, m.index).split('\n').length;
  if (!/\binputProps\s*=/.test(el)) {
    g.fail(`${rel}:${line}`, `<${m[1]}> renders a registry entry without \`inputProps\``, [
      'A variant is its props. Without them every variant of an effect renders the',
      'component defaults, so N compositions show one picture under N names.',
      'Pass `inputProps={variantProps}` from the entry.',
    ]);
  }
}

if (found === 0) {
  g.fail(rel, 'no <Player> or <Thumbnail> found — this gate is no longer looking at anything', [
    'The gallery was rewritten; point this check at whatever renders a composition now.',
  ]);
}

// The props have to come off the entry, not be invented.
if (!/const \{[^}]*\bvariantProps\b[^}]*\} = entry;/.test(src)) {
  g.fail(rel, 'no component destructures `variantProps` off the registry entry', [
    'scripts/build-registry.mjs puts a variant’s props there; something must read them.',
  ]);
}

g.done(`${found} <Player>/<Thumbnail> call site(s) — every one passes the variant's props.`);
