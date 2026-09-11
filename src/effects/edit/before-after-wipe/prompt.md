Build a Remotion composition called **BeforeAfterWipe** (composition id `before-after-wipe`): a
before/after comparison whose handle sweeps across the frame.

**Setup**
`@remotion/effects` needs WebGL2 — `Config.setChromiumOpenGlRenderer('angle')` in `remotion.config.ts`
(or `--gl=angle`), or the grades render black.

The "before" side should read as **ungraded**, not as a different picture — flat, desaturated and
slightly lifted (`saturation 0.22`, `contrast 0.82`, `brightness +0.06`), against a punchy graded
"after" (`saturation 1.5`, `contrast 1.18`). Reach for something heavier like `duotone()` and you are
no longer showing a grade, you are showing two unrelated images, and the comparison loses its point.

**The structure — this is the whole thing**
Draw **both** versions full-frame at identical geometry, one stacked on the other, and clip only the
top one:

```tsx
{/* AFTER — underneath, unclipped */}
<CanvasImage src={source} style={{width: '100%', height: '100%', objectFit: 'cover'}}
             effects={[saturation({amount: 1.5}), contrast({amount: 1.18})]} />

{/* BEFORE — same geometry, clipped to the left of the handle */}
<AbsoluteFill style={{clipPath: `inset(0 ${100 - x}% 0 0)`}}>
  <CanvasImage src={source} style={{width: '100%', height: '100%', objectFit: 'cover'}}
               effects={[saturation({amount: 0.22}), contrast({amount: 0.82}), brightness({amount: 0.06})]} />
</AbsoluteFill>
```

Do **not** put the two versions side by side and resize them as the handle moves. That is the obvious
approach and it is wrong: the two halves end up at different scales or crops, so features do not line
up across the seam and the comparison quietly stops being a comparison. Identical full-frame layers
plus a moving clip keeps them in perfect registration at every position.

`clip-path: inset(top right bottom left)` — so `inset(0 ${100 - x}% 0 0)` keeps everything left of `x`.

**The sweep**
Use a multi-keyframe `interpolate` so the handle overshoots and settles rather than sliding once:

```tsx
const x = interpolate(frame, [0, 45, 80, 120, 150], [8, 82, 30, 62, 50],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.4, 0, 0.25, 1)});
```

That reads as someone dragging it back and forth to compare, which is the point of the format.

**The handle and labels**
- A `5 × theme.stroke / 3`px (5 at house) full-height bar at `left: ${x}%`, centred with a negative
  margin of half its width, and `boxShadow: '0 0 26px rgba(0,0,0,0.6)'`, plus a 96px white circle at
  mid-height containing `◀ ▶`.
- `BEFORE` top-left and `AFTER` top-right, 32px weight 600, `letter-spacing: 0.2em`, on
  `rgba(12,13,18,0.72)` pills with corner radius `10 × theme.radius / 18` (10 at house), type in
  `theme.ink`.
- **Drive each label's opacity from `x`, not from `frame`**: the before label fades in over
  `x` 12→26 and the after label fades out over `x` 74→88. Tied to position rather than time, a label
  gets out of the way exactly when the handle would cover it — however the sweep is later retimed.

**Requirements**
- One self-contained `.tsx` file exporting `BeforeAfterWipe`.
- Props: `src`, `beforeLabel`, `afterLabel`, `accentColor`, `sweep` (array of `[frame, percent]` pairs).
- Load Inter via `@remotion/google-fonts/Inter`.
- Works the same with `<Video>` from `@remotion/media` in place of `<CanvasImage>` — use two `<Video>`
  elements with the same `src` and different `effects` to compare a grade on real footage.
