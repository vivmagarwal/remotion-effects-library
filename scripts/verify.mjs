#!/usr/bin/env node
/**
 * Quality gate: bundles once, then renders one still per composition.
 * Any effect that throws is a broken effect — the library must not ship it.
 *
 *   node scripts/verify.mjs               # every effect
 *   node scripts/verify.mjs glitch        # ids containing "glitch"
 */
import {bundle} from '@remotion/bundler';
import {getCompositions, renderStill} from '@remotion/renderer';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {ROOT, OUT_DIR, walkEffects} from './lib/fs.mjs';
import {readMeta} from './lib/meta.mjs';

const OUT = join(OUT_DIR, 'verify');
const filter = process.argv[2] ?? '';

mkdirSync(OUT, {recursive: true});

// checkFrame lives in each meta.ts; one reader, shared with every other gate.
const checkFrames = new Map();
const posterFrames = new Map();
for (const e of walkEffects()) {
  const meta = readMeta(e.metaPath);
  if (Number.isFinite(meta.checkFrame)) checkFrames.set(meta.id, meta.checkFrame);
  // The poster is the frame the gallery actually shows, and no gate ever
  // rendered it. Render it here when it differs so check:poster has something
  // to look at.
  if (Number.isFinite(meta.posterFrame) && meta.posterFrame !== meta.checkFrame) {
    posterFrames.set(meta.id, meta.posterFrame);
  }
}
const POSTERS = join(OUT_DIR, 'poster');
mkdirSync(POSTERS, {recursive: true});

console.log('Bundling…');
const serveUrl = await bundle({
  entryPoint: join(ROOT, 'src/index.ts'),
  onProgress: () => undefined,
});

const all = await getCompositions(serveUrl);
const comps = all.filter((c) => c.id.includes(filter));
if (filter && comps.length === 0) {
  console.error(`No composition id contains "${filter}" (of ${all.length}). A typo'd filter must not be a green build.`);
  process.exit(1);
}
console.log(`Rendering ${comps.length} stills…\n`);

const failures = [];
for (const comp of comps) {
  // Render the frame the effect's own meta nominates as its most representative.
  const frame = checkFrames.get(comp.id) ?? Math.round(comp.durationInFrames * 0.62);
  try {
    await renderStill({
      composition: comp,
      serveUrl,
      output: join(OUT, `${comp.id}.png`),
      frame,
      scale: 0.35,
      chromiumOptions: {gl: 'angle'},
      overwrite: true,
    });
    const poster = posterFrames.get(comp.id);
    if (poster !== undefined) {
      await renderStill({
        composition: comp,
        serveUrl,
        output: join(POSTERS, `${comp.id}.png`),
        frame: poster,
        scale: 0.35,
        chromiumOptions: {gl: 'angle'},
        overwrite: true,
      });
    }
    process.stdout.write(`  ok    ${comp.id}${poster !== undefined ? ` (+poster @${poster})` : ''}\n`);
  } catch (err) {
    failures.push({id: comp.id, message: String(err).split('\n')[0]});
    process.stdout.write(`  FAIL  ${comp.id}\n`);
  }
}

console.log(`\n${comps.length - failures.length}/${comps.length} rendered.`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  ${f.id}\n    ${f.message}`);
  process.exit(1);
}
