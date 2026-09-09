Build a Remotion composition called **GradientTextSweep**: a huge word through which a multi-colour
gradient continuously travels.

**The look**
- 1920×1080, 30fps, 90 frames. Near-black background `#07070b`, everything centred.
- Title in Outfit, 260px, weight 800, letter-spacing `-0.045em`, line-height 1. Default word:
  `Gradient`.
- Subtitle below at 36px, weight 800, uppercase, letter-spacing `0.3em`, muted `#5b5b6b`, 18px gap.

**The gradient sweep — the technique**
- Build `linear-gradient(100deg, …)` from six stops: `#ff5c39, #ffb03a, #4ade80, #38bdf8, #a78bfa, #ff5c39`.
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
