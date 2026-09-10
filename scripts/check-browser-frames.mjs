#!/usr/bin/env node
/**
 * Gate: every composition must look the same in a BROWSER as it does in
 * `renderStill`.
 *
 * Every other gate in this repo renders through `renderStill`. Two bugs shipped
 * that were only wrong outside it, and both reached a human before a gate:
 *
 *   1. `VizGallery` framed with an SVG `viewBox` measured from `world.getBBox()`
 *      — world coordinates — while a viewBox lives in the space the world
 *      group's transform maps INTO. Those coincide only while the camera is
 *      identity, and it was identity only because Remotion mounts a composition
 *      inside a 0x0 wrapper during the layout pass, so `measure()` saw 0x0.
 *      Stills were perfect; every browser put the diagram off its own viewBox.
 *   2. The gallery's `<Player>`/`<Thumbnail>` took no `inputProps`, so 85 of
 *      181 compositions rendered the component defaults under 85 names. Stills
 *      were driven from the registry, so they were right too.
 *
 * The common shape: `renderStill` is the environment where the bug cancels out.
 * So this gate renders the frame the gallery actually shows — through the
 * gallery's own `<Thumbnail>`, at `#/frame/<id>` — and diffs it against
 * `out/poster/<id>.png`. Same Chrome, same React tree; a healthy pair differs
 * only by antialiasing.
 *
 * Needs the gallery built and served:
 *   npm run build:gallery && npx vite preview --port 4180 --strictPort &
 *   node scripts/check-browser-frames.mjs --base http://localhost:4180
 *
 * `npm run check:browser` does all of that.
 */
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {createRequire} from 'node:module';
import {OUT_DIR} from './lib/fs.mjs';
import {decodePng, luminanceStats, meanAbsDiff} from './lib/png.mjs';
import {gate} from './lib/gate.mjs';

const require_ = createRequire(import.meta.url);
const g = gate('check:browser');

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
};
const BASE = arg('base', 'http://localhost:4180');
const ONLY = arg('only', null);
/** Print every diff instead of failing — how the threshold below was calibrated. */
const REPORT = process.argv.includes('--report');
const report = [];

/**
 * Mean absolute luminance difference we accept between the two renderers.
 *
 * Antialiasing and font hinting differ slightly between a headless screenshot
 * and Remotion's own capture, and video frames can land a decode apart. 0.02 is
 * roughly twenty times the noise floor measured across this library and roughly
 * a tenth of what either real bug produced.
 */
const DIFF_MAX = 0.02;
/** Below this the browser frame is blank on its own terms, whatever the still says. */
const INK_MIN = 0.0008;

const shots = join(OUT_DIR, 'browser');
/**
 * Its OWN reference directory, not `out/poster`.
 *
 * `out/poster` is written by `verify` and by ad-hoc one-off renders at whatever
 * scale someone needed that day. Diffing against it produced size mismatches
 * for a third of the library and reported them as "no comparison possible",
 * which reads like a gate working when it is a gate checking nothing. Every
 * still in here is rendered by this script, at scale 1, from the build it is
 * about to compare against.
 */
const stills = join(OUT_DIR, 'ref');
mkdirSync(shots, {recursive: true});
mkdirSync(stills, {recursive: true});

const {openBrowser} = require_('@remotion/renderer');
/**
 * Remotion has a working headless screenshot and does not export it — neither
 * from the package root nor through the `exports` map, so a subpath require is
 * refused with ERR_PACKAGE_PATH_NOT_EXPORTED. An absolute path bypasses the
 * map, which is the only way in without adding puppeteer as a second browser.
 *
 * If Remotion moves the file this throws HERE, at startup, and the gate fails
 * loudly. That is the point: a screenshot gate that silently stopped taking
 * screenshots would be worse than not having one.
 */
const screenshotPath = join(
  dirname(require_.resolve('@remotion/renderer/package.json')),
  'dist',
  'puppeteer-screenshot.js',
);
if (!existsSync(screenshotPath)) {
  throw new Error(
    `check:browser: @remotion/renderer no longer ships dist/puppeteer-screenshot.js (looked in ${screenshotPath}).`,
  );
}
const {screenshot} = require_(screenshotPath);

const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
let checked = 0;

/**
 * The list comes from the page, not from a JSON a script re-derived. The gate
 * is asking "does what a viewer opens match the still", so the set of things a
 * viewer can open has to be read from the thing that renders them.
 */
const listPage = await browser.newPage({context: null, logLevel: 'error', indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => undefined});
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
const targets = JSON.parse(all).filter((m) => (ONLY ? m.id.includes(ONLY) : true));
process.stderr.write(`  ${targets.length} composition(s) to check\n`);

// Reference stills, rendered here so the two frames are always the same frame
// of the same build. Cached across runs: rendering 181 at full size is minutes.
const {bundle} = await import('@remotion/bundler');
const {getCompositions, renderStill} = await import('@remotion/renderer');
const serveUrl = await bundle({entryPoint: './src/index.ts', onProgress: () => {}});
const comps = new Map((await getCompositions(serveUrl)).map((c) => [c.id, c]));

try {
  for (const m of targets) {
    const page = await browser.newPage({context: null, logLevel: 'error', indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => undefined});
    try {
      await page.setViewport({width: m.width, height: m.height, deviceScaleFactor: 1});
      await page.goto({url: `${BASE}/#/frame/${encodeURIComponent(m.id)}`, timeout: 30000});
      // The composition has to mount, load its fonts and settle. Thumbnail
      // resolves its own delayRender()s before it paints, so wait for the stage
      // to exist and then give the frame a beat.
      await page.evaluate(
        `new Promise((res, rej) => {
           const t0 = Date.now();
           const tick = () => {
             if (document.querySelector('[data-smoke-error]')) return rej(new Error('harness error slot'));
             if (document.querySelector('[data-smoke-stage] canvas, [data-smoke-stage] svg, [data-smoke-stage] div')) {
               return setTimeout(res, 900);
             }
             if (Date.now() - t0 > 20000) return rej(new Error('stage never mounted'));
             setTimeout(tick, 60);
           };
           tick();
         })`,
      );

      const out = join(shots, `${m.id}.png`);
      const buf = await screenshot({
        page, type: 'png', omitBackground: false,
        width: m.width, height: m.height, scale: 1,
      });
      writeFileSync(out, buf);

      const browserImg = decodePng(out);
      const bStats = luminanceStats(browserImg);
      checked++;

      if (bStats.ink < INK_MIN) {
        g.fail(`out/browser/${m.id}.png`, `${m.id}: the browser frame is blank (ink ${(bStats.ink * 100).toFixed(3)}%)`, [
          'The gallery shows this. Whatever renderStill produces is not what a viewer sees.',
        ]);
        continue;
      }

      const stillPath = join(stills, `${m.id}.png`);
      const comp = comps.get(m.id);
      if (!comp) {
        g.fail(`#/frame/${m.id}`, `${m.id}: the gallery lists it but Remotion has no such composition`);
        continue;
      }
      // Re-render when it is missing, stale-by-request, or the wrong size —
      // the last one is what a mixed-scale directory looks like from here.
      const wrongSize =
        existsSync(stillPath) &&
        (() => {
          const img = decodePng(stillPath);
          return img.width !== m.width || img.height !== m.height;
        })();
      if (!existsSync(stillPath) || wrongSize || process.argv.includes('--fresh')) {
        await renderStill({
          composition: comp, serveUrl, output: stillPath,
          frame: Math.min(m.frame, comp.durationInFrames - 1),
          chromiumOptions: {gl: 'angle'}, logLevel: 'error',
        });
      }

      const d = meanAbsDiff(decodePng(stillPath), browserImg);
      if (REPORT) {
        report.push({id: m.id, d: d ?? Number.NaN, ink: bStats.ink});
        continue;
      }
      if (d === null) {
        g.fail(`out/browser/${m.id}.png`, `${m.id}: still and browser frames are different sizes`);
      } else if (d > DIFF_MAX) {
        g.fail(`out/browser/${m.id}.png`, `${m.id}: browser and renderStill disagree (mean |ΔL| ${d.toFixed(4)} > ${DIFF_MAX})`, [
          `compare out/poster/${m.id}.png with out/browser/${m.id}.png`,
          'The two are the same Chrome rendering the same tree. A real difference means',
          'geometry that depends on something renderStill does not provide — a measured',
          'container size, a prop the gallery does not pass, a font that only one side loaded.',
        ]);
      }
    } catch (err) {
      g.fail(`#/frame/${m.id}`, `${m.id}: ${String(err.message ?? err).split('\n')[0]}`);
    } finally {
      await page.close().catch(() => {});
    }
    if (checked % 20 === 0) process.stderr.write(`  …${checked}\n`);
  }
} finally {
  await browser.close({silent: true}).catch(() => {});
}

if (REPORT) {
  report.sort((a, b) => b.d - a.d);
  const lines = report.map((r) => `${r.d.toFixed(5)}  ink ${(r.ink * 100).toFixed(2).padStart(6)}%  ${r.id}`);
  // To a file as well as the console: 181 rows through a task pipe came back
  // truncated to 45, and a calibration you only half-read is a guess.
  writeFileSync(join(OUT_DIR, 'browser-report.txt'), lines.join('\n') + '\n');
  for (const l of lines.slice(0, 30)) console.log(l);
  console.log(`… full list in out/browser-report.txt`);
  const ds = report.map((r) => r.d).filter((x) => !Number.isNaN(x)).sort((a, b) => a - b);
  const q = (p) => ds[Math.floor(ds.length * p)] ?? 0;
  console.log(`\nn=${ds.length}  median ${q(0.5).toFixed(5)}  p90 ${q(0.9).toFixed(5)}  p99 ${q(0.99).toFixed(5)}  max ${ds.at(-1)?.toFixed(5)}`);
  process.exit(0);
}

g.done(`${checked} composition(s) rendered in a browser and matched their still.`);
