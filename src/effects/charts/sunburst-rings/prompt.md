Build a Remotion composition called **SunburstRings**: a hierarchy drawn as concentric arc rings
that open outward from the root.

**Setup**

```bash
npm i d3-hierarchy d3-shape
npm i -D @types/d3-hierarchy @types/d3-shape
```

**The one substitution that makes a sunburst**
`partition()` lays a tree into a **rectangle**: `x0/x1` is the span, `y0/y1` is the depth. Size that
rectangle `[2π, radius]` and those rectangles become polar arcs. That is the entire technique.

```tsx
const nodes = useMemo(() => {
  const root = hierarchy<Node>(data, (d) => d.children)
    .sum((d) => d.value ?? 0)                       // sum() is what gives leaves their span
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  return partition<Node>().size([Math.PI * 2, radius])(root)
    .descendants()
    .slice(1);                                      // drop the root; it is the hole in the middle
}, [data, radius]);
```
The layout is a pure function of the data — deterministic on every frame, so only the sweep animates.

**The arc**

```tsx
const arcGen = useMemo(() =>
  d3arc<{startAngle: number; endAngle: number; innerRadius: number; outerRadius: number}>()
    .padAngle(0.008).padRadius(radius).cornerRadius(theme.radius / 6),
  [radius, theme.radius]);
```

**The reveal — two things at once**
Each ring opens one beat after the ring inside it (`begin = startAt + (depth - 1) * ringStagger`),
and each wedge sweeps its angle open **while also** growing outward from its inner radius. Doing
both is what makes it read as a level unfolding rather than merely appearing:

```tsx
const d = arcGen({
  startAngle:  n.x0,
  endAngle:    n.x0 + (n.x1 - n.x0) * p,
  innerRadius: n.y0,
  outerRadius: n.y0 + (n.y1 - n.y0) * p,
});
```
`p` runs `0 → 1` over 30 frames on `Easing.bezier(0.22, 1, 0.32, 1)`.

**Inherited colour**
Declare a colour only on the depth-1 branches and walk up for everything else, so adding a leaf
never means restating a palette:

```tsx
const colorOf = (n) => {
  let cur = n;
  while (cur) { if (cur.data.color) return cur.data.color; cur = cur.parent; }
  return theme.muted;
};
```

**Labels**
Ride the arc at its mid-angle and mid-radius, flipped past the vertical so none read upside down.
Suppress any wedge narrower than `0.16 rad`, and only draw once `p > 0.85` — a label inside a wedge
that is still sweeping open spills outside it.

**The scene**
- 1920×1080, 30fps, 180 frames. Background `theme.bg` under a scrim picked by `theme.scheme`: dark
  `rgba(255,255,255,0.055) -> rgba(0,0,0,0.42) at 70%`, light
  `rgba(255,255,255,0.5) -> rgba(0,0,0,0.06) at 70%`.
- `radius = Math.min(width - 560, height - 300) / 2`, centred at `(width/2, height/2 + 44)`.
- Depth 1 is solid (`fillOpacity: 0.92`, text knocked out in `backgroundColor`); deeper rings are
  `fillOpacity: 0.42` with a `theme.stroke * 1.6 / 3` stroke in the same colour and light text.
- The root's name sits in the middle hole at 30px/800.
- Title (56px/800 in `displayFamily`) and monospace subtitle centred at the top.

**Data**
A four-branch tree — compose / animate / draw / encode — each with 3–4 leaves carrying values.
Branch colours `theme.series[1]`, `[0]`, `[4]`, `[2]` (compose, animate, draw, encode), from a
`defaultData(theme.series)` default.

**Requirements**
- One self-contained `.tsx` file exporting `SunburstRings`.
- Props: `title`, `subtitle`, `data`, `ringStagger` (16), `startAt` (16), `backgroundColor`,
  `paperColor`.
- Load Inter via `@remotion/google-fonts/Inter`.
