Build a Remotion composition called **MetaballGoo**: circles that merge into each other with liquid
necks, using nothing but two SVG filter primitives.

**Setup**

```bash
npx remotion add @remotion/google-fonts
```

**The whole effect is three lines of filter**

```tsx
<filter id={`goo-${svgId}`} x="-30%" y="-30%" width="160%" height="160%">
  {/* 1. Bleed neighbouring shapes into each other. */}
  <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blurred" />

  {/* 2. Snap the alpha back to a hard edge. ONLY the alpha row is touched:
         the three colour rows are identity. Multiply alpha by `contrast`,
         then subtract `cutoff` — everything above the cutoff becomes opaque,
         everything below becomes transparent, and where two blurs overlapped
         their SUM crosses the cutoff. That overlap is the neck. */}
  <feColorMatrix
    in="blurred"
    mode="matrix"
    values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${contrast} -${cutoff}`}
    result="goo"
  />

  {/* 3. Put the crisp originals back on top of the merged mass. */}
  <feBlend in="SourceGraphic" in2="goo" />
</filter>
```

Three things will bite you:

- **The filter region must be expanded.** The default is `-10% / 120%`, which clips the blur at the
  bounding box and leaves visible straight edges. `x="-30%" y="-30%" width="160%" height="160%"`.
- **`contrast` below about 30 leaves the edge soft** — it looks like a blur, not like liquid. And
  `cutoff` at roughly `contrast * 0.4` keeps the blobs their original size; too low and everything
  inflates, too high and they shrink and stop touching.
- **`stdDeviation` sets how far apart necks form.** Bigger blur, longer reach.

Apply it with ``<g filter={`url(#goo-${svgId})`}>`` around the circles — nothing else. `svgId` is `useId().replace(/[^a-zA-Z0-9_-]/g, '')`: a literal `id="goo"` is global to the page, and a second copy of this composition would filter through the first one's blobs.

**The blobs**
Every one needs its own orbit, or they move as a rigid ring and never merge:

```tsx
const t = frame / fps;

const phase = (i / count) * Math.PI * 2;
const speed = 0.34 + (i % 3) * 0.16;
const orbit = 118 + (i % 4) * 62;
const r     = 46 + (i % 3) * 20;

// A slow breathe on the orbit radius is what actually makes them touch and part.
const breathe = 1 + Math.sin(t * 0.55 + phase) * 0.34;

const x = cx + Math.cos(t * speed + phase) * orbit * breathe;
const y = cy + Math.sin(t * speed * 1.28 + phase) * orbit * 0.62 * breathe;

<circle cx={x} cy={y} r={r} fill={gooColor} />
```
The `1.28` on the y frequency makes each path a Lissajous figure rather than a circle, so the blobs
never repeat the same pass. Add one **fixed** `<circle cx={cx} cy={cy} r={72} />` as a core, so the
mass always has something to merge back into and never fully disperses.

**The scene**
- 1920×1080, 30fps, **180 frames**. Background `theme.bg` (`#0a0b10`) plus
  `radial-gradient(ellipse at 50% 50%, <gooColor>14 0%, transparent 64%)`.
- `cx = width / 2`, `cy = height / 2 + 24`.
- Overlay `<AbsoluteFill>` with `justify-content: space-between`, `align-items: center`,
  `padding: '104px 0 96px'`, `pointer-events: none`:
  - title — display face (`displayFamily = theme.display`, Inter by default) 62px weight 800,
    `letter-spacing: -0.025em`, `theme.ink`, `text-shadow: 0 4px 30px rgba(0,0,0,0.8)`, fades in over
    frames 0–22 on `Easing.bezier(0.16, 1, 0.3, 1)`
  - caption — `theme.mono`, 34px, `accentColor`, `text-shadow: 0 2px 20px rgba(0,0,0,0.9)`, fades in
    over frames 12–34. 34px, not 25: at the 0.17× a gallery card renders, 25px type is unreadable

**Requirements**
- One self-contained `.tsx` file exporting `MetaballGoo`.
- Props, with defaults: `title` (`'Metaballs'`), `caption`
  (`'feGaussianBlur + feColorMatrix · no WebGL'`), `count` (7), `blur` (26), `contrast` (34),
  `cutoff` (13), `gooColor` (`theme.series[2]`, `#c6ff3d` in the house theme), `accentColor`
  (`theme.accent`, `#ff5c39`), `backgroundColor` (`theme.bg`, `#0a0b10`).
- Load Inter via `@remotion/google-fonts/Inter`, weights `['500', '700', '800']`.
