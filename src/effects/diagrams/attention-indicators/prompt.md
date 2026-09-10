Build a Remotion composition called **AttentionIndicators** (composition id `attention-indicators`):
four ways to point at something on screen, borrowed from Manim's indication family — Circumscribe,
Indicate, Flash and FocusOn.

**Manim's rate functions**
Implement these two first; everything below eases with them.

```tsx
/** Manim's `smooth`: 3t² − 2t³. Zero velocity at both ends, no overshoot. */
const smooth = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

/** Manim's `there_and_back`: out to 1 at the midpoint, back to 0. */
const thereAndBack = (t: number) => smooth(1 - Math.abs(2 * Math.min(1, Math.max(0, t)) - 1));
```

`smooth` is smoothstep — it is why Manim animations settle instead of stopping, and it is subtly
different from a cubic bezier ease. `there_and_back` is the reason indication devices return to rest
without you writing a second animation.

**Address everything by rect**
Give each indicator a `{x, y, w, h}` and nothing else. That is what makes them reusable — the panel in
this composition is only a subject to demonstrate on, and each device should work pointed at anything.

```tsx
const runOf = (i: number) => {
  const from = startAt + i * stagger;
  if (frame < from || frame > from + runFrames) return null;
  return (frame - from) / runFrames;      // local 0→1, or null when idle
};
```

**The four devices**

1. **Circumscribe** — an SVG `<rect>` drawn on with `strokeDasharray={perimeter}` and
   `strokeDashoffset={perimeter * (1 - draw)}` where `draw = smooth(min(1, run / 0.6))`. Draws over the
   first 60% of the run, holds, then fades. Manim draws the shape on and then *removes* it; a box that
   stays behind stops being an indication and becomes part of the layout.

2. **Indicate** — `scale: 1 + thereAndBack(run) * 0.13` plus a colour swap to the accent. It must scale
   **about its own centre** so the row swells in place; scale a row from a corner and it shoves its
   neighbours.

3. **Flash** — 14 rays on a circle, `inner` growing 40→150 and `outer` 40→260, so each ray is a
   travelling segment rather than a spoke from the centre. Multiply the y component by ~0.55 to match
   the row's aspect. Opacity `[0, 0.25, 1] → [0, 1, 0]` so it appears and clears with the movement.

4. **FocusOn** — an SVG `<mask>` containing a white full-frame rect and a black ellipse; a dim
   `#05070c` rect is drawn through it. Animate the ellipse's `rx`/`ry` from the whole frame down to
   just around the target on `thereAndBack`, so the room closes in and opens back up. The mask is the
   point: dimming everything and drawing a bright shape on top gives you a glow, not a spotlight.

**The look**
- 1920×1080, 30fps, 280 frames. `#0d1117` with
  `radial-gradient(ellipse at 50% 36%, #182131 0%, #0b0e14 68%)`.
- A panel at `#161c26`, `1px solid #232c3a`, radius 22, holding four 132px rows. Each row: a name at
  42px weight 700 on the left and a description at 32px weight 500 in `#79839a` on the right.
- Accent `#ffcf3d`. A monospace caption at the bottom naming whichever device is currently running.
- Fire them 58 frames apart, 46 frames each.

**Requirements**
- One self-contained `.tsx` file exporting `AttentionIndicators`.
- Props: `title`, `rows` (array of `{label, value}`), `startAt`, `stagger`, `runFrames`,
  `accentColor`, `backgroundColor`.
- Put the SVG layer above the panel but keep the rows as real DOM, so `Indicate` can scale text and the
  SVG devices can be drawn over it.
- Take `width`/`height` from `useVideoConfig()` for the full-frame mask.
- Load Inter via `@remotion/google-fonts/Inter`.
