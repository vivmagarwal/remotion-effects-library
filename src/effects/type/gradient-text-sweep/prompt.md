Build a Remotion composition called **GradientTextSweep**: a huge word through which a multi-colour
gradient continuously travels.

**The look**
- 1920×1080, 30fps, 90 frames. Background `theme.bgDeep` (house `#04050a`), everything centred.
- Title in Outfit, 260px, weight 800, letter-spacing `-0.045em`, line-height 1. Default word:
  `Gradient`.
- Subtitle below at 36px, weight 800, uppercase, letter-spacing `0.3em`, `theme.paperMuted`
  (house `#4a4e5a`), 18px gap.

**The gradient sweep — the technique**
- Build `linear-gradient(100deg, …)` from six stops taken from the theme palette:
  `[theme.series[0], theme.series[3], theme.series[2], theme.series[1], theme.series[4], theme.series[0]]`,
  house `#ff5c39, #ffd166, #c6ff3d, #4cc9f0, #c77dff, #ff5c39`.
  **Repeat the first colour as the last stop** so the pass loops without a visible seam.
- Apply it to the title as `backgroundImage`, with `backgroundSize: '300% 100%'`,
  `WebkitBackgroundClip: 'text'`, `backgroundClip: 'text'` and `color: 'transparent'`.
- The oversized `backgroundSize` is the whole point: it gives the gradient spare width to travel
  across. Animate `backgroundPosition` from `'0% 50%'` to `'200% 50%'` linearly over ~3 seconds
  (`extrapolateRight: 'extend'` so it keeps going past the keyframe).
- Both ends of the interpolation need the same units — `'0% 50%'` → `'200% 50%'`, not `0` → `'200%'`.
- On entry the title also scales 0.9→1 over 24 frames with `Easing.bezier(0.16, 1, 0.3, 1)` and
  `output: 'perceptual-scale'`, and fades in over 16 frames. The subtitle rises `'0px 22px'` → `'0px 0px'`
  and fades in slightly later.

**Requirements**
- One self-contained `.tsx` file exporting `GradientTextSweep`.
- Props: `title`, `subtitle`, `colors`, `backgroundColor`, `sweepSeconds` — optional, defaults above.
- Load Outfit via `@remotion/google-fonts/Outfit`.
- Do **not** use a CSS `@keyframes` animation for the sweep — it will not render. The
  `backgroundPosition` must come from `interpolate(useCurrentFrame(), …)`.
