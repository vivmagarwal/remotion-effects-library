Build a Remotion composition called **FloatingShapes** (composition id `floating-shapes`): geometric
confetti drifting upward through the frame on a seamless loop.

**The look**
- 1920×1080, 30fps, 240 frames. Background `theme.bg` with
  `radial-gradient(ellipse at 50% 120%, rgba(255,255,255,0.055) 0%, rgba(0,0,0,0.42) 62%)` on a dark
  scheme, and `rgba(255,255,255,0.55) 0%` to `rgba(20,18,14,0.06) 62%` on a light one — a glow rising
  from below either way. The dark scrim over paper is a bruise, not a backdrop.
- 46 shapes drawn from five kinds: filled circle, rounded square
  (`borderRadius: size × 0.22 × theme.radius / 18`), ring (`border: size * 0.14 solid`), plus-shaped
  cross whose two bars round at `size × 0.06 × theme.radius / 18`, and triangle
  (`clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)'`). All three radii are unchanged at the house 18.
- Colours: the theme's `[series[0], series[1], series[3], series[2], series[4], accentOnPaper]` —
  `#ff5c39`, `#4cc9f0`, `#ffd166`, `#c6ff3d`, `#c77dff`, `#c2410c`.

**One seeded depth per shape, everything derived from it**

```tsx
const z = random(`z-${i}`);                 // 0 = far, 1 = near
const size  = (0.28 + z * 0.72) * maxSize;  // near things are bigger
const drift = 0.3 + z * 0.7;                // near things move faster
filter:  `blur(${(1 - z) * 5}px)`,          // far things are softer
opacity: 0.2 + z * 0.55,                     // far things are fainter
```

Deriving size, speed, blur and opacity from a single `z` is what makes the field read as having depth.
Randomise each of them independently and you get scattered decoration instead — a big blurry shape
moving slowly beside a small sharp one moving fast reads as noise.

**The seamless loop**

```tsx
const t = frame / fps;
const y = 110 - ((random(`y0-${i}`) * 130 + t * speed * drift * 26) % 130);
```

The modulo is the whole trick. Positions wrap from the top back to the bottom with no bookkeeping, the
loop never seams, and — because there is no state to advance — any frame renders standalone, which is
what makes it renderable at all. Do not keep an array of shapes and mutate their positions per frame.

Add a small horizontal sway on a per-shape phase:
`x = random(...) * 100 + Math.sin(t * (0.3 + z * 0.4) + i * 2.1) * (2 + z * 5)`, and a slow rotation
`(random(...) - 0.5) * 120 * t * drift`.

Use `random(seed)` from `remotion`, **never `Math.random()`** — Remotion renders frames out of order,
so `Math.random()` re-rolls every shape on every frame and the whole field turns into static.

**Requirements**
- One self-contained `.tsx` file exporting `FloatingShapes`.
- Props: `theme` (first, so the rest can default off it), `count`, `colors`, `backgroundColor`,
  `speed`, `maxSize`.
- Position each shape with `left`/`top` percentages and negative margins of half its size to centre it.
- `rotate` needs a unit: `` `${deg}deg` ``.
- Fade the whole field in over the first 24 frames so it does not pop on at frame 0.
