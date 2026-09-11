Build a Remotion composition called **Streamgraph**: stacked bands flowing like a river around a
wandering baseline, drawing themselves left to right.

**Setup**

```bash
npm i d3-shape d3-scale
npm i -D @types/d3-shape @types/d3-scale
```

**The two choices that make it a streamgraph**
A stacked area chart and a streamgraph are the same generator with different options:

```tsx
const series = useMemo(() =>
  d3stack<Row, string>()
    .keys(keys)
    .offset(stackOffsetWiggle)      // floats the baseline to minimise wobble → a current, not a pile
    .order(stackOrderInsideOut)(rows),   // earliest peaks on the outside → the eye follows the flow
  [keys, rows]);
```
And `curveBasis` on the area — with the default linear curve the same data looks like cut paper.

**The gotcha that follows from the wiggle**
`stackOffsetWiggle` produces a **signed** baseline. The y domain is not `[0, max]`; read the extent
back out of the stacked output:

```tsx
let min = Infinity, max = -Infinity;
for (const s of series) for (const point of s) {
  if (point[0] < min) min = point[0];
  if (point[1] > max) max = point[1];
}
const y = scaleLinear().domain([min, max]).range([plotH, 0]);
```

**The area generator**

```tsx
const areaGen = useMemo(() =>
  d3area<SeriesPoint<Row>>()
    .x((_, i) => x(i))
    .y0((d) => y(d[0]))
    .y1((d) => y(d[1]))
    .curve(curveBasis),
  [x, y]);
```

**The data**
Generate it with `random(seed)` from `remotion` — never `Math.random()`, or every frame gets
different data. Each series is a Gaussian bump at its own point in time plus a little texture:

```tsx
const t       = i / (samples - 1);
const peak    = 0.14 + (ki / keys.length) * 0.78;
const spread  = 0.16 + random(`w-${k}`) * 0.16;
const bump    = Math.exp(-((t - peak) ** 2) / (2 * spread * spread));
const texture = 0.82 + random(`n-${k}-${i}`) * 0.36;
row[k] = bump * (34 + random(`h-${k}`) * 70) * texture + 1.4;
```

**The reveal**
An SVG `clipPath` whose rect grows to `plotW * p` over 96 frames on `Easing.bezier(0.32, 0, 0.16, 1)`,
plus a `theme.stroke * 2 / 3` leading edge in `paperColor` at `x = plotW * p` (hidden at both ends). The edge is what makes it
read as a playhead rather than a wipe. Give the clip rect y=-40 and height+80 so the wiggling
baseline is never clipped horizontally.

**The scene**
- 1920×1080, 30fps, 180 frames. Background `theme.bg` under a scrim picked by `theme.scheme`: dark
  `rgba(255,255,255,0.055) -> rgba(0,0,0,0.42) at 74%`, light
  `rgba(255,255,255,0.5) -> rgba(0,0,0,0.06) at 74%`.
- Padding `{left: 92, right: 92, top: 214, bottom: 128}`.
- 7 series — shorts, tutorials, launches, demos, devlogs, talks, ads — 48 samples, colours
  `[theme.series[0], theme.series[1], theme.series[4], theme.series[3], theme.series[2],
  theme.accentOnPaper, theme.series[5]]` as the `colors` default,
  `fillOpacity: 0.88`.
- Left-aligned title (58px/800 in `displayFamily`) and monospace subtitle.
- A flex-wrap legend along the bottom, keyed off the same `keys`/`colors` arrays that drew the
  bands so it can never drift from the chart; each entry fades in staggered by 5 frames.

**Requirements**
- One self-contained `.tsx` file exporting `Streamgraph`.
- Props: `title`, `subtitle`, `keys`, `colors`, `samples` (48), `drawFrames` (96), `startAt` (16),
  `backgroundColor`, `paperColor`.
- Load Inter via `@remotion/google-fonts/Inter`.
