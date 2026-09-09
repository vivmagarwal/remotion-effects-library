Build a Remotion composition called **EffectsCatalogue** (composition id `effects-catalogue`): a
contact sheet of `@remotion/effects` — the same plate through fifteen different effects, each labelled,
with a spotlight that then walks the grid naming each call.

**Setup**
`@remotion/effects` runs on WebGL2. Without this it renders black:

```ts
// remotion.config.ts
import {Config} from '@remotion/cli/config';
Config.setChromiumOpenGlRenderer('angle');
```

Import each effect from its own subpath — `@remotion/effects/duotone`, `/halftone`, `/scanlines`, and
so on. There are **71** of them; this shows fifteen visually distinct ones.

**The two things this teaches by construction**

1. **Every effect takes a params object.** None are zero-argument — `thermalVision({})`, `emboss({})`,
   `invert({})`. Calling `thermalVision()` is a type error.
2. **The parameter ranges are not uniform across the package.** `brightness()` takes a *signed offset*
   in `[-1, 1]`, so `1.06` throws at runtime; `saturation()` and `contrast()` are *multipliers* where
   `1` is neutral. Ranges are validated and throw rather than clamping. Read each effect's own `.d.ts`
   — there is no single convention to assume.

**The fifteen**
`duotone({darkColor, lightColor, threshold})` · `halftone({dotSize, dotSpacing, rotation, colorMode})` ·
`scanlines({amount, spacing, thickness})` · `thermalVision({})` · `pixelate({blockSize})` ·
`emboss({})` · `contourLines({})` · `dotGrid({dotSize, gridSize})` · `venetianBlinds({})` ·
`chromaticAberration({amount})` · `fisheye({})` · `mirror({})` · `speckle({})` ·
`vignette({amount, radius})` · `invert({})`.

**One effect per element**
Each tile is its own `<CanvasImage>` with a single-entry `effects` array. Effects apply only to
canvas-backed components — `<CanvasImage>`, `<Video>` from `@remotion/media`, `<Solid>`,
`<HtmlInCanvas>` — never to a plain `<div>`. Stacking several in one array composes them in order,
which is a different lesson; here each tile shows exactly one so the sheet stays legible as a reference.

**The layout and the sweep**
- 1920×1080, 30fps, 380 frames. Background `#0a0b10`. A 5×3 grid computed from
  `useVideoConfig()` — `cellW = (width - PAD*2 - GAP*(columns-1)) / columns` with `PAD = 64`, `GAP = 16`,
  a 150px header and 88px reserved at the bottom.
- Tiles stagger in 4 frames apart, scaling 0.9→1.
- Once every tile has landed, a **spotlight walks the grid**:
  `spotIndex = Math.floor((frame - sweepStart) / spotFrames) % tiles.length`. The lit tile takes the
  accent border, scales to 1.05, gets `zIndex: 5` and a shadow; every other tile drops to
  `opacity: 0.55`. Dimming the rest rather than only brightening one is what makes the sweep readable
  on a busy sheet.
- The lit tile's **exact call** is spelled out in monospace along the bottom. The point of a catalogue
  is that you can copy the line, so show the line.
- Tile captions need `whiteSpace: 'nowrap'`, `overflow: 'hidden'` and `textOverflow: 'ellipsis'` —
  `chromaticAberration` does not fit a fifth of the frame.

**Requirements**
- One self-contained `.tsx` file exporting `EffectsCatalogue`.
- Props: `src`, `title`, `columns`, `stagger`, `startAt`, `spotFrames`, `accentColor`,
  `backgroundColor`.
- Type the tile list as `{name: string; call: string; effect: EffectDescriptor<unknown>}[]` —
  `EffectDescriptor` is exported from `remotion` and is what every effect factory returns.
- Use a source plate with **real fine detail**. On a smooth gradient, `halftone`, `emboss`,
  `contourLines` and `pixelate` all look nearly identical to the original and the sheet proves nothing.
- Load Inter via `@remotion/google-fonts/Inter`.
