# Quality gates guide

Every gate, what it actually catches, and what it costs to run.

The gates are the reason this repository can promise that the code, the preview and the prompt agree.
Each one exists because something shipped broken in exactly the way it now prevents.

---

## 1. The two chains

```bash
npm run gate:fast    # what CI runs on every push and PR. No browser, no rendering.
npm run gate:slow    # renders and drives a browser. Manual: Actions → CI → Run workflow.
```

### `gate:fast`, in order

`registry` → `typecheck` (`tsc --noEmit`) → `prompts` → `check:compose` → `check:theme` →
`check:vocab` → `check:taxonomy` → `check:meta` → `check:palette` → `check:standalone` →
`check:gallery-variants` → `check:media-props` → `check:imports` → `check:assets` → `check:fonts` →
`check:edd` → `check:prompts` (which re-runs `prompts` first).

### `gate:slow`, in order

`verify` → `check:frames` → `check:poster` → `check:browser` → `check:player`.

`check:browser` and `check:player` each run `build:gallery` first, then serve `dist-gallery/` on a
free ephemeral port and drive headless Chrome against it. `check:browser` runs two checkers in
sequence: `check-gallery-counts.mjs`, then `check-browser-frames.mjs`.

`check:themes` is in **neither** chain — it is a manual sweep (see [§4](#4-manual-sweeps)).

---

## 2. Static gates (`gate:fast`)

| Gate | Script | Fails when |
|---|---|---|
| `registry` | `build-registry.mjs` | An effect folder does not hold exactly one `.tsx`, or is missing `meta.ts` or `prompt.md` (extra files are allowed). Also writes `src/registry.generated.ts` and `out/meta.json`. |
| `typecheck` | `tsc --noEmit` | Anything TypeScript objects to. |
| `check:compose` | `check-compose.mjs` | `src/gallery/sources.ts` stops using the shared composer, re-implements `installLine`/`propsTable`/`syncSetupBlock`, or derives a check frame from `durationInFrames * …`; or the Node-composed and Vite-composed prompt differ by a byte; or `out/prompts/<id>.md` is missing or stale. |
| `check:theme` | `check-theme.mjs` | A component declares a theme token that is not in `src/theme.ts`, types one differently, inlines a non-house default (fonts exempt — they default to the file's own loaded family), declares `type Theme` with no `const THEME`, or has no `theme = THEME` default in the destructure (the convention is to put it first; the gate checks presence). |
| `check:vocab` | `check-vocab.mjs` | A `meta.tags`/`meta.concepts` value is outside `src/tags.ts`, or a vocabulary list contains duplicates. |
| `check:taxonomy` | `check-taxonomy.mjs` | `src/types.ts`, `src/gallery/categories.ts` and `scripts/lib/taxonomy.mjs` disagree on membership, order or label; an effect's folder category is unknown or `meta.category` ≠ its folder; **or a `check:*` npm script has no row in the README gate table, or a row names no script.** |
| `check:meta` | `check-meta.mjs` | Id missing / not kebab-case / ≠ folder / ≠ kebab of the component name; duplicate id or name; tagline missing, outside **42–79 chars**, or not ending in `.`; non-finite `width`/`height`/`fps`/`durationInFrames`/`checkFrame`; `checkFrame` outside `1 … durationInFrames-1`; `posterFrame` outside `0 … durationInFrames-1`; a key written in `meta.ts` that never reached the parsed registry; `packages` missing `'remotion'`. |
| `check:palette` | `check-palette.mjs` | A hex literal in a component is outside the 14 house colours and carries no `// palette: brand-mimicry <name>` or `// palette: data <reason>` exemption (per line, per block, or whole file). |
| `check:standalone` | `check-standalone.mjs` | A brief says "this repo", "the library", "as elsewhere", "see also", "as above in"; a `staticFile('…')` in a brief or a component names a file not in `public/`; a declared size/fps/frame count disagrees with `meta.ts`. |
| `check:gallery-variants` | `check-gallery-variants.mjs` | A `<Player>`/`<Thumbnail component=…>` in `src/gallery/App.tsx` has no `inputProps`; nothing destructures `variantProps`; or the page's `REMOTION_VERSION` constant ≠ the installed `remotion` version. |
| `check:media-props` | `check-media-props.mjs` | `objectFit`/`objectPosition` appears inside `style` on a `<Video>`/`<Audio>` — in a component **or** in a brief's code fence — or `src/prompt-kit/video.md` stops saying `objectFit` is a PROP. |
| `check:imports` | `check-imports.mjs` | A component imports a package the install line (from `meta.packages`) does not cover, or `meta.packages` lists a package that is never imported and is not a peer dependency of one that is. |
| `check:assets` | `check-assets.mjs` | A file under `public/` has no row in `public/ASSETS.md`. (A row naming a missing file is a note, not a failure.) |
| `check:fonts` | `check-font-weights.mjs` | A component applies a `fontWeight` it never loaded. Opt out per line with `// font-weight-check: ignore`. |
| `check:edd` | `check-edd.mjs` | The installed `edododraw` has `sideEffects: false`, or a `sideEffects` glob matches no shipped `.js`, or fewer than 80 viz templates register, or a template used by the generated variants compiles to an empty scene. |
| `check:prompts` | `check-prompt-defaults.mjs` | A scalar prop default in a component's `type Props` is missing from `out/prompts/<id>.md`, or a component's props table could not be parsed at all. Takes positional effect ids to check a subset. |

---

## 3. Rendering and browser gates (`gate:slow`)

| Gate | Script | What it renders | Fails when |
|---|---|---|---|
| `verify` | `verify.mjs` | One still per composition at its own `checkFrame`, scale 0.35 → `out/verify/`, plus its poster frame → `out/poster/` when that differs. Variants included: they inherit their parent's frames unless they override them, exactly as the registry expands them (185 stills + 135 posters) | Any composition throws while rendering. Takes a positional substring filter. |
| `check:frames` | `check-dead-frames.mjs` | `checkFrame` and `checkFrame + 6` at scale 0.3 → `out/deadcheck/`, for all 185 compositions | The two frames are md5-identical — i.e. `checkFrame` proves no motion. |
| `check:poster` | `check-poster.mjs` | Nothing — reads `out/poster/`, falling back to `out/verify/`, for all 185 compositions | A frame is blank: `mean < 0.004`, `std < 0.016`, or `edge < 0.0003`. It also re-tests five synthesised empty frames and fails if the floors stop rejecting them. Exits 0 with a message when no stills exist yet. |
| `check:browser` (a) | `check-gallery-counts.mjs` | Drives the built gallery | A number printed beside a **rail category or a facet pill** ≠ the cards selecting it shows; fewer than 2 rail items or fewer than 5 facet pills (the sweep checked nothing); a pill that prints no number or vanishes mid-sweep; `srcBytes ≤ 800` or `promptBytes ≤ 2000` for any composition (a Copy button that would put a placeholder on the clipboard); zero compositions published. |
| `check:browser` (b) | `check-browser-frames.mjs` | Screenshots `#/frame/<id>` and diffs against a cached `renderStill` reference (`out/ref/`) | Browser frame `ink < 0.0008` (blank), or `meanAbsDiff > 0.06` on a 64×64 block grid, or the sizes differ, or the gallery lists an id Remotion does not have. Flags: `--base`, `--only`, `--report`, `--fresh`. |
| `check:player` | `check-player-video.mjs` | Plays `#/play/<id>` for 1400 ms, pauses, screenshots, then screenshots a `<Thumbnail>` at the stopped frame | The player never advanced (stopped frame 0), the playing frame is blank (`ink < 0.0008`), or the two differ by `meanAbsDiff > 0.12`. Flags: `--base`, `--only`, `--report`. |

### `renderStill` is not the viewer's path

Both browser gates exist because `renderStill` is the one environment where certain bugs cancel out.
Three have shipped:

1. A `viewBox` measured in the wrong coordinate space — correct only because Remotion mounts a
   composition in a 0×0 wrapper during layout, which made the camera identity in stills.
2. The gallery's `<Player>`/`<Thumbnail>` called without `inputProps`, so 85 variants rendered the
   component defaults under 85 names. Stills were driven from the registry, so they were right.
3. A **stale dependency**: a webpack bundle cached a local, unpublished build of `edododraw` while the
   deployed site shipped the published version. The stills were of code that was not live.

`check:browser` is deliberately **not** a general pixel-regression test. Its measured sensitivity limit
is in the header of `scripts/check-browser-frames.mjs`: with `inputProps` dropped, only one of the 82
viz variants crossed the 0.06 threshold, because two hand-drawn diagrams on the same paper ground look
alike to a block average. It catches blank frames and gross geometry; `check:gallery-variants` is the
exact defence for the variant bug.

When changing anything in the `diagrams` category or bumping `edododraw`, sweep the built gallery in a
browser and look at contact sheets — see [DIAGRAMS_VIZ_GUIDE.md](DIAGRAMS_VIZ_GUIDE.md#5-verifying-a-change).

---

## 4. Manual sweeps

```bash
npm run check:themes              # every effect × every theme: 480 renders + authored baselines
npm run check:themes -- --only edodo
npm run check:themes -- --report  # print every score, never fail
npm run check:themes -- --probe   # per-token report (always exits 0): one render per declared token, 643
npm run check:gallery-counts -- --base http://localhost:5178   # against a preview you started
```

`check:themes` fails when a themed render is blank, when a component declares zero theme tokens, when
theme `house` moves the frame by more than `0.1` (it is the authored look — a difference beyond a
typeface swap is the bug), or when a non-house theme changes a reachable token and the frame moves by
exactly 0. Output lands in `out/theme/`.

`--probe` is a **report to read**, not a verdict: a token can be correctly wired and simply not visible
at the frame being rendered.

---

## 5. Shared helpers

`scripts/lib/` is where the gates agree with each other.

| File | Exports | Purpose |
|---|---|---|
| `lib/fs.mjs` | `ROOT`, `SRC`, `EFFECTS_DIR`, `PUBLIC_DIR`, `PROMPT_KIT_DIR`, `OUT_DIR`, `dirs()`, `walkEffects()`, `walkPublic()` | The one filesystem walk: every effect folder with resolved paths, every file under `public/`. |
| `lib/meta.mjs` | `entriesOf()`, `parseMeta()`, `readMeta()` | The text reader — finds the balanced `export const meta = {…}` and parses top-level keys, quote- and comment-aware, keeping line numbers for error messages. |
| `lib/meta.mjs` | `importMeta()`, `compositionFrames()` | The *evaluated* reader: Node imports a `meta.ts` directly (it is plain data), so `variants` arrives resolved — including `viz-gallery`'s, which is an imported identifier no text parser can evaluate. `compositionFrames()` returns all 185 compositions with the frames each nominates, mirroring the registry's inheritance. Needs explicit `.ts` specifiers in a meta's value imports (`allowImportingTsExtensions`). |
| `lib/gate.mjs` | `rel()`, `lineOfMatch()`, `gate(name)` → `{fail, note, failed, done}` | The collect-print-exit shape every `check-*` uses. |
| `lib/png.mjs` | `decodePng()`, `luminanceStats()`, `meanAbsDiff()` | A hand-rolled PNG decoder (8-bit, non-interlaced, colour types 0/2/4/6) plus luminance stats and a 64×64 block diff — so no native image dependency is needed. |
| `lib/blank.mjs` | `FLOORS`, `blankReason()`, `EMPTY_FRAMES`, `synth()`, `missedEmpties()` | The single definition of "this frame is empty", shared by `check:poster` and `check:themes`, plus five synthetic empty frames the gates must keep rejecting. |
| `lib/taxonomy.mjs` | `CATEGORY_ORDER`, `CATEGORY_LABEL`, `isCategory()` | Node-readable mirror of `src/gallery/categories.ts`. |
| `lib/kit.mjs` | `kitFiles()`, `loadKit()`, `missingKitFiles()` | Loads `src/prompt-kit/*.md` and builds the kit through the shared composer. |
| `lib/ts.mjs` | `stringArrayExport()`, `objectKeysExport()`, `unionMembers()` | Literal readers for plain-data TypeScript, so gates can cross-check `.ts` sources without a TS loader. |

**A gate that cannot fail is worse than no gate.** That is why `check:poster` and `check:themes`
re-derive their floors against synthetic empty frames on every run, and why `check:gallery-counts`
measures the bytes a Copy button would actually put on the clipboard.

The other half of that rule is coverage: a gate that runs over 96 effect folders when the library
renders 185 compositions is not failing, it is looking away. `verify`, `check:frames` and
`check:poster` all did exactly that until they were moved onto `compositionFrames()`; check what a
visitor can open, not what the folder tree contains.

---

## 6. Calibrated constants, in one place

| Constant | Value | Defined in | Used by |
|---|---|---|---|
| `FLOORS.mean` / `.std` / `.edge` | `0.004` / `0.016` / `0.0003` | `lib/blank.mjs` | `check:poster`, `check:themes` |
| `INK_MIN` | `0.0008` | `check-browser-frames.mjs`, `check-player-video.mjs` (also declared, unused, in `check-themes.mjs`, which uses `FLOORS`) | `check:browser`, `check:player` |
| `DIFF_MAX` | `0.06` | `check-browser-frames.mjs` | `check:browser` |
| `DIFF_MAX` | `0.12` | `check-player-video.mjs` | `check:player` |
| `PLAY_MS` | `1400` ms | `check-player-video.mjs` | `check:player` |
| `HOUSE_MAX` | `0.1` | `check-themes.mjs` | `check:themes` |
| tagline length | `42`–`79` chars | `check-meta.mjs` | `check:meta` |
| diff grid | `64×64` | `lib/png.mjs` | all image gates |
| viz templates registered | fails below `80` | `check-edd.mjs` | `check:edd` |
| `srcBytes` / `promptBytes` floors | `> 800` / `> 2000` | `check-gallery-counts.mjs` | `check:gallery-counts` |

Recalibrate with `--report`, never by nudging a threshold to make a failure go away.

---

## 7. Scripts that are not gates

Not wired into any npm script; run them directly when you need them.

| Script | Purpose | Guide |
|---|---|---|
| `scripts/fetch-footage.sh` | Re-derives `public/footage/` from NASA sources and verifies SHA-256; `--transcribe` regenerates the Deepgram transcripts | [MEDIA_ASSETS_GUIDE.md](MEDIA_ASSETS_GUIDE.md) |
| `scripts/make-audio-assets.py` | Synthesises the music bed and the 10-piece SFX rack | [MEDIA_ASSETS_GUIDE.md](MEDIA_ASSETS_GUIDE.md) |
| `scripts/make-sample-plates.py`, `scripts/make-city-asset.py` | Generate the SVG plates | [MEDIA_ASSETS_GUIDE.md](MEDIA_ASSETS_GUIDE.md) |
| `scripts/apply-theme.mjs`, `apply-theme-fonts.mjs`, `apply-theme-ink.mjs` | One-shot codemods that introduced the theme prop, the font prop and the ink tokens across every effect. `--dry` reports without writing; `apply-theme-ink.mjs` runs `tsc` and reverts files where `theme` is not in scope | [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) |

---

## 8. CI wiring

| Workflow | Trigger | Runs |
|---|---|---|
| `.github/workflows/ci.yml` → job `fast` | push to `main`, every PR, manual | `npm ci` → `npm run gate:fast` |
| `.github/workflows/ci.yml` → job `slow` | **manual only** (`workflow_dispatch`) | `npm ci` → `npx remotion browser ensure` → `npm run gate:slow`, then uploads `out/verify` and `out/poster` as the `stills` artifact (7 days) |
| `.github/workflows/pages.yml` | push to `main`, manual | `npm ci` → `npm run gate:fast` → `npm run build:gallery` (with `GALLERY_BASE`) → deploy |

No secrets are used. Everything the gates touch is committed, transcripts included, so nothing calls
an API. See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).
