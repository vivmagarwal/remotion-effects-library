# Remotion Effects Library

A browsable catalogue of production-ready motion for [Remotion](https://remotion.dev) 4.0.522.

Every entry is three things kept in one folder and guaranteed not to drift apart:

- a **live preview** that plays in the browser — the real Remotion composition, not a recording;
- **one copy-pasteable `.tsx` file** you can drop into your own project;
- a **self-sufficient prompt** you can hand to any coding agent, with no Remotion skills installed.

```bash
npm i
npm run gallery     # the browsable catalogue      → http://localhost:5177
npm run studio      # Remotion Studio, all effects  → http://localhost:3000
```

---

## What's in it

88 effects across 12 categories.

| Category | Effects |
|---|---|
| **Text & Type** | Character Drop (Spring) · Glitch Text · Gradient Text Sweep · Hand Annotations · Headline Highlight · Kinetic Word Reveal · Quote Slam · Split-Flap Board · Text Mask Reveal · Text Scramble · Typewriter Terminal · Write-On Text |
| **Openers** | Chapter Divider · Cinematic Tech Intro · Countdown Leader · Device Rise · Stat Slam |
| **Transitions** | Custom Circle Reveal · Light Leak Transition · Transition Sampler · Whip Pan |
| **Visual FX** | Effects Catalogue · Halftone Print · Metaball Goo · Pixel Dissolve Reveal · Progressive Blur Focus · VHS / Vintage Tape |
| **Motion** | Attention Indicators · Freeze Trail · Logo Path Draw · Magic Move (Card) · Magic Move (Gallery) · Orbit System · Parallax Layers · Particle Field · Route Flyover · Shape Morph |
| **Backgrounds** | Aurora Mesh · Dot Grid Pulse · Floating Shapes · Retro Grid Floor |
| **Data & Charts** | Bar Chart Race · Bubble Pack · Bullet Pop List · Chord Diagram · Count-Up Stat · Donut Progress · Force Network · Globe Arcs · Line Chart Draw · Sankey Flow · Streamgraph · Sunburst Rings · Versus Table · Voronoi Shatter |
| **UI & Social** | Browser Window Scroll · Chat Conversation · Chat Thread (Live) · ChatGPT Composer · ChatGPT Full UI · Checklist Ticks · Claude Full UI · Code Editor Typing · Gemini Full UI · Lower Third · Notification Stack · Step Progress · Subscribe Button |
| **Captions** | Hype Captions · Karaoke Band · TikTok Captions |
| **Media** | Before / After Wipe · Ken Burns · Mask Reveal Kit · Photo Stack Shuffle · Text Behind Subject · Video In Text |
| **3D** | CSS Card Flip · DNA Helix · Extruded Text · Galaxy Particles · Glass Refraction · Infinite Tunnel · Instanced Cube Wave · Shader Blob · Three.js Rotating Logo |
| **Audio** | Audio Spectrum · Audiogram |

---

## The three ways to use it

**1. Copy the code.** Open an effect in the gallery, hit **Copy source**, paste the file into your
project, register it in `src/Root.tsx`. Every effect is a single self-contained file with typed,
optional props — no shared helpers to chase down, no design tokens to import. Duplication across
effects is deliberate.

**2. Copy the prompt.** Hit **Copy prompt** and paste it into Claude Code, Cursor, Codex or anything
else. Each prompt composes three parts:

- the effect brief — exact colours, sizes, timings, and *why* the non-obvious decisions are what they
  are;
- a **Remotion essentials** section distilled from the official
  [Remotion Agent Skills](https://www.remotion.dev/docs/ai/skills) — the API surface, the rules about
  frame-driven animation, and a list of the mistakes models actually make;
- a definition of done that names a specific frame to render and look at.

The prompts assume nothing is installed. If you *do* have the official skills
(`npx skills add remotion-dev/skills`), they still work — the skills go deeper on their subjects.

**3. Read it as a reference.** Each effect's **About** tab lists the techniques it demonstrates. The
descriptions are written to explain the one decision that makes the effect work, not to narrate the
code.

---

## How prompts are validated

Every composed prompt carries a **props table generated from the component source** — every prop with
the exact default it must use. `npm run check:prompts` fails the build if a component has a default
the prompt does not state. That gate exists because blind agents reported the same defect every
single round: *"`backgroundColor` is the one prop with no default"*, *"`title` and `subtitle` have no
example copy at all"*. A brief that omits a default is a brief you cannot rebuild the effect from,
which is the whole promise here. Before the table existed, **65 of 88 prompts** were missing at least
one.


The prompts are not written and shipped. Each one is handed to a **fresh agent with no memory of this
project**, which builds the effect from scratch in an empty directory, renders it, and reports back on
every ambiguity, missing detail and false claim it found. Prompts are then corrected and re-tested.

Three of the three.js and D3 prompts went through it most recently. All three built **first try with
zero TypeScript errors** — and all three still came back with real defects, including two in the
components themselves:

- **Force Network had a pure black first frame.** The graph, title and subtitle all faded up from
  opacity 0, so frame 0 was empty — and it rendered without error. Its tail was worse: with the
  original `ticksPerFrame`, the simulation ran out of ticks at frame ~128 of 180, leaving **51
  byte-identical frames**, which the agent found by md5-ing every frame.
- **Instanced Cube Wave never showed its `lowColor`.** The height→colour ramp put the mean past the
  midpoint, so a navy→mint gradient rendered as flat mint. The same report caught a hard black stripe
  down the centre of frame at rotation 0 — you could see straight between the cube columns to the
  background.
- **Infinite Tunnel's vignette hardcoded the default background colour**, so changing the prop left a
  halo of the old one.
- Four **self-contradictions in the shared essentials block** that every prompt inherits: a
  typography floor (≥44px) that every chart label in the library breaks; a `loadFont` example whose
  weight array plants exactly the bug the next paragraph warns about; "no magic frame numbers" against
  briefs written in frame numbers; and "construct stateful objects inside the render" against
  `loadFont` at module scope.
- **Two package lists that could disagree** — the hand-written setup block in each brief, and the
  generated one from `meta.packages`. The brief's block is now rewritten from the metadata at compose
  time, so they cannot drift.
- **No imports anywhere.** Every snippet was bodiless; all three agents had to infer where `useThree`,
  `ThreeCanvas`, `random` and `loadFont` come from. The essentials now open with a canonical import
  block.

Earlier rounds caught, among other things:

- a composition duration that was **36 frames too long**, leaving a black tail;
- `TransitionSeries` hold values shorter than the transitions on either side, so cards were **never
  actually on screen alone** and three stacked up at once;
- `line-height: 1` clipping descenders against a mask edge — plus a *wrong explanation* of why, in the
  prompt that was meant to warn about it (`overflow: hidden` clips at the padding box, so padding does
  fix it);
- a `clip-path: circle()` radius that never reached the corners, because a percentage radius resolves
  against `√(w²+h²)/√2`, not the diagonal;
- verification frames that landed *after* all motion had finished — where a component with no
  animation at all would have passed.

The same gate is applied to effects that were never sent to an agent — anything that renders wrong
gets fixed or dropped:

- **Orbit System** advertised planets passing in front of and behind the star. At the geometry
  originally specified the innermost planet never came within 170px of a 54px star, so the two-pass
  occlusion changed *zero pixels* — and Saturn was clipped off-frame in 41% of the composition. Retilted
  and re-solved until the transits actually fire (verifiable at frames 83 and 264).
- **A shader-transitions sampler was built and then deleted.** Eleven of the presentations in
  `@remotion/transitions` — `dreamyZoom`, `linearBlur`, `dissolve`, `ripple`, `crossZoom`, `swap`,
  `filmBurn`, `zoomBlur`, `zoomInOut`, `crosswarp`, `bookFlip` — draw through `<HtmlInCanvas>` and
  WebGL2 and render a **blank white frame with no error** where that is unavailable
  (`--gl=swiftshader` throws *"Failed to create WebGL2 context"*). The cards either side look perfect,
  so only a mid-transition frame catches it. **Whip Pan** replaces it as a custom DOM presentation that
  renders anywhere, and the caveat is now in the shared essentials block.

---

## Repository layout

```
src/
├── effects/<category>/<id>/
│   ├── <Component>.tsx      the effect — one file, copy-pasteable, nothing else in it
│   ├── meta.ts              name, description, tags, dimensions, checkFrame/posterFrame, packages
│   └── prompt.md            the effect-specific brief
├── prompt-kit/
│   ├── remotion-essentials.md   shared API + gotchas block, composed into every prompt
│   └── project-setup.md         scaffold instructions, with the current quirks
├── gallery/                 the Vite catalogue app
├── Root.tsx                 registers every effect as a Composition
└── registry.generated.ts    codegen — do not edit

scripts/
├── build-registry.mjs       scans src/effects, writes the registry
├── emit-prompts.mjs         writes every composed prompt to out/prompts/
├── verify.mjs               renders one still per effect — the quality gate
├── check-dead-frames.mjs    fails any effect whose checkFrame is a static hold
├── update-readme.mjs        regenerates the catalogue table above
└── make-city-asset.py       regenerates public/sample-city.svg
```

### Commands

| | |
|---|---|
| `npm run gallery` | the catalogue at `localhost:5177` |
| `npm run studio` | Remotion Studio with every effect registered |
| `npm run verify` | renders a still of every effect; **non-zero exit on any failure** |
| `npm run check:frames` | flags any effect whose `checkFrame` shows no motion |
| `npm run check:prompts` | fails if any component default is missing from its prompt |
| `npm run check:fonts` | fails if a component uses a font weight it never loaded |
| `npm run prompts` | writes all composed prompts to `out/prompts/` |
| `npm run docs` | regenerates the catalogue table in this README |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run render <id>` | render one effect to video |

---

## Adding an effect

1. `mkdir -p src/effects/<category>/<id>` and add the three files. Copy the closest existing effect as
   a starting point — that is what the duplication is for.
2. `meta.ts` must set `checkFrame` to a frame where the effect is **mid-flight** — this is what the
   prompt tells an agent to render and inspect, so a settled frame proves nothing. `npm run
   check:frames` rejects a frame where nothing is moving.
   Optionally set `posterFrame` for the gallery card. The two jobs differ: a proof frame has to catch
   the effect moving, a poster has to look like the finished thing. For a fast entrance those are
   different moments; for a continuous loop they are the same, and `posterFrame` can be omitted.
3. `npm run verify` — it must render.
4. Ideally, hand `out/prompts/<id>.md` to an agent with no context and see whether they can rebuild it.

The registry, the Studio, the gallery grid and the prompt files all follow automatically.

---

## Notes

- Assets live in `public/` and are referenced with `staticFile()`. `sample-scene.svg`,
  `sample-city.svg` and `sample-audio.mp3` are generated placeholders — swap in your own. The city
  plate is deliberately full of fine detail, because that is the only way a blur or a halftone screen
  is visible at all; a smooth gradient looks identical either way.
- `remotion.config.ts` sets `Config.setChromiumOpenGlRenderer('angle')`, which `@remotion/effects`
  needs. Without it, WebGL effects render black.
- Several effects take a `transparent` prop so they can be rendered as alpha overlays
  (`--codec=vp8`, or `--codec=prores --prores-profile=4444`) and composited over real footage.

## Credits

Several effects are re-interpretations of ideas from the
[Remotion prompt showcase](https://www.remotion.dev/prompts); those name their source in the gallery's
**About** tab. The **Remotion essentials** block is distilled from the official
[Remotion Agent Skills](https://github.com/remotion-dev/remotion/tree/main/packages/skills).

---

## Licence

The effects, prompts and tooling in this repository are **MIT** — copy anything out of it freely.

**Remotion itself is licensed separately and is not MIT.** It is free for individuals, non-profits
and for-profit organizations with **up to 3 employees**; larger for-profit organizations need a paid
company licence. That applies to anyone who runs this code, not just to this repository. See
[remotion.dev/license](https://www.remotion.dev/license).
