Build a Remotion composition called **ParticleField**: hundreds of particles drifting through space
toward the camera, with nearby ones linked into constellations.

**The core idea — no simulation**
Do not keep particle state and advance it each frame. Remotion renders frames out of order and in
parallel, so a stateful loop produces different output every time. Instead make every particle's
position a **closed-form function of the frame and its seed**:

```tsx
const t = frame / fps;
const angle  = random(`a-${i}`) * Math.PI * 2;
const spread = 0.18 + random(`r-${i}`) * 0.82;
const z      = (random(`z-${i}`) + t * speed) % 1;    // ← depth wraps; loops forever, no state
const persp  = 0.22 + z * z * 1.9;                     // quadratic: near things grow fast
const x = 50 + Math.cos(angle) * spread * 44 * persp;  // percentages
const y = 50 + Math.sin(angle) * spread * 40 * persp;
const size = (1.2 + random(`s-${i}`) * 3.4) * persp;
```

The `% 1` on depth is the whole trick: particles wrap from the near plane back to the far one with no
bookkeeping, and the loop is seamless. The **quadratic** `z * z` (rather than linear) is what makes it
feel like perspective — distant particles barely move while near ones rush past.

Use `random(seed)` from `remotion`, never `Math.random()` — otherwise the field re-rolls every frame
and turns into static.

**Fading**
`opacity: Math.min(1, z * 4) * (1 - Math.max(0, (z - 0.86) / 0.14))` — particles fade up out of the far
plane and fade out as they sweep past the camera, so nothing ever pops in or out.

**Constellations**
Take the particles in the mid-depth band (`z > 0.42 && z < 0.9`), and for every pair closer than 8.5%
of the frame draw an SVG `<line>` between them, stroked in `theme.series[1]`, with opacity
`(1 - d / 8.5) * 0.34`. Restricting to the mid band keeps the pair count manageable and stops lines
being drawn between things at wildly different depths.

**The look**
- 1920×1080, 30fps, 240 frames. Background `theme.bgDeep` (`#04050a`) under a neutral vignette,
  `radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.055) 0%, rgba(0,0,0,0.42) 68%)`.
- 220 particles coloured from `colors`, default
  `[theme.series[1], theme.series[4], theme.series[3], theme.ink]`: cyan, violet, amber and white in
  the house theme. A glow (`boxShadow: 0 0 ${size * 3}px ${color}`) only on particles bigger than 3px,
  so the near ones read as bright and the far ones stay crisp.
- Centred title in the display face (`displayFamily = theme.display`, Sora by default) at 132px
  weight 700, letter-spacing `0.16em`, with `` textShadow: `0 0 70px ${theme.series[1]}80` ``, and a
  small uppercase subtitle below.

**Requirements**
- One self-contained `.tsx` file exporting `ParticleField`.
- Props: `count`, `title`, `subtitle`, `colors`, `backgroundColor`, `speed`, `connect` — optional.
- Load Sora via `@remotion/google-fonts/Sora`.
