#!/usr/bin/env node
/**
 * Gate: a poster frame must not be blank, black, or a flat field.
 *
 * `pixel-dissolve-reveal` shipped an entirely black poster in a public gallery
 * and passed every gate: nothing ever looked at the pixels, and `posterFrame`
 * itself was rendered by no gate at all.
 *
 * Deliberately does NOT render. It reads stills that are already on disk — from
 * `npm run verify` (out/verify/<id>.png) or from an explicit poster render
 * (out/poster/<id>.png) — and skips cleanly when there are none, so it is a
 * fast gate that gets teeth the moment the slow gate has run:
 *
 *   npm run verify && npm run check:poster
 *
 * Thresholds are calibrated on this library: they fail the two known-broken
 * posters and pass the deliberately dark ones (globe-arcs 0.0163,
 * light-leak-transition 0.0181).
 */
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {OUT_DIR, walkEffects} from './lib/fs.mjs';
import {readMeta} from './lib/meta.mjs';
import {decodePng, luminanceStats} from './lib/png.mjs';
import {gate} from './lib/gate.mjs';

const FLOORS = {
  mean: 0.008, // essentially black
  std: 0.02, // a flat field
  ink: 0.004, // fraction of pixels above L 0.25
  edge: 0.0015, // almost no structure
};

/**
 * Where a still might already be, best first. Only gate-produced directories —
 * `out/check/` is the scratch path the composed prompt hands to a blind agent
 * (`--output=out/check.png`), so anything in there is somebody's experiment, not
 * this library's poster.
 */
const SEARCH = ['poster', 'verify'];

const g = gate('check:poster');

const found = [];
for (const e of walkEffects()) {
  const meta = readMeta(e.metaPath);
  for (const dir of SEARCH) {
    const p = join(OUT_DIR, dir, `${meta.id}.png`);
    if (existsSync(p)) {
      found.push({meta, path: p, dir});
      break;
    }
  }
}

if (found.length === 0) {
  console.log('check:poster: no stills on disk under out/{poster,verify}/ — skipped.');
  console.log('              run `npm run verify` first to give this gate something to look at.');
  process.exit(0);
}

let looked = 0;
for (const {meta, path, dir} of found) {
  let stats;
  try {
    stats = luminanceStats(decodePng(path));
  } catch (err) {
    g.fail(path.replace(process.cwd() + '/', ''), `could not read the still: ${String(err.message ?? err)}`);
    continue;
  }
  looked++;
  const num = (x) => x.toFixed(4);
  const where = `out/${dir}/${meta.id}.png`;
  if (stats.mean < FLOORS.mean) g.fail(where, `${meta.id}: poster is essentially black (mean luminance ${num(stats.mean)} < ${FLOORS.mean})`);
  else if (stats.std < FLOORS.std) g.fail(where, `${meta.id}: poster is a flat field (luminance sd ${num(stats.std)} < ${FLOORS.std})`);
  else if (stats.ink < FLOORS.ink) g.fail(where, `${meta.id}: only ${(stats.ink * 100).toFixed(2)}% of pixels are above L 0.25`);
  else if (stats.edge < FLOORS.edge) g.fail(where, `${meta.id}: almost no structure (edge energy ${num(stats.edge)} < ${FLOORS.edge})`);
}

const skipped = walkEffects().length - found.length;
if (skipped > 0) g.note(`${skipped} effect(s) have no still on disk yet — not checked.`);

g.done(`${looked} poster(s) read from disk; none is blank, black or flat.`);
