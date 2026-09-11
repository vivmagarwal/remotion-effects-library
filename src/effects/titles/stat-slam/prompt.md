Build a Remotion composition called **StatSlam**: a cold open where one statistic arrives hard.

**The look**
- 1920×1080, 30fps, 120 frames. Background `backgroundColor` (`theme.bg`, `#0a0b10`) with a glow
  behind the number: ``radial-gradient(ellipse at 50% 46%, ${accentColor}22 0%, transparent 60%)``.
  Accent `accentColor` (`theme.accent`, `#ff5c39`).
- The stat in `displayFamily` (`theme.display`; Anton is the inline value) at 430px, line-height 0.86,
  letter-spacing `-0.03em`, `color` (`theme.ink`), with `fontVariantNumeric: 'lining-nums'`, because a
  serif theme's default old-style figures otherwise drop the 7 and 3 through the accent rule. Default
  `73%`.
- A 7px accent rule below it, a context line in Inter at 52px weight 700 (`theme.body` `#eef1f7`,
  max-width 1250, centred, `textWrap: 'balance'`), and a small source credit at 26px in
  `theme.paperMuted` (`#4a4e5a`).

**The impact — three cues on the same frame (`impactFrame = 14`)**

1. **The slam.** `interpolate(frame, [0, impactFrame], [7, 1], {easing: Easing.bezier(0.2, 0.9, 0.1, 1),
   output: 'perceptual-scale'})` — the number comes from 7× and decelerates hard into place.
2. **The shockwave.** A 620px ring (``${theme.stroke * 4/3}px solid ${accentColor}`` — 4px at house,
   `borderRadius: 50%`) centred behind the
   number, scaling 0.2→3.4 over 26 frames and fading 0.75→0.
3. **The camera kick.** On the **root `<AbsoluteFill>`**:

```tsx
const kick = interpolate(since, [0, 3, 10], [0, 14, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
translate: `${Math.sin(since * 2.4) * kick}px ${Math.cos(since * 3.1) * kick * 0.6}px`,
```

   **Apply this to the root, not to the number.** Moving everything — background, glow, ring, type — is
   what reads as the camera being hit; shaking only the number reads as the number wobbling. Using
   different multipliers on the two axes (2.4 and 3.1) keeps the shake from tracing a straight line.

**The recoil**
`interpolate(since, [0, 4, 14], [1, 0.972, 1], …)` multiplied into the number's scale. Without it the
number simply stops, which looks like a missing frame. 2.8% is enough — more looks like a bounce.

**The follow-through**
- The accent rule snaps 0→760px over frames `since 2 → 16` on `Easing.bezier(0.14, 0.9, 0.2, 1)`.
- The context line rises `'0px 26px'` → `'0px 0px'` and fades in over `since 6 → 24`.
- The source credit fades in last, `since 22 → 40`.

**Requirements**
- One self-contained `.tsx` file exporting `StatSlam`.
- Props: `stat`, `context`, `source`, `backgroundColor`, `color`, `accentColor`, `impactFrame`.
- Load Anton and Inter via `@remotion/google-fonts`.
- `scale` values are numbers; `translate` needs `px` on both components.
