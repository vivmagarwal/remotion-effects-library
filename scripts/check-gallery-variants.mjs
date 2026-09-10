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

/**
 * The version the page prints has to be the version it is built against.
 *
 * The gallery states "Remotion 4.0.522" in the header and again in the footer,
 * from a constant typed by hand. A dependency bump does not touch it, so the
 * first thing a visitor reads about the catalogue would quietly become false —
 * and it is the one number on the page nobody thinks to re-check.
 */
const declared = src.match(/const REMOTION_VERSION = '([^']+)'/)?.[1];
const installed = JSON.parse(readFileSync(join(ROOT, 'node_modules/remotion/package.json'), 'utf8')).version;
if (!declared) {
  g.fail(rel, 'REMOTION_VERSION is gone — the page can no longer state which Remotion it is built on');
} else if (declared !== installed) {
  g.fail(rel, `the page says Remotion ${declared}; the installed one is ${installed}`, [
    `Set REMOTION_VERSION = '${installed}'.`,
  ]);
}

g.done(
  `${found} <Player>/<Thumbnail> call site(s) pass the variant's props; ` +
    `the page states Remotion ${declared}, which is what is installed.`,
);
