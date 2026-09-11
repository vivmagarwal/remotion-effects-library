Build a Remotion composition called **AuroraMesh**: a slow, endlessly drifting mesh-gradient
background — the kind that sits behind a SaaS landing-page hero.

**The look**
- 1920×1080, 30fps, 300 frames. Base `theme.bgDeep` (`#04050a`), `overflow: hidden`.
- Five blobs coloured from `theme.series` by index: `[4]` `#c77dff` at (28, 32) size 62, `[1]`
  `#4cc9f0` (70, 28) 58, `[0]` `#ff5c39` (62, 70) 54, `[2]` `#c6ff3d` (33, 72) 60, and a smaller
  `[3]` `#ffd166` at (50, 50) 40. Each is an absolutely positioned circle sized 40–62% of the frame
  with `backgroundImage: radial-gradient(circle, COLOR 0%, COLOR00 70%)`. Index the palette — the
  blobs are the entire content, so a literal here leaves the whole effect unthemed.

**The drift**
- Work in seconds: `t = frame / fps`. Each blob orbits its own centre:

```tsx
const x = b.x + Math.cos(t * b.speed * Math.PI * 2 + b.phase) * b.travel;
const y = b.y + Math.sin(t * b.speed * Math.PI * 2 * 0.8 + b.phase) * b.travel * 0.7;
```

- Give every blob a **different `speed` and `phase`** (0.15–0.31 orbits/sec, phases spread across
  0–5.1). If the speeds share a common factor the whole field visibly pulses in sync; keeping them
  unrelated is what makes it look like it never repeats.
- Using `cos` for x and a slower `sin` for y traces an ellipse rather than a circle, which reads as
  organic drift instead of orbiting.

**What makes it look expensive**
- `filter: blur(90px)` and `mixBlendMode: 'screen'` on every blob. This is the whole trick — without
  the blur you see five circles, and without `screen` the overlaps go muddy instead of glowing.
- A vignette on top: `radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(4,3,10,0.72) 100%)`.
  It pulls the eye to the centre and hides where the blurred blobs meet the frame edge.
- A grain layer at `opacity: 0.16`, `mixBlendMode: 'overlay'`, using an inline SVG data URI with
  `feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3"`. Large flat gradients band
  badly after video compression; grain hides it.
- Blobs fade in 0→0.95 over the first 20 frames.

**Requirements**
- One self-contained `.tsx` file exporting `AuroraMesh`.
- Props: `theme` (first, so the rest can default off it), `blobs` (array of
  `{color, x, y, size, travel, speed, phase}`), `backgroundColor`, `blur`, `grain` — optional, with
  the defaults above.
- No CSS `@keyframes` and no `requestAnimationFrame` — the drift must come from
  `useCurrentFrame()`, or it will not render.
