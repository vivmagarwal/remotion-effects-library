Build a Remotion composition called **CssCardFlip** (composition id `css-card-flip`): a two-sided card
flipping in real 3D, using nothing but CSS.

**The three properties — each one is load-bearing**

```tsx
// 1. On the PARENT of the rotating element.
<AbsoluteFill style={{perspective: 1900, /* … */}}>

  {/* 2. On the element that rotates. */}
  <div style={{
    position: 'relative', width: 940, height: 560,
    transformStyle: 'preserve-3d',
    transform: `rotateY(${rotation}deg)`,
  }}>

    {/* 3. On each face. */}
    <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden'}}>…front…</div>
    <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                 transform: 'rotateY(180deg)'}}>…back…</div>
  </div>
</AbsoluteFill>
```

- **`perspective` on the parent.** It establishes the vanishing point for its children. Set on the
  rotated element itself it does nothing, and `rotateY` collapses into a horizontal squash.
- **`transformStyle: 'preserve-3d'` on the rotating element.** Without it the browser flattens the
  children into the parent's plane, so the back face never goes behind anything — it just mirrors.
- **`backfaceVisibility: 'hidden'` on each face.** This is what hides the side pointing away from the
  camera. Without it both faces draw on top of each other and you read the back face mirrored through
  the front. Include `WebkitBackfaceVisibility` too.
- **The back face is pre-rotated `rotateY(180deg)`** so that at 0° it is facing away, and at 180° it is
  facing you. Both faces are `position: absolute; inset: 0` in the same box.

**The rotation**

```tsx
const rotation = interpolate(frame, [0, 40, 95, 140], [0, 180, 360, 540],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.5, 0, 0.2, 1)});
```

Every keyframe is a multiple of 180 so the card always comes to rest **on a face**, never edge-on. The
easing accelerates into each turn and settles out of it, which is what a physical flip does.

**The faces**
- 1920×1080, 30fps, 165 frames. Background `theme.bg` (`#0a0b10`) with
  `radial-gradient(ellipse at 50% 44%, rgba(255,255,255,0.055) 0%, rgba(0,0,0,0.42) 62%)`.
- Card 940×560, radius `theme.radius × 1.56` (28 at the house 18), padding `58px 62px`,
  `1px solid rgba(255,255,255,0.14)`, `boxShadow: '0 40px 90px rgba(0,0,0,0.5)'`, content vertically
  centred.
- Front: `linear-gradient(150deg, #1c2030, #10131d)`. Back: `linear-gradient(150deg, theme.accent, the
  accent multiplied per channel by (184/255, 50/92, 42/57))` — `#ff5c39` to `#b8322a` under the house
  theme. Title and body `#fff5f1` with a `#ffd8cc` eyebrow, or `theme.accentInk` (eyebrow at `b3`
  alpha) when the accent's relative luminance is above 0.4, because light type on a light accent
  (console lime) reads at 1.1:1.
- Each face: an uppercase eyebrow at 26px weight 700 with `letter-spacing: 0.24em` in an accent colour,
  a title at 92px weight 800 letter-spacing `-0.035em` in `theme.display`, and a body line at 32px
  weight 500 at `opacity: 0.78`. The eyebrow and body ride the scene's `theme.text`.
- The whole card also scales 0.9→1 over the first 22 frames with `output: 'perceptual-scale'`.

**Requirements**
- One self-contained `.tsx` file exporting `CssCardFlip`.
- Props: `theme`, `front`, `back` (each `{eyebrow, title, body, background, color, accent}`), `flips`
  (array of `[frame, degrees]` pairs), `backgroundColor`, `cornerRadius`, `fontFamily`,
  `displayFamily`. `theme` is destructured first so the rest can default off it, and any single prop
  still wins over the theme.
- Load Inter via `@remotion/google-fonts/Inter`.
- This is one of the cases the CSS transform shorthands cannot express — an order-sensitive rotation in
  a 3D context — so a `transform` string is correct here. `scale` still goes in as a shorthand alongside
  it.
