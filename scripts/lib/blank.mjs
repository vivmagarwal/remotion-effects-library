/**
 * One definition of "this frame is empty", shared by every gate that needs one.
 *
 * There were two, and they disagreed. `check:poster` used four floors —
 * mean/sd/ink/edge — calibrated against the library; `check:themes` used `ink`
 * alone, and `ink` alone reported a perfectly good frame as blank the first time
 * a theme darkened its palette: `voronoi-shatter` under the editorial theme has
 * mean 0.104, sd 0.046 and visible structure everywhere, and not one pixel above
 * L 0.25, because an editorial palette is a deeper palette.
 *
 * `ink` is dropped entirely. It was the tightest floor against a healthy frame
 * (0.002 against a measured minimum of 0.00465) and it catches nothing the other
 * three miss — every empty frame below is caught without it.
 *
 * The floors sit at roughly half the lowest value a healthy poster produces:
 *
 *     mean  min 0.00883 (typewriter-terminal)      floor 0.004
 *     std   min 0.03258 (dot-grid-pulse)           floor 0.016
 *     edge  min 0.00060 (transition-sampler)       floor 0.0003
 *
 * KNOWN LIMIT: a BRIGHT smooth gradient passes all three. `edge` cannot separate
 * "a gradient whose content failed to mount" from "a deliberately clean frame"
 * at any threshold on this library, so it is only a backstop against a frame
 * with no structure at all.
 */
export const FLOORS = {
  mean: 0.004, // essentially black
  std: 0.016, // a flat field
  edge: 0.0003, // no structure at all
};

/** `null` if the frame has content, otherwise why it counts as empty. */
export const blankReason = (stats) => {
  if (stats.mean < FLOORS.mean) return `essentially black (mean luminance ${stats.mean.toFixed(4)} < ${FLOORS.mean})`;
  if (stats.std < FLOORS.std) return `a flat field (luminance sd ${stats.std.toFixed(4)} < ${FLOORS.std})`;
  if (stats.edge < FLOORS.edge) return `no structure at all (edge energy ${stats.edge.toFixed(5)} < ${FLOORS.edge})`;
  return null;
};

/**
 * Frames that are empty, to prove the floors still reject one.
 *
 * These floors loosened by half after producing twelve false failures, and a
 * floor lowered to stop false alarms is one step from a floor that catches
 * nothing — the original bug, a wholly black poster in a public gallery, would
 * come back and the gate would still print a reassuring green line. So a caller
 * re-derives the teeth on every run rather than trusting this comment.
 */
export const EMPTY_FRAMES = [
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
  ['one small dot', (px, py, w, h) => (Math.hypot(px - w / 2, py - h / 2) < 3 ? [255, 255, 255] : [10, 11, 16])],
];

/** Rasterise one of the frames above into the shape `luminanceStats` takes. */
export const synth = (fn, width = 384, height = 216) => {
  const channels = 3;
  const data = new Uint8Array(width * height * channels);
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const [r, g, b] = fn(px, py, width, height);
      const o = (py * width + px) * channels;
      data[o] = r;
      data[o + 1] = g;
      data[o + 2] = b;
    }
  }
  return {width, height, channels, data};
};

/** Names of any EMPTY_FRAMES the floors would now let through. */
export const missedEmpties = (luminanceStats) =>
  EMPTY_FRAMES.filter(([, fn]) => blankReason(luminanceStats(synth(fn))) === null).map(([name]) => name);
