Build a Remotion composition called **LineChartDraw**: an SVG line chart that draws itself, with a
value read-out riding the leading edge.

**The look**
- 1920×1080, 30fps, 120 frames. Background `theme.bg`, padding `78px 96px`, Inter.
- A title at 50px weight 800 in `displayFamily`, and under it the **current** value at 92px weight 800
  in the line colour (`lineColor`, default `theme.pair`), with `fontVariantNumeric: 'tabular-nums'`.
- A 1560×620 `<svg>` with five horizontal gridlines at `#ffffff10`, a gradient area fill under the
  line (`stopOpacity` 0.42 → 0), the line itself at `strokeWidth: theme.stroke * 2`, round caps and
  joins, with `filter: drop-shadow(0 0 18px ${lineColor}66)`.
- Month labels below, each `flex: 1` and centred — bright `theme.muted` once the line has passed them,
  dim `theme.paperMuted` before.

**The self-drawing line**
Build the path from the data (`M x y L x y …`), then measure it by summing the segment lengths:

```tsx
const pathLength = points.reduce(
  (sum, p, i) => (i === 0 ? 0 : sum + Math.hypot(p.x - points[i-1].x, p.y - points[i-1].y)), 0);
```

Then:

```tsx
strokeDasharray={pathLength}
strokeDashoffset={pathLength * (1 - progress)}
```

A single dash exactly as long as the path, pushed fully out of view and slid back in. This is the
canonical SVG draw-on and it needs no measurement API and no `useEffect` — the summed polyline length
is exact for straight segments.

**Everything arrives together**
- Drive one `progress` from `interpolate(frame, [10, 10 + drawSeconds * fps], [0, 1], {easing:
  Easing.bezier(0.35, 0, 0.15, 1)})` and derive all four cues from it.
- The area fill is revealed by a `<clipPath>` containing `<rect width={progress * W} height={H} />`.
  Do **not** animate the area's own path or opacity — a clip wipe tracks the line's leading edge
  exactly, and anything else drifts out of sync with it.
- The leading dot: convert progress to a position along the polyline —
  `cursor = progress * (points.length - 1)`, `seg = Math.floor(cursor)`, `within = cursor - seg`, then
  lerp between `points[seg]` and `points[seg+1]`. Draw it as three stacked circles: r=16 at
  `opacity: 0.22`, r=9 filled, and r=9 stroked in the background colour to punch it out of the line.
- The headline number uses the same lerp on the raw values, so it reads out what the dot is pointing at.

**Requirements**
- One self-contained `.tsx` file exporting `LineChartDraw`.
- Props: `title`, `values`, `labels`, `lineColor`, `fillColor`, `backgroundColor`, `drawSeconds`,
  `unit` — optional, with sensible defaults.
- Scale the y axis against `Math.max(...values) * 1.12` so the peak never touches the top.
- Set `overflow: 'visible'` on the `<svg>` so the dot's glow is not clipped at the edges.
- Load Inter via `@remotion/google-fonts/Inter`.
