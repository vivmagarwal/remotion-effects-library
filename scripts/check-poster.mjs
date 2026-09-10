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
import {gate} from './lib/gate.mjs';

const FLOORS = {
  mean: 0.004, // essentially black
  std: 0.016, // a flat field
  ink: 0.002, // fraction of pixels above L 0.25
  edge: 0.0003, // no structure at all
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

/**
 * Prove the floors still reject an empty frame, on every run.
 *
 * This gate loosened by half after its edge floor produced twelve false
 * failures, and a floor lowered to stop false alarms is one step from a floor
 * that catches nothing — the original bug it exists for, a wholly black poster
 * in a public gallery, would come straight back and the gate would still print
 * a reassuring green line. So it re-derives its own teeth here instead of
 * asserting them in a comment.
 */
const synth = (fn) => {
  const width = 384;
  const height = 216;
  const channels = 3;
  const data = new Uint8Array(width * height * channels);
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const [r, gr, b] = fn(px, py, width, height);
      const o = (py * width + px) * channels;
      data[o] = r;
      data[o + 1] = gr;
      data[o + 2] = b;
    }
  }
  return luminanceStats({width, height, channels, data});
};

const EMPTY_FRAMES = [
  ['pure black', () => [0, 0, 0]],
  ['the house ground, alone', () => [10, 11, 16]],
  ['a flat mid grey', () => [128, 128, 128]],
  [
    'a dark radial gradient',
    (px, py, w, h) => {
      const d = Math.hypot(px - w / 2, py - h / 2) / Math.hypot(w / 2, h / 2);
      const v = Math.round(40 * (1 - d));
      return [v, v, v + 6];
    },
  ],
  [
    'one small dot',
    (px, py, w, h) => (Math.hypot(px - w / 2, py - h / 2) < 3 ? [255, 255, 255] : [10, 11, 16]),
  ],
];

for (const [name, fn] of EMPTY_FRAMES) {
  const st = synth(fn);
  const caught =
    st.mean < FLOORS.mean || st.std < FLOORS.std || st.ink < FLOORS.ink || st.edge < FLOORS.edge;
  if (!caught) {
    g.fail(
      'scripts/check-poster.mjs',
      `the floors no longer reject "${name}" — mean ${st.mean.toFixed(5)}, sd ${st.std.toFixed(5)}, ` +
        `ink ${st.ink.toFixed(5)}, edge ${st.edge.toFixed(6)}. This gate can no longer fail.`,
    );
  }
}

const skipped = walkEffects().length - found.length;
if (skipped > 0) g.note(`${skipped} effect(s) have no still on disk yet — not checked.`);

g.done(
  `${looked} poster(s) read from disk; none is blank, black or flat, ` +
    `and the floors still reject all ${EMPTY_FRAMES.length} synthesised empty frames.`,
);
