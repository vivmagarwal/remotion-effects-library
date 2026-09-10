Build a Remotion composition called **TextMaskReveal**: a huge word that acts as a window onto a
drifting field of colour.

**The look**
- 1920×1080, 30fps, 150 frames. Warm off-white page `#f2f0ec`, everything centred.
- Title in Anton SC, 380px, line-height 0.92. Default word: `INSIDE`.
- Caption beneath in Inter, 30px, weight 500, uppercase, letter-spacing `0.28em`, muted `#8e8a84`,
  26px below. Fades in around frame 24–46.

**The mask**
- Build the scene as a comma-separated stack of `radial-gradient(circle at X% Y%, COLOR 0%, transparent R%)`
  layers — four blobs in red `#ff4d3d`, blue `#2f6bff`, yellow `#ffc93c` and green `#12c48b`.
- Each blob drifts on its own phase, derived from the frame in seconds (`t = frame / fps`):
  `x = baseX + Math.sin(t * 0.6 + i * 1.7) * 13`, `y = baseY + Math.cos(t * 0.5 + i * 2.3) * 11`.
  Different multipliers per blob is what keeps them from moving as one block.
- **Stack a flat dark layer underneath the blobs** — append `linear-gradient(#111, #111)` as the last
  background layer. Without it the letters go fully transparent wherever no blob currently sits, and the
  word breaks apart into disconnected patches.
- Apply the stack as `backgroundImage` on the title with `WebkitBackgroundClip: 'text'`,
  `backgroundClip: 'text'` and `color: 'transparent'`.
- The title also scales 1.14→1 over 30 frames (`Easing.bezier(0.16, 1, 0.3, 1)`,
  `output: 'perceptual-scale'`), and its `letter-spacing` opens slightly from `-0.055em` to `-0.02em`
  across the whole composition — a small drift that keeps the frame from feeling frozen.

**Requirements**
- One self-contained `.tsx` file exporting `TextMaskReveal`.
- Props: `title`, `caption`, `backgroundColor`, `blobs` (array of `{color, x, y, r}`) — optional, with
  the defaults above.
- Load Anton SC via `@remotion/google-fonts/AntonSC`.
- No CSS `@keyframes` — the drift must come from `useCurrentFrame()`.
- To show real footage through the type instead, put a `<Video>` from `@remotion/media` in an
  `<AbsoluteFill>` and mask it with a text-shaped element rather than clipping a gradient.
