Build a Remotion composition called **VoronoiShatter**: a solid plate fracturing into cells that
tumble away, revealing a word behind it.

**Setup**

```bash
npm i d3-delaunay d3-polygon
npm i -D @types/d3-delaunay @types/d3-polygon
```

**Why Voronoi and not a grid**
A Voronoi diagram assigns every point in the plane to its nearest seed. The cells tile the frame
*exactly* — no gaps, no overlaps, irregular edges — which is why it reads as breaking glass rather
than a grid of tiles coming apart.

**The footgun, up front**

```tsx
// Delaunay.from() COPIES. `new Delaunay(flatArray)` ALIASES the array you hand
// it and writes back into it — a real problem if you reuse the source anywhere.
const voronoi = Delaunay.from(points).voronoi([0, 0, width, height]);
const polygon = voronoi.cellPolygon(i) as [number, number][] | null;
```
`cellPolygon` can return `null` for a degenerate cell — filter those out.

**Building the shards** (all of this in a `useMemo`; none of it depends on time)

```tsx
const points: [number, number][] = new Array(count).fill(0).map((_, i) =>
  [random(`vx-${i}`) * width, random(`vy-${i}`) * height]);   // seeded, never Math.random()

const [cx, cy] = polygonCentroid(polygon);
const dx = cx - width / 2;
const dy = cy - height / 2;
const near = Math.hypot(dx, dy) / Math.hypot(width / 2, height / 2);   // 0 centre … 1 corner

return {
  d: `M${polygon.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('L')}Z`,
  cx, cy, dx, dy, near,
  spin: (random(`vr-${i}`) - 0.5) * 150,
  mix: (cx / width) * 0.6 + (cy / height) * 0.4,   // two-axis ramp → the intact plate is one gradient
};
```

**The tumble — rotate about the shard's own centroid**

```tsx
const begin = holdFrames + c.near * 26;        // centre shards go first; the crack races outward
const p = interpolate(frame, [begin, begin + shatterFrames], [0, 1],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.34, 0, 0.32, 1)});

const tx  = c.dx * push * p;
const ty  = c.dy * push * p + p * p * 220;     // a little gravity on the way out
const rot = c.spin * p;

// rotate(angle, cx, cy) turns the shard about its OWN centroid. Without the
// centre arguments it swings around the frame origin instead of tumbling.
transform={`translate(${tx} ${ty}) rotate(${rot} ${c.cx} ${c.cy})`}
```
Fade each shard out over `p` in `[0.55, 1]`.

**Colour without CSS `color-mix()`**
Blend in JS so the component does not depend on the renderer's CSS support:

```tsx
const mixHex = (a: string, b: string, t: number): string => {
  const parse = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const c = (x: number, y: number) =>
    Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${c(ar, br)}${c(ag, bg)}${c(ab, bb)}`;
};
```

**The scene**
- 1920×1080, 30fps, 180 frames. Background `theme.bgDeep` (`#04050a`).
- Behind the shards, the reveal word in Archivo 260px/900, `letter-spacing: -0.045em`, fading in
  over frames `holdFrames + 12 → holdFrames + 52`.
- 150 shards, `holdFrames: 34`, `shatterFrames: 92`, `push: 1.5`. Plate ramps `theme.accent` to
  `theme.series[4]` (`#ff5c39` to `#c77dff`); each shard is stroked in the background colour at
  `theme.stroke × 1.4/3` px (1.4 at the house 3, 0.93 under a 2-stroke theme) so the intact plate
  still reads as fractured.
- A monospace caption at the bottom.

**Requirements**
- One self-contained `.tsx` file exporting `VoronoiShatter`.
- Props: `word`, `caption`, `count`, `holdFrames`, `shatterFrames`, `push`, `plateColorA`,
  `plateColorB`, `backgroundColor`, `accentColor`.
- Load Archivo via `@remotion/google-fonts/Archivo`.
