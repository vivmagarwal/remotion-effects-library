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
 * CALIBRATION. Every floor sits at roughly HALF the lowest value a healthy
 * poster in this library actually produces, measured across all 96:
 *
 *     mean  min 0.00883 (typewriter-terminal)      floor 0.004
 *     std   min 0.03258 (dot-grid-pulse)           floor 0.016
 *     ink   min 0.00465 (dot-grid-pulse)           floor 0.002
 *     edge  min 0.00060 (transition-sampler)       floor 0.0003
 *
 * They were previously set just under those minima — mean within 10%, ink within
 * 16% — and the edge floor had already crossed: 12 of 96 posters failed it, and
 * every one of the 12 was a good frame. Twelve clean designs, mostly a few large
 * shapes or one line of type on a plain ground, which is low edge DENSITY and
 * high quality. A gate whose failures are all false is worse than no gate,
 * because the response to it is to stop reading it.
 *
 * WHAT EACH FLOOR ACTUALLY CATCHES, measured against synthesised frames:
 *
 *     pure black                    mean 0        -> mean
 *     the house ground, alone       mean 0.0034   -> mean
 *     a flat mid grey               std 0         -> std
 *     a dark radial gradient        std 0.0044    -> std
 *     one small white dot           mean 0.0037   -> mean, and ink 0.0003
 *
 * KNOWN LIMIT: a BRIGHT smooth gradient passes all four — it scores edge
 * 0.00115, higher than four real posters, along with a healthy mean, sd and ink.
 * `edge` cannot separate "a gradient where the content failed to mount" from "a
 * deliberately clean frame", at any threshold, on this library. So it is kept
 * only as a backstop against a frame with no structure at all; the blank, black
 * and flat cases are caught by mean/std/ink, which are the sharper instruments.
 */
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {OUT_DIR, walkEffects} from './lib/fs.mjs';
import {readMeta} from './lib/meta.mjs';
import {decodePng, luminanceStats} from './lib/png.mjs';
import {EMPTY_FRAMES, blankReason, missedEmpties} from './lib/blank.mjs';
import {gate} from './lib/gate.mjs';

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
  const where = `out/${dir}/${meta.id}.png`;
  const why = blankReason(stats);
  if (why) g.fail(where, `${meta.id}: poster is ${why}`);
}

/**
 * Prove the floors still reject an empty frame, on every run — see
 * `scripts/lib/blank.mjs` for why this is re-derived rather than asserted.
 */
for (const name of missedEmpties(luminanceStats)) {
  g.fail('scripts/lib/blank.mjs', `the floors no longer reject "${name}". This gate can no longer fail.`);
}

const skipped = walkEffects().length - found.length;
if (skipped > 0) g.note(`${skipped} effect(s) have no still on disk yet — not checked.`);

g.done(
  `${looked} poster(s) read from disk; none is blank, black or flat, ` +
    `and the floors still reject all ${EMPTY_FRAMES.length} synthesised empty frames.`,
);
