#!/usr/bin/env node
/**
 * Gate: every number printed next to a filter must equal the number of cards
 * clicking it produces — the category rail AND the facet pills behind "Filters".
 *
 * The registry holds 185 entries but the grid shows 96, because a variant is
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
   * The facet pills behind the "Filters" button, swept the same way.
   *
   * These were unchecked for a while, and they are the harder half: a rail count
   * is one derivation, but a facet count is computed with that facet's own
   * filter SKIPPED (`passes(e, filters, facet)`), so it promises "this many if
   * you pick this one" — a different predicate from the grid's. Clicking the
   * pill and counting the cards is the only way to prove the two agree.
   *
   * Each pill is toggled ON, measured, then toggled OFF again, because leaving
   * one on changes every other count on the page. Pills are re-found by label
   * between clicks: a pill whose count drops to zero is unmounted, so a node
   * captured before the click can be stale.
   *
   * The sweep starts by clearing the category filter the rail loop above left
   * selected. Without that it runs inside the last category, where nearly every
   * pill has a count of zero and is therefore not rendered at all — the sweep
   * reported success having checked 11 pills instead of every one of them.
   */
  const facetRows = JSON.parse(
    await page.evaluate(
      `(async () => {
         const settle = () => new Promise((r) => setTimeout(r, 240));

         // Back to "all effects" — the rail sweep left a category selected.
         const all = document.querySelector('.rail-item');
         if (all) { all.click(); await settle(); }
         const baseline = document.querySelectorAll('[data-effect-id]').length;

         const open = document.querySelector('.filterbtn');
         if (!open) return JSON.stringify([{facet: 'Filters', label: 'button', claimed: null, shown: null, missing: true}]);
         if (open.getAttribute('aria-expanded') !== 'true') { open.click(); await settle(); }

         const labelOf = (b) => (b.childNodes[0]?.textContent ?? '').trim();
         const groups = [...document.querySelectorAll('.facets > div')].map((d) => ({
           facet: d.querySelector('.facet-h')?.textContent?.trim() ?? '?',
           labels: [...d.querySelectorAll('button.pill')].map(labelOf),
         }));

         const find = (facet, label) => {
           for (const d of document.querySelectorAll('.facets > div')) {
             if ((d.querySelector('.facet-h')?.textContent?.trim() ?? '?') !== facet) continue;
             for (const b of d.querySelectorAll('button.pill')) if (labelOf(b) === label) return b;
           }
           return null;
         };

         const out = [{facet: '(baseline)', label: 'all effects', claimed: baseline, shown: baseline, missing: false}];
         for (const {facet, labels} of groups) {
           for (const label of labels) {
             const pill = find(facet, label);
             if (!pill) { out.push({facet, label, claimed: null, shown: null, missing: true}); continue; }
             const claimed = Number(pill.querySelector('.n')?.textContent?.trim() ?? 'NaN');
             pill.click();
             await settle();
             const shown = document.querySelectorAll('[data-effect-id]').length;
             const off = find(facet, label);
             if (off) { off.click(); await settle(); }
             out.push({facet, label, claimed, shown, missing: false});
           }
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
    if (!(c.srcBytes > 800)) g.fail(`${c.id}: "Copy source" would copy ${c.srcBytes} bytes`);
    if (!(c.promptBytes > 2000)) g.fail(`${c.id}: "Copy full prompt" would copy ${c.promptBytes} bytes`);
  }

  if (rows.length < 2) g.fail(`only ${rows.length} rail item(s) found — the gate checked nothing`);
  for (const r of rows) {
    if (!Number.isFinite(r.claimed)) g.fail(`rail "${r.name}" prints no number`);
    else if (r.claimed !== r.shown) {
      g.fail(`rail "${r.name}" says ${r.claimed} but clicking it shows ${r.shown} card(s)`);
    }
  }

  /**
   * The page ships five facets — Needs, Ground, For, Level, Library — and the
   * smallest of them has three values. A sweep that finds a handful has not found
   * the facets; it has found whatever survived a filter it forgot to clear, which
   * is precisely how this half of the gate first passed while checking almost
   * nothing.
   */
  const swept = facetRows.filter((r) => r.facet !== '(baseline)');
  if (swept.length < 20) {
    g.fail(`only ${swept.length} facet pill(s) swept — expected every pill across five facets; the sweep checked almost nothing`);
  }
  const facetsSeen = new Set(swept.map((r) => r.facet));
  if (facetsSeen.size < 5) {
    g.fail(`only ${facetsSeen.size} facet group(s) found (${[...facetsSeen].join(', ') || 'none'}) — expected five`);
  }
  for (const r of swept) {
    if (r.missing) g.fail(`facet "${r.facet}" pill "${r.label}" vanished before it could be clicked`);
    else if (!Number.isFinite(r.claimed)) g.fail(`facet "${r.facet}" pill "${r.label}" prints no number`);
    else if (r.claimed !== r.shown) {
      g.fail(`facet "${r.facet}" pill "${r.label}" says ${r.claimed} but selecting it shows ${r.shown} card(s)`);
    }
  }

  g.done(
    `${rows.length} rail sections and ${swept.length} facet pills across ${facetsSeen.size} facets match the cards they open; ` +
      `${payloads.length} compositions carry real code and a real prompt on the clipboard`,
  );
} finally {
  await page.close().catch(() => {});
  await browser.close({silent: true}).catch(() => {});
}
