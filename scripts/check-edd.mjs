#!/usr/bin/env node
/**
 * Gate: the installed `edododraw` can actually draw.
 *
 * This exists because of a bug that shipped and was invisible. `edododraw`
 * populates its visualization registry by IMPORT SIDE EFFECT — a module runs
 * `registerViz(...)` at load — and it declares `sideEffects` in package.json so
 * bundlers know not to drop those modules. But the globs pointed at
 * `**\/viz/generators/*.js`, and the published build has only `.d.ts` files
 * there: every line of real JavaScript lives in `dist-lib/index.js` and
 * `dist-lib/chunks/*.js`. So the declaration matched nothing, the whole package
 * looked side-effect-free, and a production bundler legally removed the
 * registrations.
 *
 * What that looked like: `viz clouds { … }` compiled with **no error** — an
 * unregistered viz type warns — to a scene with zero nodes. The card rendered a
 * clean blank frame. Every gate was green, the dev server was fine, and
 * server-side stills were fine, because only the production bundler tree-shook.
 * A human had to spot it in the gallery.
 *
 * So this checks the two things that would have caught it:
 *   1. every `sideEffects` glob matches at least one shipped `.js`;
 *   2. every viz template the library uses compiles to a non-empty scene.
 *
 * Run: node scripts/check-edd.mjs
 */
import {readFileSync, existsSync, readdirSync, statSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {createRequire} from 'node:module';
import {gate} from './lib/gate.mjs';

const g = gate('check:edd');
const require_ = createRequire(import.meta.url);

let pkgPath;
try {
  pkgPath = require_.resolve('edododraw/package.json');
} catch {
  g.done('edododraw is not installed — nothing to check.');
}

const pkgDir = dirname(pkgPath);
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

/** Every file the package ships, as a path relative to the package root. */
const walk = (dir, prefix = '') => {
  if (!existsSync(join(pkgDir, dir))) return [];
  return readdirSync(join(pkgDir, dir)).flatMap((f) => {
    const rel = prefix ? `${prefix}/${f}` : f;
    return statSync(join(pkgDir, dir, f)).isDirectory() ? walk(join(dir, f), rel) : [rel];
  });
};
const shipped = walk('.');
const js = shipped.filter((f) => f.endsWith('.js'));

// ── 1. sideEffects globs must match shipped JavaScript ──────────────────────
const {sideEffects} = pkg;
if (sideEffects === true || sideEffects === undefined) {
  g.note('sideEffects is not narrowed — every module is treated as side-effectful, which is safe.');
} else if (sideEffects === false) {
  g.fail(
    'edododraw/package.json',
    'sideEffects is `false`, but the viz registry is populated by import side effect',
    ['A bundler is free to drop every registration. Expect `viz` types to compile to zero nodes.'],
  );
} else if (Array.isArray(sideEffects)) {
  // Minimal glob support: `*` within a segment, `**` across segments.
  const toRe = (glob) =>
    new RegExp(
      '^' +
        glob
          .replace(/[.+^${}()|[\]\\]/g, '\\$&')
          .replace(/\*\*\//g, '(?:.*/)?')
          .replace(/\*\*/g, '.*')
          .replace(/\*/g, '[^/]*') +
        '$',
    );
  const jsGlobs = sideEffects.filter((s) => s.endsWith('.js'));
  const unmatched = jsGlobs.filter((glob) => !js.some((f) => toRe(glob).test(f)));
  if (jsGlobs.length === 0) {
    g.fail('edododraw/package.json', 'sideEffects lists no `.js` pattern at all', [
      `it lists: ${sideEffects.join(', ')}`,
      'The published package ships JavaScript, not TypeScript, so a source-path glob protects nothing.',
    ]);
  }
  for (const glob of unmatched) {
    g.fail('edododraw/package.json', `sideEffects glob "${glob}" matches none of the ${js.length} shipped .js files`, [
      `shipped JS looks like: ${js.slice(0, 4).join(', ')}${js.length > 4 ? ' …' : ''}`,
      'A glob that matches nothing is the same as declaring no side effects: a production',
      'bundler may drop the modules that call registerViz(), and every `viz` type will then',
      'compile to an empty scene with no error.',
    ]);
  }
}

// ── 2. the templates the library uses must compile to something ─────────────
const variantsFile = join(
  process.cwd(),
  'src/effects/diagrams/viz-gallery/variants.generated.ts',
);
if (existsSync(variantsFile)) {
  const {compileEdd, listVizTemplates} = await import('edododraw');
  const registered = typeof listVizTemplates === 'function' ? listVizTemplates().length : 0;
  if (registered < 80) {
    g.fail('edododraw', `only ${registered} viz templates are registered`, [
      'Expected 87. The generator registrations did not run.',
    ]);
  }

  const src = readFileSync(variantsFile, 'utf8');
  const ids = [...src.matchAll(/^\s{4}id: '([^']+)',$/gm)].map((m) => m[1]);
  const empty = [];
  for (const id of ids) {
    const {scene} = compileEdd(`meta { style: hand-clean }\nviz ${id} v "T" { item "A"; item "B" }`);
    if ((scene?.nodes?.length ?? 0) === 0) empty.push(id);
  }
  if (empty.length) {
    g.fail('src/effects/diagrams/viz-gallery/variants.generated.ts', `${empty.length} viz template(s) compile to an empty scene`, [
      empty.slice(0, 10).join(', ') + (empty.length > 10 ? ' …' : ''),
      'An unregistered viz type warns rather than errors, so this renders a blank frame.',
    ]);
  }
  g.note(`${registered} templates registered; ${ids.length} used by viz-gallery, all non-empty.`);
}

g.done('edododraw ships side-effectful JavaScript and every viz template compiles.');
