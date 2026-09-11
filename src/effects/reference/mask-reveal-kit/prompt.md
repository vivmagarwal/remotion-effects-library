Build a Remotion composition called **MaskRevealKit** (composition id `mask-reveal-kit`): six different
reveals, all produced by one function.

**One mechanism, six results**
A CSS `mask-image` gradient decides what shows: **opaque areas keep the layer, transparent areas cut it
away**. Parameterise the gradient's stops by progress and the whole family falls out of one function:

```tsx
export const maskFor = (pattern: MaskPattern, p: number): string => {
  const pct = p * 100;
  switch (pattern) {
    case 'wipe':
      return `linear-gradient(90deg, #000 ${pct}%, transparent ${pct}%)`;
    case 'softWipe':
      return `linear-gradient(90deg, #000 ${pct - 12}%, transparent ${pct + 4}%)`;
    case 'diagonalStripes':
      return `repeating-linear-gradient(48deg, #000 0 ${p * 86}px, transparent ${p * 86}px 86px)`;
    case 'iris':
      return `radial-gradient(circle at 50% 50%, #000 ${p * 78}%, transparent ${p * 78 + 6}%)`;
    case 'barnDoor':
      return `linear-gradient(90deg, transparent ${50 - pct/2}%, #000 ${50 - pct/2}%, #000 ${50 + pct/2}%, transparent ${50 + pct/2}%)`;
    …
  }
};
```

Export it. A seventh reveal is one more `case`, not a new component, and any of them works over any
content — image, video, text, a whole scene.

**The details that matter**

- **Always set both `maskImage` and `WebkitMaskImage`.** Chrome still wants the prefixed form, and a
  missing prefix means no mask at all — the layer simply shows in full, which looks like the effect
  silently not running rather than like an error.
- **Stripes must widen, not travel.** `repeating-linear-gradient(48deg, #000 0 ${p * 86}px, transparent
  ${p * 86}px 86px)` grows each band from nothing to the full pitch, so the picture *fills in between*
  the stripes. Sliding a fixed-width stripe pattern across instead makes the image look like it is
  moving underneath a fence.
- **`stairStep` is a multi-layer mask** — a comma-separated list of gradients, each with its own
  `position / size no-repeat`, one per horizontal band, each lagging the last. When you use a
  multi-layer mask you must set `maskRepeat: 'no-repeat'` and **not** force `maskSize`, or the
  per-layer sizes in the shorthand are overridden and every band covers the whole frame.
- The iris radius has to exceed 100% to reach the corners — a percentage in a radial mask is measured
  against a reference length shorter than the diagonal.

**The composition**
- 1920×1080, 30fps, 330 frames. Cycle the six patterns, 30 frames of reveal and 22 of hold each:
  `index = Math.floor(elapsed / cycle) % patterns.length`.
- Put a **visible under-layer** behind the masked one —
  `repeating-linear-gradient(48deg, rgba(255,255,255,0.05) 0 12px, transparent 12px 24px)` over
  `backgroundColor` (`theme.bg`) — alpha stripes, so the themed ground shows through. Against a flat
  background you cannot tell a mask from a fade; against a texture the cut edges are obvious, which is
  the whole point of a reveal.
- HUD: a tracked title and an `01 / 06` counter at the top, the current pattern name in `theme.display`
  at 84px weight 800 at the bottom, and a progress rail. Give the HUD `pointerEvents: 'none'` and heavy
  text shadows — it sits over an image that changes completely during the shot.

**Requirements**
- One self-contained `.tsx` file exporting `MaskRevealKit`, the `maskFor` helper and a `MaskPattern`
  type.
- Props: `src`, `patterns`, `revealFrames`, `holdFrames`, `startAt`, `accentColor`, `backgroundColor`.
- Ease the reveal with `Easing.bezier(0.4, 0, 0.2, 1)`.
- Load Inter via `@remotion/google-fonts/Inter`.
