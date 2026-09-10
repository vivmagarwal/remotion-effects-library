#!/usr/bin/env node
/**
 * Gate: every composition must still look right while it is PLAYING.
 *
 * `check:browser` renders each composition through the gallery's <Thumbnail>,
 * which seeks to a single frame. Pressing play is a different code path:
 * @remotion/media mounts a MediaPlayer that drives a WebCodecs VideoDecoder in
 * real time. Both paths can fail on their own, and one of them did — footage
 * that was correct in the still, in `renderStill` and in the gallery's poster
 * grid went black the instant the Player started, while every overlay drawn on
 * top of it kept animating. Nothing in the repo could see it, because nothing
 * in the repo ever pressed play.
 *
 * This does. For each composition it opens `#/play/<id>`, plays for a moment,
 * pauses, screenshots — then unmounts the Player, mounts a <Thumbnail> of the
 * exact frame the Player stopped on, and screenshots that. The reference is
 * therefore the same frame of the same build in the same browser, generated
 * seconds apart, so a diff can only mean the playing path rendered something
 * the seeking path did not.
 *
 *   npm run check:player            # all of them
 *   npm run check:player -- --only speed-ramp
 *   npm run check:player -- --report    # print every diff, fail on none
 */
import {mkdirSync, writeFileSync, existsSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {createRequire} from 'node:module';
import {OUT_DIR} from './lib/fs.mjs';
import {decodePng, luminanceStats, meanAbsDiff} from './lib/png.mjs';
import {gate} from './lib/gate.mjs';

const require_ = createRequire(import.meta.url);
const g = gate('check:player');

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
};
const BASE = arg('base', 'http://localhost:4181');
const ONLY = arg('only', null);
const REPORT = process.argv.includes('--report');
const report = [];

/**
 * How different the playing frame may be from the seeked frame.
 *
 * Deliberately looser than `check:browser`'s 0.06. The two frames here are the
 * same frame NUMBER but not necessarily the same decoded source picture: a
 * MediaPlayer running at wall-clock speed and a Thumbnail seeking cold can land
 * on neighbouring frames of a moving shot, and a hand-drawn or noise-driven
 * effect reseeds per frame. None of that is the failure this looks for. The
 * failure is a black rectangle where a picture should be, which on a 64x64 block
 * average scores 0.25-0.6 — an order of magnitude clear of anything below.
 */
const DIFF_MAX = 0.12;
/** A frame this flat while playing is blank whatever the reference says. */
const INK_MIN = 0.0008;
/** Milliseconds of real playback before the frame is judged. */
const PLAY_MS = 1400;

const shots = join(OUT_DIR, 'play');
mkdirSync(shots, {recursive: true});

const {openBrowser} = require_('@remotion/renderer');
const screenshotPath = join(
  dirname(require_.resolve('@remotion/renderer/package.json')),
  'dist',
  'puppeteer-screenshot.js',
);
if (!existsSync(screenshotPath)) {
  throw new Error(`check:player: @remotion/renderer no longer ships dist/puppeteer-screenshot.js`);
}
const {screenshot} = require_(screenshotPath);

const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
const newPage = () =>
  browser.newPage({
    context: null,
    logLevel: 'error',
    indent: false,
    pageIndex: 0,
    onBrowserLog: null,
    onLog: () => undefined,
  });

const listPage = await newPage();
await listPage.goto({url: `${BASE}/`, timeout: 30000});
const all = await listPage.evaluate(
  `new Promise((res, rej) => {
     const t0 = Date.now();
     const tick = () => {
       if (window.__compositions) return res(JSON.stringify(window.__compositions));
       if (Date.now() - t0 > 20000) return rej(new Error('the gallery never published __compositions'));
       setTimeout(tick, 60);
     };
     tick();
   })`,
);
await listPage.close().catch(() => {});
const only = ONLY ? ONLY.split(',').map((s) => s.trim()).filter(Boolean) : null;
const targets = JSON.parse(all).filter((m) => (only ? only.some((o) => m.id.includes(o)) : true));
process.stderr.write(`  ${targets.length} composition(s) to play\n`);

const settle = (selector) =>
  `new Promise((res, rej) => {
     const t0 = Date.now();
     const tick = () => {
       if (document.querySelector('[data-smoke-error]')) return rej(new Error('harness error slot'));
       if (document.querySelector(${JSON.stringify(selector)})) {
         return document.fonts.ready.then(() =>
           requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(res, 350))),
         );
       }
       if (Date.now() - t0 > 20000) return rej(new Error('stage never mounted'));
       setTimeout(tick, 60);
     };
     tick();
   })`;

/**
 * Screenshot a mounted <Thumbnail> once it has stopped changing.
 *
 * A Thumbnail that contains footage is not finished when it mounts: it has to
 * open a decoder and seek, and until it does it paints the composition's
 * background — which is black for every footage effect in the library. Shooting
 * on a fixed settle caught that empty state for a third of them and reported it
 * as the PLAYER being wrong, which is the exact opposite of the truth. So the
 * reference is shot repeatedly until two consecutive frames agree, which is the
 * only signal available from outside: <Thumbnail> exposes no readiness event,
 * and reading the canvas back is not an option because a WebGL-backed one
 * returns black to drawImage whatever is on screen.
 */
const shootStable = async (page, m, path) => {
  let prev = null;
  for (let attempt = 0; attempt < 12; attempt++) {
    const buf = await screenshot({
      page, type: 'png', omitBackground: false, width: m.width, height: m.height, scale: 1,
    });
    writeFileSync(path, buf);
    const img = decodePng(path);
    if (prev && meanAbsDiff(img, prev) < 0.004 && luminanceStats(img).ink >= INK_MIN) return;
    prev = img;
    await new Promise((r) => setTimeout(r, 400));
  }
};

let checked = 0;
try {
  for (const m of targets) {
    const page = await newPage();
    /** Console errors the page logged while it was playing, for the failure message. */
    const logs = [];
    page.on('console', (e) => {
      if (e.type() === 'error') logs.push(e.text().slice(0, 200));
    });
    page.on('pageerror', (e) => logs.push(String(e?.message ?? e).slice(0, 200)));
    try {
      await page.setViewport({width: m.width, height: m.height, deviceScaleFactor: 1});
      await page.goto({url: `${BASE}/#/play/${encodeURIComponent(m.id)}`, timeout: 30000});
      await page.evaluate(settle('[data-play-mode="player"] canvas, [data-play-mode="player"] svg, [data-play-mode="player"] div'));

      /**
       * Play until the clock actually moves, and only then start the timer.
       *
       * `play()` does not mean playing. Remotion's Player enters a BUFFERING
       * state while any media child is still opening its decoder, and holds the
       * frame at 0 until it clears — on a cold cache that is routinely a second
       * or two for a 3MB clip. Timing from the call instead of from the first
       * moving frame turns a slow disk into a failed gate, which is the kind of
       * flake that gets a gate switched off.
       */
      const stopped = await page.evaluate(
        `new Promise((res, rej) => {
           const t0 = Date.now();
           window.__play.play();
           const tick = () => {
             if (window.__play.frame() > 0) {
               return setTimeout(() => {
                 window.__play.pause();
                 setTimeout(() => res(window.__play.frame()), 250);
               }, ${PLAY_MS});
             }
             if (Date.now() - t0 > 25000) return rej(new Error('the player never left frame 0 — it buffered for 25s'));
             setTimeout(tick, 100);
           };
           setTimeout(tick, 120);
         })`,
      );

      const playPng = join(shots, `${m.id}.play.png`);
      writeFileSync(
        playPng,
        await screenshot({page, type: 'png', omitBackground: false, width: m.width, height: m.height, scale: 1}),
      );

      // Same frame, the other way round.
      await page.evaluate(`window.__play.showThumb(${Number(stopped) || 0}); true`);
      await page.evaluate(settle('[data-play-mode="thumb"] canvas, [data-play-mode="thumb"] svg, [data-play-mode="thumb"] div'));
      const refPng = join(shots, `${m.id}.ref.png`);
      await shootStable(page, m, refPng);

      const play = decodePng(playPng);
      const ref = decodePng(refPng);
      const pStats = luminanceStats(play);
      const diff = meanAbsDiff(play, ref);
      checked++;

      if (REPORT) {
        report.push({id: m.id, frame: Number(stopped) || 0, diff, ink: pStats.ink});
        continue;
      }

      if (Number(stopped) === 0) {
        g.fail(`${m.id}: the player never advanced past frame 0 in ${PLAY_MS}ms`);
      }
      if (pStats.ink < INK_MIN) {
        g.fail(`${m.id}: the playing frame is blank (ink ${pStats.ink.toFixed(5)}) — ${playPng}`);
      } else if (diff > DIFF_MAX) {
        g.fail(
          `${m.id}: playing frame ${stopped} differs from the same frame seeked ` +
            `(${diff.toFixed(4)} > ${DIFF_MAX}) — ${playPng} vs ${refPng}` +
            (logs.length ? `\n      page error: ${logs[0]}` : ''),
        );
      }
    } catch (err) {
      g.fail(`${m.id}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      await page.close().catch(() => {});
    }
  }
} finally {
  await browser.close({silent: true}).catch(() => {});
}

if (REPORT) {
  report.sort((a, b) => b.diff - a.diff);
  for (const r of report) {
    process.stdout.write(`  ${r.diff.toFixed(4)}  ink ${r.ink.toFixed(5)}  f${String(r.frame).padStart(4)}  ${r.id}\n`);
  }
  const ds = report.map((r) => r.diff).sort((a, b) => a - b);
  const q = (p) => ds[Math.min(ds.length - 1, Math.floor(ds.length * p))] ?? 0;
  process.stdout.write(
    `\n  median ${q(0.5).toFixed(4)}  p90 ${q(0.9).toFixed(4)}  p99 ${q(0.99).toFixed(4)}  max ${(ds.at(-1) ?? 0).toFixed(4)}\n`,
  );
  process.exit(0);
}

g.done(`${checked} composition(s) played and matched their own seeked frame`);
