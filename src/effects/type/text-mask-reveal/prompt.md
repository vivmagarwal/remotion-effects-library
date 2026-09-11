Build a Remotion composition called **TextMaskReveal**: a huge word that acts as a window onto a
drifting field of colour.

**The look**
- 1920×1080, 30fps, 150 frames. Page `theme.paper` (house `#f6f5f2`), everything centred.
- Title in Anton SC, 380px, line-height 0.92, `fontWeight: 800` with `fontSynthesis: 'none'`. Anton SC
  renders its one weight unchanged, and a theme's display face gets the heavy cut that makes the window
  read. Default word: `INSIDE`.
- Caption beneath in `theme.text` (Inter, loaded with `@remotion/google-fonts/Inter` at 500), 30px,
  weight 500, uppercase, letter-spacing `0.28em`, `theme.paperMuted` (house `#4a4e5a`), 26px below.
  Fades in around frame 24–46.

**The mask**
- Build the scene as a comma-separated stack of `radial-gradient(circle at X% Y%, COLOR 0%, transparent R%)`
  layers — four blobs coloured `theme.series[0]`, `theme.series[1]`, `theme.series[3]`,
  `theme.series[2]` (house `#ff5c39`, `#4cc9f0`, `#ffd166`, `#c6ff3d`).
- Each blob drifts on its own phase, derived from the frame in seconds (`t = frame / fps`):
  `x = baseX + Math.sin(t * 0.6 + i * 1.7) * 13`, `y = baseY + Math.cos(t * 0.5 + i * 2.3) * 11`.
  Different multipliers per blob is what keeps them from moving as one block.
- **Stack a flat dark layer underneath the blobs** — append
  `linear-gradient(${theme.paperInk}, ${theme.paperInk})` (house `#1d1b17`) as the last
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
- Load Anton SC and Inter via `@remotion/google-fonts`.
- No CSS `@keyframes` — the drift must come from `useCurrentFrame()`.
- To show real footage through the type instead, put a `<Video>` from `@remotion/media` in an
  `<AbsoluteFill>` and mask it with a text-shaped element rather than clipping a gradient.
