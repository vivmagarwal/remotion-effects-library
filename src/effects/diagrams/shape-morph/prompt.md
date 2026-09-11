Build a Remotion composition called **ShapeMorph**: one silhouette becoming another, vertex by
vertex.

**Setup**

```bash
npx remotion add @remotion/paths @remotion/google-fonts
```

**`interpolatePath` is tolerant — that is not the same as good**
`interpolatePath(progress, a, b)` blends two path strings instruction by instruction. It will pad a
shorter path and promote an `L` to a `C` to match a curve rather than throwing, so it rarely fails
outright. But a morph only looks *deliberate* when both shapes carry the **same number of points in
the same winding order**, so that every vertex has exactly one counterpart. Generate the shapes
rather than hand-writing them and you get that for free:

```tsx
const CENTER = 100;
const POINTS = 12;

const toPath = (pts: readonly (readonly [number, number])[]) =>
  `M ${pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L ')} Z`;

// All shapes start at the TOP and wind CLOCKWISE, so points correspond.
const circle = (r: number) =>
  toPath(new Array(POINTS).fill(0).map((_, i) => {
    const a = (i / POINTS) * Math.PI * 2 - Math.PI / 2;
    return [CENTER + Math.cos(a) * r, CENTER + Math.sin(a) * r] as const;
  }));

const star = (outer: number, inner: number) =>
  toPath(new Array(POINTS).fill(0).map((_, i) => {
    const a = (i / POINTS) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    return [CENTER + Math.cos(a) * r, CENTER + Math.sin(a) * r] as const;
  }));
```
A square needs its sides sampled in **thirds** to reach 12 points; a plus sign has exactly 12
corners already. Defaults: `square(18, 182)`, `circle(82)`, `star(90, 40)`, `plus(58, 16, 184)`,
in that order.

**Hold, then morph**
Each shape must be legible as itself before it changes:

```tsx
const cycle = morphFrames + holdFrames;
const index = Math.floor(frame / cycle) % shapes.length;
const next  = (index + 1) % shapes.length;

const p = interpolate(frame % cycle, [holdFrames, cycle], [0, 1],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.65, 0, 0.35, 1)});

const d = useMemo(() => interpolatePath(p, shapes[index].d, shapes[next].d),
                  [p, shapes, index, next]);
```
The label flips at `p < 0.5 ? shapes[index].name : shapes[next].name`, so the name always matches
what is on screen.

**Show the vertices**
Parse the points back out of the interpolated `d` and draw a dot at each. This is what makes the
technique legible: you can see the points *correspond* through the morph rather than the outline
being re-sampled.

```tsx
d.replace(/[MLZ]/g, ' ').trim().split(/\s+/)
 .reduce<number[][]>((acc, n, i) => {
   if (i % 2 === 0) acc.push([Number(n)]);
   else acc[acc.length - 1].push(Number(n));
   return acc;
 }, [])
 .map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3.6} fill={textColor} opacity={0.92} />)
```

**The scene**
- 1920×1080, 30fps, **180 frames**. Background `theme.bg` (`#0a0b10`) plus
  `radial-gradient(ellipse at 50% 46%, <accentColor>33 0%, transparent 64%)`.
- `<svg width={SIZE} height={SIZE} viewBox="0 0 200 200" style={{overflow: 'visible'}}>` with
  `SIZE = Math.min(width * 0.42, height * 0.62)`. Not 0.3 — at 0.3 the shape is a ninth of the
  frame's area and reads as nothing on a gallery card.
- The shape: `fill={\`${accentColor}52\`}`, `stroke={accentColor}`,
  `strokeWidth={theme.stroke * 1.5}` (4.5 at the house stroke 3), `strokeLinejoin="round"`.
- Below it, centred: the name (Inter 52px weight 800, `letter-spacing: -0.02em`, `textColor`,
  `margin-top: 62`); then a 320×5 progress track (`border-radius: 3`, `overflow: hidden`,
  `margin-top: 26`) whose inner bar is `width: ${p * 100}%` in `accentColor`. The track itself is
  `theme.scheme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'` — a white hairline
  disappears on paper.
- A monospace caption at `bottom: 84`, 25px, `theme.muted` (`#8d93a5`).

**Requirements**
- One self-contained `.tsx` file exporting `ShapeMorph`.
- Props, with defaults: `shapes` (the four `{name, d}` pairs above), `caption`
  (`'interpolatePath(p, a, b) · @remotion/paths'`), `morphFrames` (26), `holdFrames` (16),
  `accentColor` (`theme.series[4]`, `#c77dff`), `backgroundColor` (`theme.bg`, `#0a0b10`),
  `textColor` (`theme.body`, `#eef1f7`).
- Load Inter via `@remotion/google-fonts/Inter`, weights `['500', '700', '800']`.
