Build a Remotion composition called **PixelDissolveReveal** (composition id `pixel-dissolve-reveal`):
an image materialising out of nothing as its mosaic resolves and a dissolve fills in.

**Setup**
`@remotion/effects` runs on WebGL2 — add `Config.setChromiumOpenGlRenderer('angle')` to
`remotion.config.ts` (or pass `--gl=angle`), or it renders black. Import each effect from its own
subpath.

**One progress, two opposed directions**

```tsx
const progress = interpolate(frame, [startAt, startAt + revealFrames], [0, 1],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.36, 0, 0.18, 1)});

const block = Math.max(1, maxBlock * (1 - progress));   // 64px → 1px: mosaic sharpens
const dissolve = 1 - progress;                           // 1 → 0: see the note below
```

```tsx
effects={[
  pixelate({blockSize: block}),
  pixelDissolve({progress: dissolve, columns: 44, rows: 26, seed: 7, feather: 0.35}),
]}
```

Because both come from the same value, the picture **arrives once**. Give them separate timings and you
get two reveals landing at slightly different moments, which reads as a mistake.

**`pixelDissolve`'s `progress` counts DOWN for a reveal.** Its `progress` is *how much of the image
has dissolved away*, not how much has arrived: at `0` the picture is fully present, at `1` the frame is
empty. Verify it yourself by rendering one plate at `0, 0.25, 0.5, 0.75, 1` side by side before you
trust either direction. Pass a 0→1 reveal progress straight through and the shot runs backwards and
ends on an empty frame — which renders with no error and leaves you a black poster.

**The order in the array is load-bearing.** Effects apply in sequence: mosaic first, then dissolve the
mosaic. Put the dissolve first and the pixelate re-blocks its hard cell edges, turning a clean reveal
into noise.

**Clamp the block size.** `pixelate({blockSize: 0})` is a no-op or worse — `Math.max(1, …)` keeps the
last frames at full detail rather than flickering back to the unprocessed source.

**Give the dissolve a fixed `seed`.** It decides which cells appear in which order. Left to vary, the
pattern re-rolls and the reveal is different on every render.

**The HUD**
- 1920×1080, 30fps, 150 frames. Background `#07080d`, accent `#c6ff3d`, JetBrains Mono.
- A **scan grid** matched to the dissolve's own cell count —
  `backgroundSize: \`${100 / columns}% ${100 / rows}%\`` from two 1px linear-gradients — fading out as
  `1 - progress`. Matching the grid to the dissolve is what makes the cells look intentional rather
  than like compression artefacts.
- Title top-left, a zero-padded percentage top-right with `fontVariantNumeric: 'tabular-nums'`, a
  readout and a progress rail along the bottom. Put `textShadow: '0 2px 14px rgba(0,0,0,0.7)'` on the
  HUD text — it sits over an image whose brightness changes completely during the shot.
- Give the overlay `pointerEvents: 'none'`.

**Requirements**
- One self-contained `.tsx` file exporting `PixelDissolveReveal`.
- Props: `src`, `title`, `readout`, `revealFrames`, `startAt`, `maxBlock`, `gridColumns`, `gridRows`,
  `accentColor`.
- Effects apply to canvas-backed components only — `<CanvasImage>`, `<Video>` from `@remotion/media`,
  `<Solid>`, `<HtmlInCanvas>`. They cannot be applied to a plain `<div>`.
- Load JetBrains Mono via `@remotion/google-fonts/JetBrainsMono`.
