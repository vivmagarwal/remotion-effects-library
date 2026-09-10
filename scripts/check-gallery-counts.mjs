#!/usr/bin/env node
/**
 * Gate: every number printed next to a filter must equal the number of cards
 * clicking it produces.
 *
 * The registry holds 181 entries but the grid shows 96, because a variant is
 * folded into its family until you search or expand it. The rail and the facet
 * chips were counting registry rows, so "Diagrams & Sketches 91" opened nine
 * cards and "All effects 181" opened ninety-six. Nothing was broken; the page
 * was simply telling a visitor a number that was not true of anything they
 * could see, which on a page whose whole job is to be browsed is the same
 * thing as being wrong.
 *
 * A static check cannot see this — the counts and the grid are two derivations
 * in the same component and either could be the one that drifts — so this
 * drives the built gallery and compares them by clicking.
 *
 *   node scripts/check-gallery-counts.mjs --base http://localhost:4180
 */
import {createRequire} from 'node:module';
import {gate} from './lib/gate.mjs';

const require_ = createRequire(import.meta.url);
const g = gate('check:gallery-counts');
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
};
const BASE = arg('base', 'http://localhost:4180');

const {openBrowser} = require_('@remotion/renderer');
const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
const page = await browser.newPage({
  context: null, logLevel: 'error', indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => undefined,
});

try {
  await page.setViewport({width: 1600, height: 1000, deviceScaleFactor: 1});
  await page.goto({url: `${BASE}/`, timeout: 30000});
  await page.evaluate(
    `new Promise((res, rej) => {
       const t0 = Date.now();
       const tick = () => {
         if (document.querySelector('.rail-item')) return setTimeout(res, 600);
         if (Date.now() - t0 > 20000) return rej(new Error('the rail never rendered'));
         setTimeout(tick, 60);
       };
       tick();
     })`,
  );

  /**
   * Click every rail item in turn and read the grid back. Done in the page so
   * each click settles before the next, and reported as data rather than
   * asserted there — a gate that decides in the browser can only tell you that
   * something failed.
   */
  const rows = JSON.parse(
    await page.evaluate(
      `(async () => {
         const out = [];
         const items = [...document.querySelectorAll('.rail-item')];
         for (const item of items) {
           const name = item.querySelector('span')?.textContent?.trim() ?? '?';
           const claimed = Number(item.querySelector('.n')?.textContent?.trim() ?? 'NaN');
           item.click();
           await new Promise((r) => setTimeout(r, 260));
           const shown = document.querySelectorAll('[data-effect-id]').length;
           out.push({name, claimed, shown});
         }
         return JSON.stringify(out);
       })()`,
    ),
  );

  /**
   * The two copy buttons, measured rather than assumed.
   *
   * `sourceOf` and `promptFor` both resolve through a Vite glob keyed by the
   * registry's path, and a key that does not match returns a short placeholder
   * instead of throwing. A rename that missed one would leave a button that
   * still lights up, still says "copied", and puts `// source not found` on the
   * clipboard — which is the exact failure this catalogue cannot afford, since
   * copying is the whole point of it.
   */
  const payloads = JSON.parse(
    await page.evaluate(`JSON.stringify(window.__compositions ?? [])`),
  );
  if (payloads.length === 0) g.fail('the gallery published no compositions to measure');
  for (const c of payloads) {
    if (!(c.srcBytes > 800)) g.fail(`${c.id}: "Copy code" would copy ${c.srcBytes} bytes`);
    if (!(c.promptBytes > 2000)) g.fail(`${c.id}: "Copy prompt" would copy ${c.promptBytes} bytes`);
  }

  if (rows.length < 2) g.fail(`only ${rows.length} rail item(s) found — the gate checked nothing`);
  for (const r of rows) {
    if (!Number.isFinite(r.claimed)) g.fail(`rail "${r.name}" prints no number`);
    else if (r.claimed !== r.shown) {
      g.fail(`rail "${r.name}" says ${r.claimed} but clicking it shows ${r.shown} card(s)`);
    }
  }
  g.done(
    `${rows.length} rail sections match the cards they open; ` +
      `${payloads.length} compositions carry real code and a real prompt on the clipboard`,
  );
} finally {
  await page.close().catch(() => {});
  await browser.close({silent: true}).catch(() => {});
}
