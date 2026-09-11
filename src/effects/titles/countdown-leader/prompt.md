Build a Remotion composition called **CountdownLeader** (composition id `countdown-leader`): an
Academy-style film-leader countdown.

**The look**
- 1920×1080, 30fps, 190 frames. Ground `backgroundColor` (`theme.paperInk`, `#1d1b17`), ink
  `inkColor` (`theme.paper`, `#f6f5f2`), accent `accentColor` (`theme.accentOnPaper`, `#c2410c`); on
  a light-scheme theme (`theme.scheme === 'light'`) ground and ink swap, so the leader prints dark on
  paper. Oswald throughout.
- A full-width and full-height crosshair in `` `${inkColor}44` ``, `theme.stroke` (3px).
- An SVG disc sized to `min(width, height) * 0.42` radius: an outer ring (`theme.stroke * 4/3`,
  `` `${inkColor}55` ``), an inner ring at 62% radius (`theme.stroke`, `` `${inkColor}33` ``), a
  semicircular wiper wedge filled `` `${inkColor}12` ``, and a `theme.stroke * 5/3` radial hand.
- The number at 460px weight 500 in the ink colour, with `font-variant-numeric: lining-nums`, because
  a serif theme's old-style figures otherwise drop off the crosshair centre; when the count reaches
  zero it becomes the word `ACTION` at 190px in the accent colour with `letter-spacing: 0.14em`.

**The timing — two derived values drive everything**

```tsx
const second       = Math.floor(frame / fps);      // which number
const withinSecond = (frame % fps) / fps;          // 0→1 inside that second
const number       = from - second;
```

From those two:
- **Wiper sweep**: `rotate: \`${withinSecond * 360}deg\`` on both the wedge and the hand, with
  `transformOrigin: \`${R}px ${R}px\``. One full turn per second, forever, at any countdown length.
- **Number settle**: `interpolate(withinSecond, [0, 0.16], [1.14, 1], {output: 'perceptual-scale'})` —
  each number arrives slightly oversized and settles inside its own second.
- **Cue punch**: show a 74px ink dot at 9%/11% from the top-right while `frame % fps < 3`.
- **Frame flash**: a full-screen ink `<AbsoluteFill>` at `opacity: 0.1` while `frame % fps < 2`.

Deriving all four from the same two expressions means the countdown works for any `from` value with no
per-number bookkeeping and no array of keyframes. That is the whole design.

**Grain that actually moves**

```tsx
backgroundImage: `url("data:image/svg+xml,%3Csvg …%3CfeTurbulence type='fractalNoise'
  baseFrequency='0.9' numOctaves='2' seed='${Math.floor(random(`grain-${frame}`) * 100)}'/%3E …")`,
```

at `opacity: 0.2`, `mixBlendMode: 'overlay'`. **Reseed the turbulence on every frame** — a fixed seed
gives you a static texture stuck to the screen, which reads as a dirty lens, not as film. Use
`random()` from `remotion`, not `Math.random()`.

**Requirements**
- One self-contained `.tsx` file exporting `CountdownLeader`.
- Props: `from` (default 5), `finalWord`, `backgroundColor`, `inkColor`, `accentColor`, `grain`.
- Load Oswald via `@remotion/google-fonts/Oswald`.
- Draw the wedge as an SVG path: `M R R L R 0 A R R 0 0 1 R ${R*2} Z` — a semicircle from the centre.
- `rotate` needs a unit: `` `${deg}deg` ``.
