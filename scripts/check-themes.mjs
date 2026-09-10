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
import {blankReason, missedEmpties} from './lib/blank.mjs';
import {gate, rel} from './lib/gate.mjs';

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
const tokensMissing = (reach) => reach.tokens.length === 0;

const isBrandMimicry = (tsxPath) => readFileSync(tsxPath, 'utf8').includes('palette: brand-mimicry');

/**
 * Whether this theme has anything to say to this component.
 *
 * Three effects "failed" to change under `studio` and every one was correct:
 * they are written in Sora, `studio`'s text face IS Sora, and the only token
 * they declare is `text`. Nothing was broken; there was simply nothing to
 * change. Demanding movement there is demanding that a theme differ from a file
 * that already agrees with it.
 *
 * So the question is answered before rendering, by arithmetic. `check:theme`
 * guarantees every non-font inline default IS the house value, so a colour or
 * number token can move exactly when the theme's value differs from the house
 * one. A font token defaults to the file's OWN loaded family — by design, so a
 * pasted file keeps the face it was written for — so it can move exactly when
 * the theme names a family the file does not already load.
 */
const FONT_TOKENS = new Set(['display', 'text', 'mono', 'hand']);
const sameFamily = (a, b) => String(a).replace(/\s+/g, '').toLowerCase() === String(b).replace(/\s+/g, '').toLowerCase();

const themeReach = (src, themed, house) => {
  const block = src.match(/\ntype Theme = \{([\s\S]*?)\n\};/);
  const tokens = block ? [...block[1].matchAll(/readonly (\w+)\??:/g)].map((m) => m[1]) : [];
  const families = [...src.matchAll(/@remotion\/google-fonts\/(\w+)/g)].map((m) => m[1]);
  const moved = tokens.filter((t) =>
    FONT_TOKENS.has(t)
      ? !families.some((f) => sameFamily(f, themed[t]))
      : JSON.stringify(themed[t]) !== JSON.stringify(house[t]),
  );
  return {tokens, moved};
};

const {THEMES, HOUSE} = await import('../src/theme.ts');
const names = Object.keys(THEMES).filter((n) => (ONLY ? n === ONLY : true));
if (names.length === 0) throw new Error(`check:themes: no theme called "${ONLY}"`);

const {bundle} = await import('@remotion/bundler');
const {selectComposition, renderStill} = await import('@remotion/renderer');
const {themeFor} = await import('../src/theme.ts');

const dir = join(OUT_DIR, 'theme');
mkdirSync(dir, {recursive: true});
const serveUrl = await bundle({entryPoint: './src/index.ts', onProgress: () => {}});

/**
 * One render, at the scale the poster gate uses — enough to see a palette.
 *
 * Retried once. Across 480 renders exactly one failed, with "NetworkError: A
 * network error occurred" while fetching a font — a transient that says nothing
 * about the theme. A gate that reports a flake as a defect gets read as noisy
 * and then not read.
 */
const shoot = async (id, frame, inputProps, out) => {
  for (let attempt = 0; ; attempt++) {
    try {
      const composition = await selectComposition({serveUrl, id, inputProps});
      await renderStill({
        composition, serveUrl, output: out, inputProps,
        frame: Math.min(frame, composition.durationInFrames - 1),
        scale: 0.4, chromiumOptions: {gl: 'angle'}, logLevel: 'error',
      });
      return;
    } catch (err) {
      const transient = /NetworkError|ERR_|socket hang up|ECONN/i.test(String(err?.message ?? err));
      if (attempt >= 1 || !transient) throw err;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
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


/**
 * `--probe`: does every token a component DECLARES actually reach the picture?
 *
 * The theme sweep above can only see an effect that no theme moves at all. It
 * cannot see one broken token among five, and that is the common shape: a file
 * declares `accent`, defaults `accentColor` from it, and then paints one rule
 * with a literal. Every theme still moves the frame — through the typeface, or
 * the ground — and the dead token hides behind the live ones. Verified by
 * pinning `quote-slam`'s accent to a literal: the sweep passed.
 *
 * So this asks the question one token at a time, with a probe theme that changes
 * exactly one of them to a value nothing could be mistaken for.
 *
 * WHAT IT CANNOT TELL YOU: a token can be wired correctly and still not show at
 * the frame being rendered — an `accentInk` that only appears on a badge shown
 * at frame 20 is invisible at frame 108, and reads here exactly like a token
 * that was never used. So the output is a REPORT, to be read by a person, not a
 * gate. Every line is a question, not a verdict.
 */
const PROBE = {
  scheme: 'light',
  bg: '#ff00ff', bgDeep: '#ff00ff', paper: '#ff00ff', surface: '#ff00ff',
  ink: '#ff00ff', body: '#ff00ff', muted: '#ff00ff',
  paperInk: '#ff00ff', paperMuted: '#ff00ff',
  accent: '#ff00ff', accentInk: '#ff00ff', accentOnPaper: '#ff00ff',
  pair: '#ff00ff',
  series: ['#ff00ff', '#ff00ff', '#ff00ff', '#ff00ff', '#ff00ff', '#ff00ff'],
  display: 'Times New Roman', text: 'Times New Roman',
  mono: 'Times New Roman', hand: 'Times New Roman',
  radius: 0, stroke: 12, roughness: 0, safe: 300,
};

if (process.argv.includes('--probe')) {
  const dead = [];
  let probed = 0;
  for (const {meta, tsxPath} of targets) {
    const frame = meta.posterFrame ?? meta.checkFrame;
    const src = readFileSync(tsxPath, 'utf8');
    const block = src.match(/\ntype Theme = \{([\s\S]*?)\n\};/);
    const tokens = block ? [...block[1].matchAll(/readonly (\w+)\??:/g)].map((m) => m[1]) : [];
    const base = join(dir, `${meta.id}--authored.png`);
    if (!existsSync(base)) await shoot(meta.id, frame, {}, base);
    const authored = decodePng(base);

    for (const token of tokens) {
      const out = join(dir, `probe-${meta.id}--${token}.png`);
      try {
        await shoot(meta.id, frame, {theme: {...HOUSE, [token]: PROBE[token]}}, out);
      } catch (err) {
        process.stdout.write(`  ERROR  ${meta.id} ${token}: ${String(err.message ?? err).split('\n')[0].slice(0, 90)}\n`);
        continue;
      }
      probed++;
      const moved = meanAbsDiff(decodePng(out), authored);
      if (moved === 0) dead.push(`${meta.id}.${token}`);
    }
    process.stderr.write('.');
  }
  process.stderr.write('\n');
  process.stdout.write(
    `\n  ${probed} token probes; ${dead.length} declared token(s) changed nothing at the check frame:\n`,
  );
  for (const d of dead) process.stdout.write(`    ${d}\n`);
  process.stdout.write(
    `\n  Each is a QUESTION: either the component paints that token with a literal, or the token\n` +
      `  is only visible at some other frame. Look at the frame before changing anything.\n`,
  );
  process.exit(0);
}

let checked = 0;
for (const {meta, tsxPath} of targets) {
  const frame = meta.posterFrame ?? meta.checkFrame;
  const mimicry = isBrandMimicry(tsxPath);
  const src = readFileSync(tsxPath, 'utf8');
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
    const stats = luminanceStats(img);
    const moved = meanAbsDiff(img, authored);
    const reach = themeReach(src, themeFor(THEMES[name], meta.ground), HOUSE);
    checked++;

    if (REPORT) {
      report.push({id: meta.id, theme: name, moved, ink: stats.ink, reach: reach.moved.length});
      continue;
    }
    const why = blankReason(stats);
    if (why) {
      g.fail(`${meta.id} + ${name}: renders ${why} — ${out}`);
    } else if (tokensMissing(reach)) {
      g.fail(
        `${meta.id} + ${name}: the component declares no theme tokens at all, so no theme can ` +
          `reach it — ${rel(tsxPath)}`,
      );
    } else if (name === 'house' && moved > HOUSE_MAX) {
      g.fail(
        `${meta.id} + house: moved ${moved.toFixed(4)} — house IS the authored look, so an ` +
          `inline default disagrees with src/theme.ts — ${out}`,
      );
    } else if (name !== 'house' && moved === 0 && !mimicry && reach.moved.length > 0) {
      g.fail(
        `${meta.id} + ${name}: sets ${reach.moved.map((t) => `\`${t}\``).join(', ')} to a different ` +
          `value and the frame did not change by one pixel — the token is declared and the ` +
          `component paints with a literal — ${out}`,
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

for (const name of missedEmpties(luminanceStats)) {
  g.fail('scripts/lib/blank.mjs', `the floors no longer reject "${name}". This gate can no longer fail.`);
}

g.done(
  `${checked} themed render(s) across ${names.length} theme(s) — every theme that has something ` +
    `to change, changes it, and none of them renders an effect blank`,
);
