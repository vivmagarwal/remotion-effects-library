#!/usr/bin/env node
/**
 * Gate: every theme must reach every effect, and none of them may break one.
 *
 * `check:theme` is static — it proves each component declares tokens that exist
 * in `src/theme.ts` and inlines the house value as its default. That is the
 * contract, and a component can honour it and still not be themed: declare a
 * token, default a prop from it, then paint with a hard-coded literal instead.
 * Nothing static can tell the difference, because both files read the same.
 *
 * So this renders. For each theme it renders every composition and checks two
 * things:
 *
 *   1. It still renders, and the frame is not blank. A theme that swaps a light
 *      ground under an effect that draws white type produces a technically
 *      successful render of nothing.
 *   2. It CHANGED. A non-house theme moves the accent, the ground and the
 *      typeface, so a frame identical to the authored one means the theme
 *      reached nothing — which is the failure that looks like success.
 *
 * `house` is exempt from (2) and inverted: it is the authored look written down,
 * so passing it must be a no-op, and a DIFFERENCE there is the bug.
 *
 *   npm run check:themes
 *   npm run check:themes -- --only broadsheet
 *   npm run check:themes -- --report      # print every score, fail on none
 */
import {mkdirSync, writeFileSync, readFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {OUT_DIR, walkEffects} from './lib/fs.mjs';
import {readMeta} from './lib/meta.mjs';
import {decodePng, luminanceStats, meanAbsDiff} from './lib/png.mjs';
import {gate} from './lib/gate.mjs';

const g = gate('check:themes');
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
};
const ONLY = arg('only', null);
const REPORT = process.argv.includes('--report');
const report = [];

/** Below this a themed frame is blank on its own terms. */
const INK_MIN = 0.0008;
/**
 * A non-house theme has to move the picture at all. Not by some amount — AT ALL.
 *
 * A threshold was the first instinct and it is the wrong instrument. The honest
 * spread across 96 effects x 3 themes runs from 0.89 down to 0.0001, because a
 * theme legitimately reaches most of one frame and one rule of another: an
 * effect that is 95% footage with a single accent line is correctly themed and
 * scores near zero. Any threshold that failed those would be reporting good work
 * as broken. Exactly zero is the only value that means something on its own —
 * the theme reached nothing, not one pixel — and that is the bug worth a gate.
 */

/**
 * How much `house` may move the picture.
 *
 * NOT zero. `house` is the authored look written down for COLOUR but not for
 * TYPE: an effect written in Anton inlines its own loaded family as `text`, and
 * passing the house theme swaps it for Inter. That is the documented behaviour —
 * "as authored" is not the house theme — and it moves glyphs without moving
 * anything else. 61 of 96 move exactly 0; the largest typeface-only swap
 * measured 0.0622.
 */
const HOUSE_MAX = 0.1;

/**
 * Effects that recreate someone else's product, and are therefore exempt from
 * having to change.
 *
 * A ChatGPT window themed in violet is not a themed effect, it is a wrong
 * screenshot. These files already declare themselves with the palette gate's
 * `brand-mimicry` marker, so the exemption is read from the file rather than
 * kept as a second list that would drift out of step with the first.
 */
const isBrandMimicry = (tsxPath) => readFileSync(tsxPath, 'utf8').includes('palette: brand-mimicry');

const {THEMES} = await import('../src/theme.ts');
const names = Object.keys(THEMES).filter((n) => (ONLY ? n === ONLY : true));
if (names.length === 0) throw new Error(`check:themes: no theme called "${ONLY}"`);

const {bundle} = await import('@remotion/bundler');
const {selectComposition, renderStill} = await import('@remotion/renderer');
const {themeFor} = await import('../src/theme.ts');

const dir = join(OUT_DIR, 'theme');
mkdirSync(dir, {recursive: true});
const serveUrl = await bundle({entryPoint: './src/index.ts', onProgress: () => {}});

/** One render, at the scale the poster gate uses — enough to see a palette. */
const shoot = async (id, frame, inputProps, out) => {
  const composition = await selectComposition({serveUrl, id, inputProps});
  await renderStill({
    composition, serveUrl, output: out, inputProps,
    frame: Math.min(frame, composition.durationInFrames - 1),
    scale: 0.4, chromiumOptions: {gl: 'angle'}, logLevel: 'error',
  });
};

/**
 * The 96 effect FOLDERS, read the way every other gate reads them.
 *
 * Not `src/registry.generated.ts`: importing it pulls in 96 `.tsx` files and
 * Node strips types but not JSX. The variants are not the subject here anyway —
 * a variant is the same component with different props, and it is the component
 * that either honours a theme or does not.
 */
const targets = walkEffects().map((e) => ({meta: readMeta(e.metaPath), tsxPath: e.tsxPath}));
process.stderr.write(`  ${targets.length} effects x ${names.length} theme(s)\n`);

let checked = 0;
for (const {meta, tsxPath} of targets) {
  const frame = meta.posterFrame ?? meta.checkFrame;
  const mimicry = isBrandMimicry(tsxPath);
  const base = join(dir, `${meta.id}--authored.png`);
  try {
    if (!existsSync(base)) await shoot(meta.id, frame, {}, base);
  } catch (err) {
    g.fail(`${meta.id}: fails to render even as authored — ${String(err.message ?? err).split('\n')[0]}`);
    continue;
  }
  const authored = decodePng(base);

  for (const name of names) {
    const out = join(dir, `${meta.id}--${name}.png`);
    try {
      await shoot(meta.id, frame, {theme: themeFor(THEMES[name], meta.ground)}, out);
    } catch (err) {
      g.fail(`${meta.id} + ${name}: ${String(err.message ?? err).split('\n')[0].slice(0, 160)}`);
      continue;
    }
    const img = decodePng(out);
    const {ink} = luminanceStats(img);
    const moved = meanAbsDiff(img, authored);
    checked++;

    if (REPORT) {
      report.push({id: meta.id, theme: name, moved, ink});
      continue;
    }
    if (ink < INK_MIN) {
      g.fail(`${meta.id} + ${name}: renders blank (ink ${ink.toFixed(5)}) — ${out}`);
    } else if (name === 'house' && moved > HOUSE_MAX) {
      g.fail(
        `${meta.id} + house: moved ${moved.toFixed(4)} — house IS the authored look, so an ` +
          `inline default disagrees with src/theme.ts — ${out}`,
      );
    } else if (name !== 'house' && moved === 0 && !mimicry) {
      g.fail(
        `${meta.id} + ${name}: the theme changed NOTHING — not one pixel. Either every token it ` +
          `declares is identical in this theme, or the tokens are declared and the component ` +
          `paints with literals — ${out}`,
      );
    }
  }
  process.stderr.write('.');
}
process.stderr.write('\n');

if (REPORT) {
  report.sort((a, b) => a.moved - b.moved);
  for (const r of report) {
    process.stdout.write(`  ${r.moved.toFixed(4)}  ink ${r.ink.toFixed(5)}  ${r.theme.padEnd(11)} ${r.id}\n`);
  }
  process.exit(0);
}

g.done(`${checked} themed render(s) across ${names.length} theme(s) — every theme reaches every effect`);
