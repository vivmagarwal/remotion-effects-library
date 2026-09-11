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
import {ROOT, OUT_DIR} from './lib/fs.mjs';
import {compositionFrames} from './lib/meta.mjs';

const OUT = join(OUT_DIR, 'verify');
const filter = process.argv[2] ?? '';

mkdirSync(OUT, {recursive: true});

/**
 * The frame each COMPOSITION nominates — variants included.
 *
 * This map used to be keyed by effect id, built from a text parse of meta.ts.
 * The 89 variant compositions therefore matched nothing and fell through to the
 * `durationInFrames * 0.62` fallback below, so a variant's own `checkFrame` was
 * never honoured and no variant poster was ever rendered — which left
 * `check:poster` with nothing to look at for every card but the parent's.
 */
const frames = await compositionFrames();
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
  // Render the frame the composition's own meta nominates as most representative.
  const nominated = frames.get(comp.id);
  const frame = Number.isFinite(nominated?.checkFrame)
    ? nominated.checkFrame
    : Math.round(comp.durationInFrames * 0.62);
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
    // The poster is the frame the gallery card actually shows. Render it when it
    // differs from the check frame, so `check:poster` sees what a visitor sees.
    const poster =
      Number.isFinite(nominated?.poster) && nominated.poster !== frame ? nominated.poster : undefined;
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
