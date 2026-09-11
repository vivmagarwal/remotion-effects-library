# Gallery guide

The Vite app that publishes the catalogue: `src/gallery/`, built to `dist-gallery/`, deployed to
GitHub Pages.

It is not a marketing site. It is the surface where the three artefacts of an effect — the playing
composition, the source file and the composed prompt — are proved to be the same thing.

```bash
npm run gallery          # dev server on http://localhost:5177 (runs `registry` first)
npm run build:gallery    # → dist-gallery/
npm run preview:gallery  # serve the build on http://localhost:5178
```

---

## 1. Files

| File | Lines | Responsibility |
|---|---|---|
| `src/gallery/main.tsx` | ~90 | Bootstrap: base-path remap for `staticFile()`, `window.__compositions`, route choice between `<App>` and the two smoke harnesses |
| `src/gallery/App.tsx` | ~1630 | Everything the visitor sees: grid, facets, search, detail sheet, theme and look pickers, plus `FrameHarness` and `PlayHarness` |
| `src/gallery/sources.ts` | ~120 | `import.meta.glob` over effect sources, briefs and prompt-kit modules; `sourceOf()`, `briefOf()`, `promptFor()` |
| `src/gallery/categories.ts` | ~60 | `CATEGORY_LABEL` and `CATEGORY_ORDER` — the taxonomy's single source |
| `src/gallery/Markdown.tsx` | ~190 | The small Markdown renderer used by the About tab |
| `src/gallery/highlight.ts` | ~50 | Syntax highlighting for the Source tab |
| `src/gallery/styles.css` | ~800 | All styling, including the light/dark UI theme |

---

## 2. Routes

Hash routing, because a GitHub Pages project site serves from a subpath and has no rewrite rules — no
`404.html` copy needed.

| Route | Renders | Used by |
|---|---|---|
| `#/` | The grid. Filters live in the query: `?q=&cat=&sort=&req=&ground=&aud=&level=&lib=` | visitors |
| `#/effect/<id>` | The grid with the detail sheet open | visitors, deep links |
| `#/frame/<id>` | `FrameHarness` — one composition, alone, at 1:1, in a `<Thumbnail>` at its poster frame, no chrome | `check:browser` |
| `#/play/<id>` | `PlayHarness` — the same composition in a `<Player>`, with `window.__play` exposed | `check:player`, manual sweeps |

Both harnesses render outside `<StrictMode>` (the double-invoke would mount and measure every
composition twice) and are chosen in `main.tsx` rather than inside `<App>`, because branching inside a
component that calls hooks would change the hook count between routes.

### `window.__play`

`PlayHarness` publishes `{play(), pause(), frame(), showThumb(frame)}`. `showThumb(n)` swaps the
`<Player>` for a `<Thumbnail>` at frame `n` — only one is mounted at a time, so the two decoders never
contend. This is what makes a frame-accurate browser sweep possible:

```js
await page.evaluate(`window.__play.showThumb(129)`);   // then screenshot
```

### `window.__compositions`

`main.tsx` publishes the **expanded** list (185 rows, not 96 folders): `{id, parentId, width, height,
frame, srcBytes, promptBytes}`. The gates read the list from the page rather than re-deriving it — the
first attempt at re-deriving produced 99 rows, because `viz-gallery`'s variants arrive as an imported
identifier that a meta parser cannot evaluate. `srcBytes`/`promptBytes` are what the Copy buttons would
actually put on the clipboard, which is how `check:gallery-counts` knows they are wired.

---

## 3. The grid and the facets

Search is a single lowercase haystack per entry — name, tagline, description, category label,
difficulty, `requires`, `audience`, tags, concepts, packages — cached in a `WeakMap`.

| Control | Values |
|---|---|
| Sort | By category (default) · A–Z · Easiest first · Shortest first |
| Category | The 16 in `CATEGORY_ORDER` |
| Needs (`requires`) | `video` · `audio` · `image` · `transcript` |
| Ground | `dark` · `light` · `both` · `transparent` |
| For (`audience`) | youtuber · saas · educator · data · agency · developer · podcaster |
| Level (`difficulty`) | starter · intermediate · advanced |
| Library | three.js · D3 · `@remotion/effects` · transitions · media · paths · shapes · audio · captions · GLSL shaders · SVG · CSS — matched against the same haystack, so they need no separate index |

Keyboard: `/` focuses search, `Escape` closes the sheet (or, in the search box, clears the query),
`←`/`→` move between effects, `←`/`→` cycle tabs when a tab has focus.

Every printed count is gated. `check:gallery-counts` clicks each rail item and each facet pill and
compares the claimed number with the cards that appear. Facet counts are the harder half: they are
computed with that facet's own filter **skipped** (`passes(e, filters, facet)`), so a pill promises
"this many if you pick this one" — a different predicate from the grid's, which is exactly why clicking
is the only honest check.

---

## 4. The detail sheet

Three tabs — **AI prompt**, **Source**, **About** — with the last choice remembered in `localStorage`
(`rel-tab`).

| Tab | Content | Copy button |
|---|---|---|
| AI prompt | `promptFor(meta, file)` in a `<pre>` — byte-identical to `out/prompts/<id>.md` | *Copy full prompt* |
| Source | `sourceOf(file)` — the real file via `import.meta.glob(..., '?raw')` | *Copy source* |
| About | `meta.description`, concepts, tags, credit, and the rendered brief | — |

Above the tabs sit a facts strip (composition size and fps, length, category, level, ground, needs,
packages) and the live `<Player>`, mounted with `inputProps = variantProps` (plus
`themeFor(look, meta.ground)` when a look is picked). **A `<Player>` or `<Thumbnail>` without
`inputProps` renders the component defaults under a variant's name** — that shipped once for 85 cards,
and `check:gallery-variants` is the static gate that keeps it from shipping again.

---

## 5. Two different "themes"

| Picker | What it changes | Persistence |
|---|---|---|
| Light / dark / system (top bar) | The **gallery UI** — `data-theme` on `<html>` | `localStorage` key `rel-theme` |
| **Video theme** (look) | The **compositions**, by passing `theme` in `inputProps` | React state, not persisted |

The look picker offers *As authored* plus every key of `THEMES`. *As authored* passes no theme at all —
see [DESIGN_SYSTEM.md §3](DESIGN_SYSTEM.md#3-the-five-shipped-themes).

---

## 6. Base path

A project Pages site is served from `/<repo>/`, so:

- `vite.config.ts` reads `GALLERY_BASE` (default `/`) for `base`.
- `main.tsx` seeds `window.remotion_staticFiles` from `publicAssets` with that base prefix, because
  `staticFile()` returns a **root-absolute** path and offers no way to prefix one. Without this, every
  asset 404s on Pages. At base `/` it is a no-op, so dev is unaffected.

`publicAssets` is generated by `build-registry.mjs`, which walks `public/` recursively — note the
subdirectory in `staticFile('footage/interview.mp4')`.

---

## 7. Build shape

`vite.config.ts` splits three vendor chunks — `three`, `d3`, `react` — because the registry statically
imports every effect, so without it a visitor who wants a text effect downloads three.js and every d3
package before the first card paints. `chunkSizeWarningLimit` is 1400 KB.

`REMOTION_VERSION` in `App.tsx` is displayed in the footer and gated: `check:gallery-variants` fails if
it ever disagrees with the installed `remotion`.

---

## 8. Extending it

| Task | Where |
|---|---|
| New facet | `Filters`/`Facet` types, `FACET_LABEL`, `passes()`, the `counts` memo and `filtersFromHash`/`hashForFilters` in `App.tsx`, then a `facetRow(...)` in the facets block. `check:gallery-counts` clicks every pill, so a count that does not match its own grid fails the gate |
| New library chip | `LIBRARIES` in `App.tsx` — terms are matched against the existing haystack |
| New category | `src/types.ts`, `src/gallery/categories.ts`, `scripts/lib/taxonomy.mjs` (all three; `check:taxonomy` enforces it) |
| New smoke route | `main.tsx` (route choice) + a harness component in `App.tsx`; keep it outside `<StrictMode>` and give it a `data-smoke-stage` wrapper so the gates can wait for mount |
