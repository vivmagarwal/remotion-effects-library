#!/usr/bin/env node
/**
 * Flags effects whose checkFrame renders identically to a frame 6 later — which
 * means the nominated "mid-flight" frame is actually a static hold, and the
 * gallery poster (and the prompt's verification step) prove nothing.
 *
 * It used to end on a console.log with no exit code, so `npm run check:frames`
 * was green whether every effect was dead or none was. README called it a gate.
 */
import {bundle} from '@remotion/bundler';
import {getCompositions, renderStill} from '@remotion/renderer';
import {readFileSync, mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {ROOT, OUT_DIR} from './lib/fs.mjs';
import {compositionFrames} from './lib/meta.mjs';

const TMP = join(OUT_DIR, 'deadcheck');
mkdirSync(TMP, {recursive: true});

/**
 * Every composition's own check frame — variants included. Keyed by effect id,
 * this map matched none of the 89 variant compositions, and the loop below
 * skipped what it could not find: a variant that never moved was never caught.
 */
const checkFrames = await compositionFrames();

const serveUrl = await bundle({entryPoint: join(ROOT, 'src/index.ts'), onProgress: () => undefined});
const comps = await getCompositions(serveUrl);
const md5 = (p) => createHash('md5').update(readFileSync(p)).digest('hex');

const dead = [];
for (const c of comps) {
  const f = checkFrames.get(c.id)?.checkFrame;
  if (!Number.isFinite(f)) continue;
  const other = Math.min(c.durationInFrames - 1, f + 6);
  if (other === f) continue;
  const a = join(TMP, `${c.id}-a.png`);
  const b = join(TMP, `${c.id}-b.png`);
  const opts = {composition: c, serveUrl, scale: 0.3, chromiumOptions: {gl: 'angle'}, overwrite: true};
  await renderStill({...opts, output: a, frame: f});
  await renderStill({...opts, output: b, frame: other});
  if (md5(a) === md5(b)) {
    dead.push(`${c.id} (checkFrame ${f} is identical to ${other} — nothing is moving)`);
    console.log(`  DEAD  ${c.id} @ ${f}`);
  } else {
    console.log(`  live  ${c.id} @ ${f}`);
  }
}

console.log(
  dead.length
    ? `\n${dead.length} effect(s) with a dead check frame:\n  ${dead.join('\n  ')}`
    : '\nAll check frames show motion.',
);
process.exit(dead.length ? 1 : 0);
