# Development standards

Setup, conventions, and how to do the things that are not obvious from the code.

---

## 1. Setup

```bash
npm i            # or npm ci — CI uses Node 22; Node 24 works locally
npm run gallery  # the catalogue        → http://localhost:5177
npm run studio   # Remotion Studio      → http://localhost:3000
```

Remotion downloads a Chrome Headless Shell on first render. Pre-fetch it with
`npx remotion browser ensure` if you would rather see that failure separately.

Nothing needs an API key. `.env` exists only for `scripts/fetch-footage.sh --transcribe`
(`DEEPGRAM_API_KEY`) and is gitignored; the transcripts are committed, so no gate ever calls a network
service.

### Commands

| Command | What |
|---|---|
| `npm run gallery` | Vite catalogue on 5177 (runs `registry` first) |
| `npm run studio` | Remotion Studio with every composition registered |
| `npm run render <id>` / `npm run still <id>` | Remotion CLI passthrough |
| `npm run registry` | Regenerate `src/registry.generated.ts` (+ `out/meta.json`) |
| `npm run prompts` | Write every composed prompt to `out/prompts/` |
| `npm run docs` | Regenerate the README catalogue table |
| `npm run viz:variants` | Regenerate the viz-gallery variant list from edododraw |
| `npm run gate:fast` | Every non-rendering gate — what CI runs on push |
| `npm run gate:slow` | Rendering + browser gates |
| `npm run check:themes` | Manual theme sweep (480 themed renders + authored baselines) |
| `npm run build:gallery` / `npm run preview:gallery` | Build to `dist-gallery/` / serve it on 5178 |

Full gate reference: [QUALITY_GATES_GUIDE.md](QUALITY_GATES_GUIDE.md).

---

## 2. Project structure

```
src/
├── effects/<category>/<id>/     Component.tsx · meta.ts · prompt.md   (the unit of work)
├── prompt-kit/                  compose.mjs + the shared prompt modules
├── gallery/                     the Vite catalogue app
├── theme.ts  tags.ts  types.ts  the three vocabularies: tokens, terms, contract
├── Root.tsx  index.ts           Remotion entry
└── registry.generated.ts        codegen — do not edit
scripts/                         codegen, prompt emission, gates, asset pipelines
  └── lib/                       shared walk / parse / image / gate helpers
public/                          footage, audio, transcripts, plates + ASSETS.md
docs/                            this folder
out/                             every artefact any script produces — gitignored
dist-gallery/                    the built gallery — gitignored
```

**Generated files that are committed:** `src/registry.generated.ts` and
`src/effects/diagrams/viz-gallery/variants.generated.ts`. Regenerate them with `npm run registry` /
`npm run viz:variants`; never hand-edit them.

**Everything under `out/` is disposable.** Gates write stills, screenshots and reports there; nothing
reads it except other gates.

---

## 3. Code standards

- **TypeScript is strict**, including `noUnusedLocals` and `noUnusedParameters` — deliberately as
  strict as the project a brief tells a reader to create (`npx create-video --blank` ships those, this
  repo did not, and 36 of 96 components carried an unused import that failed `tsc` in the reader's own
  project).
- **ESM everywhere** (`"type": "module"`). Scripts are `.mjs`; `src/prompt-kit/compose.mjs` is
  deliberately plain ESM so Node and Vite can both import it.
- **Plain-data modules keep explicit `.ts` specifiers** (`allowImportingTsExtensions`). A `meta.ts` is
  imported directly by gates through Node's type stripping, and Node resolves no extensionless
  specifier — that is how `compositionFrames()` sees variants a text parser cannot evaluate.
- **Components**: one named export, PascalCase, `React.FC<Props>`; `type Props` declared in the file;
  every prop optional with a default; `theme = THEME` first in the destructure.
- **No shared imports inside an effect.** Not between effects, not from `src/theme.ts`, not from a
  helpers module. This is the rule that makes the file copy-pasteable, and it is not negotiable.
- **Comments explain the failure they prevent.** The house style is a short paragraph naming the bug —
  "measured in user units, every circle closed halfway round on the finished frame" — not a restatement
  of the code. A gate is a comment that runs; when a comment is important enough, add the gate too.
- **Numbers carry their unit and their origin.** `// 4 % of peak RMS over a 20 ms window`, not `0.04`.
- **No wall-clock, no randomness.** `random(seed)` from `remotion`; no `Date.now()`, no
  `setTimeout`/`requestAnimationFrame`, no CSS animation.

---

## 4. How to add things

| Task | Steps |
|---|---|
| **An effect** | [EFFECT_AUTHORING_GUIDE.md §7](EFFECT_AUTHORING_GUIDE.md#7-adding-an-effect--the-loop) |
| **A variant** | Add a row to `meta.variants` (`id`, `name`, optional `tagline`/`checkFrame`/`posterFrame`, `props`). Nothing else; the registry expands it |
| **A tag or concept** | Add to `TAGS`/`CONCEPTS` in `src/tags.ts` — only when **two or more** effects need it |
| **A category** | `src/types.ts` (union + doc comment), `src/gallery/categories.ts` (label + order), `scripts/lib/taxonomy.mjs` (mirror). `check:taxonomy` fails until all three agree |
| **A theme** | [DESIGN_SYSTEM.md §5](DESIGN_SYSTEM.md#5-adding-or-changing-a-theme) |
| **A theme token** | `Theme` type + every theme in `THEMES` + the probe list in `scripts/check-themes.mjs` + `src/prompt-kit/theme.md`, then use it |
| **A prompt-kit module** | Add `src/prompt-kit/<key>.md`; add the key to `KIT_FILES` **and** `MODULE_KEYS` (`buildKit()` only fills modules listed there); add a rule to `MODULE_RULES` (the array order **is** the section order); then `npm run prompts && npm run check:compose` |
| **A gate** | Write `scripts/check-<thing>.mjs` using `lib/gate.mjs` and `lib/fs.mjs`; add the npm script; add it to the `gate:fast`/`gate:slow` chain; **add a row to the README gate table** — `check:taxonomy` fails if a `check:*` script has no row, or a row has no script |
| **An asset** | [MEDIA_ASSETS_GUIDE.md §5](MEDIA_ASSETS_GUIDE.md#5-adding-an-asset) |

---

## 5. Working rhythm

1. Change one thing.
2. `npm run gate:fast` — a couple of minutes, no browser.
3. **Render the frame and look at it.** `npm run still <id> -- --frame=<n> --scale=0.5 --output=out/check.png`.
   For anything visual, tile several frames into a contact sheet and judge by eye; a gate that cannot
   fail is worse than no gate, and no threshold catches "this looks wrong".
4. For anything the gallery renders differently from `renderStill` — diagrams, players, variants —
   build the gallery and look at it in a browser
   ([DIAGRAMS_VIZ_GUIDE.md §5](DIAGRAMS_VIZ_GUIDE.md#5-verifying-a-change)).
5. `npm run gate:slow` before a release, or trigger the manual CI job.

Commit generated files alongside their source (`registry.generated.ts` with the effect,
`variants.generated.ts` with the edododraw bump). `gate:fast` regenerates the registry before `tsc`, so
a stale registry is at worst a noisy diff; nothing regenerates `variants.generated.ts` in CI, so a stale
one ships.

---

## 6. Troubleshooting

| Symptom | Cause |
|---|---|
| WebGL effect renders **black, no error** | Missing `Config.setChromiumOpenGlRenderer('angle')`. Already set in `remotion.config.ts`; check any standalone render script |
| A shader transition renders **blank white, no error** | `<HtmlInCanvas>` + WebGL2 unavailable (`--gl=swiftshader` throws "Failed to create WebGL2 context"). Use `angle` |
| Every viz card is blank in the **production build only** | Tree-shaken side effects — `check:edd` exists for exactly this ([DIAGRAMS_VIZ_GUIDE.md §4](DIAGRAMS_VIZ_GUIDE.md#4-checkedd)) |
| A dependency change does not show up in `renderStill` | Webpack treats `node_modules` as immutable per version. Bundle with `enableCaching: false`, and verify the version actually in the bundle |
| `check:compose` fails right after editing a kit module | Run `npm run prompts` first — it diffs against `out/prompts/` |
| `check:poster` says "no stills" | Run `npm run verify` first; it renders what that gate reads |
| Variant cards all show the same picture | A `<Player>`/`<Thumbnail>` without `inputProps`; `check:gallery-variants` catches it statically |
| Two players on one page share a clip/mask | An SVG id that is not per-instance — use `useId()` |
