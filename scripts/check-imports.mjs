#!/usr/bin/env node
/**
 * Gate: the install line must cover every import.
 *
 * A composed prompt opens with `npx remotion add …`, built from `meta.packages`.
 * If the component imports something that line does not name, the agent that
 * receives the prompt installs the wrong set, and the failure lands on them as
 * "Cannot find module" — with nothing in the brief to suggest what to add.
 *
 * The reverse matters too: a package listed but never imported inflates every
 * install, and one of them (`@remotion/three` pulling three.js) is 30 MB.
 *
 * Bare-specifier imports only. Relative imports are a different failure and
 * `check:standalone` owns them.
 *
 * Run: node scripts/check-imports.mjs
 */
import {readFileSync, existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {walkEffects} from './lib/fs.mjs';
import {readMeta} from './lib/meta.mjs';
import {installLine} from '../src/prompt-kit/compose.mjs';
import {gate, rel} from './lib/gate.mjs';

const g = gate('check:imports');

/** Always present in a Remotion project; never worth an install line. */
const AMBIENT = new Set(['react', 'react-dom', 'react/jsx-runtime']);

const require_ = createRequire(import.meta.url);

/**
 * What installing `pkg` actually puts in node_modules, one level down.
 *
 * Listing a package you never import is usually waste — but not always, and the
 * exceptions are the ones that matter here. `@remotion/three` declares
 * `@react-three/fiber` and `three` as PEERS: a component imports neither
 * directly (it writes `<mesh>` JSX and lets fiber reconcile it) and both must be
 * installed or nothing renders. Symmetrically, `geojson` is never installed by
 * name — it arrives as `@types/geojson` with `@types/d3-geo`, which is why
 * globe-arcs' brief says so in a sentence.
 *
 * Reading it from the installed tree beats hard-coding a list that goes stale.
 */
const bundled = (pkg) => {
  try {
    const path = require_.resolve(`${pkg}/package.json`);
    if (!existsSync(path)) return [];
    const json = JSON.parse(readFileSync(path, 'utf8'));
    return [...Object.keys(json.dependencies ?? {}), ...Object.keys(json.peerDependencies ?? {})];
  } catch {
    return [];
  }
};

/** `@remotion/effects/blur` and `@remotion/google-fonts/Inter` install as the root. */
const rootOf = (spec) => {
  if (spec.startsWith('@')) {
    const [scope, name] = spec.split('/');
    return `${scope}/${name}`;
  }
  return spec.split('/')[0];
};

let checked = 0;
for (const e of walkEffects()) {
  const src = readFileSync(e.tsxPath, 'utf8');
  const meta = readMeta(e.metaPath);
  const declared = new Set((meta.packages ?? []).map(rootOf));
  /**
   * Everything the install line actually puts in node_modules.
   *
   * Derived from `installLine()` itself rather than from meta.packages, because
   * that function adds `@types/<pkg>` for the ones that need them — and those
   * types packages have dependencies of their own. `geojson` is the case that
   * proves it: nothing installs it by name, `@types/d3-geo` depends on
   * `@types/geojson`, and globe-arcs imports two types from it. Reading the
   * emitted line keeps this gate and the prompt from ever disagreeing.
   */
  const installed = [...installLine(meta.packages ?? []).matchAll(/(?:^|\s)((?:@[\w.-]+\/)?[\w.-]+)/gm)]
    .map((m) => m[1])
    .filter((t) => !['npx', 'remotion', 'add', 'npm', 'i', '-D'].includes(t));
  const reachable = new Set([...declared, ...installed]);
  for (const pkg of [...reachable]) for (const dep of bundled(pkg)) reachable.add(dep);
  /** TypeScript resolves `from 'geojson'` to `@types/geojson`. */
  const covered = (pkg) => reachable.has(pkg) || reachable.has(`@types/${pkg}`);
  checked++;

  const imported = new Set();
  for (const m of src.matchAll(/^import[^'"]*['"]([^'"]+)['"]/gm)) {
    const spec = m[1];
    if (spec.startsWith('.') || spec.startsWith('/')) continue;
    imported.add(rootOf(spec));
  }
  for (const m of src.matchAll(/\bfrom\s+['"]([^'"./][^'"]*)['"]/g)) imported.add(rootOf(m[1]));

  for (const pkg of imported) {
    if (AMBIENT.has(pkg) || covered(pkg)) continue;
    g.fail(rel(e.tsxPath), `${meta.id}: imports \`${pkg}\`, which meta.packages does not list`, [
      `the prompt's install line says: npx remotion add ${[...declared].filter((p) => p !== 'remotion').join(' ') || '(nothing)'}`,
      'An agent following that line gets "Cannot find module" and no hint what to add.',
    ]);
  }
  for (const pkg of declared) {
    if (pkg === 'remotion' || imported.has(pkg)) continue;
    // A peer of something else on the list is required even though nothing
    // imports it — @remotion/three needs @react-three/fiber and three present.
    const isPeerOfAnother = [...declared].some((other) => other !== pkg && bundled(other).includes(pkg));
    if (isPeerOfAnother) continue;
    g.fail(rel(e.metaPath), `${meta.id}: meta.packages lists \`${pkg}\`, which the component never imports`, [
      'Every listed package is installed by whoever follows the brief. @remotion/three alone pulls ~30MB.',
    ]);
  }
}

g.done(`${checked} components — every import is in the install line, and every listed package is used.`);
