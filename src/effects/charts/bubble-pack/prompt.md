Build a Remotion composition called **BubblePack** (composition id `bubble-pack`): a circle-packing
chart laid out by D3, growing into place.

**Setup**

```bash
npm i d3-hierarchy
npm i -D @types/d3-hierarchy
```

**D3 lays out, React draws**
This is the pattern for all D3-in-video work. Never let D3 touch the DOM — no `d3.select`, no
`.append`, no `.transition()`. Use it purely as a geometry library and render its output as React
elements:

```tsx
const root = pack<{children: readonly Datum[]}>()
  .size([SIZE, SIZE])
  .padding(9)(
    hierarchy({children: data}, (d) => d.children).sum((d) => d.value ?? 0),
  );

const leaves = root.leaves();     // each has {x, y, r, data}
```

`pack()` is a **pure function of the data** — no simulation, no random seeding, no iteration count. It
returns the same packing every time, which is exactly what a frame-by-frame renderer needs. (Contrast
`d3-force`, which is a stateful simulation: to use that in video you must run it to completion up front
and animate the finished positions, never tick it per frame.)

Because the layout is deterministic you can recompute it on every render without caching.

**Animate the radius, not the position**

```tsx
const pop = spring({frame: frame - (startAt + i * stagger), fps,
                    config: {damping: 14, stiffness: 165, mass: 0.75}});
const r = leaf.r * (0.2 + pop * 0.8);       // ← animated
<circle cx={leaf.x} cy={leaf.y} r={r} />    // ← straight from D3, never moves
```

The bubbles grow into their final packing rather than sliding into it. Animating positions as well
means circles overlap while they travel, and a packing chart whose whole point is that nothing overlaps
looks broken for the entire entrance.

`root.leaves()` comes back **largest first**, so a simple index stagger builds the chart outward from
its centre of mass for free.

**Labels**
- Only label bubbles above a size threshold (`leaf.r > 44`); everything smaller gets a circle only. A
  chart that tries to label every bubble is unreadable at video distance.
- Scale the label with its bubble: `fontSize: Math.min(38, leaf.r * 0.42)`.
- Show the value as a second line only on the largest (`leaf.r > 70`).
- Fade labels in **late** (`interpolate(p, [0.6, 1], [0, 1])`) so text never appears on a circle that is
  still 20% of its final size.

**The look**
- 1920×1080, 30fps, 180 frames. Background `theme.bg` under a scrim picked by `theme.scheme`: dark
  `rgba(255,255,255,0.055) -> rgba(0,0,0,0.42) at 68%`, light
  `rgba(255,255,255,0.5) -> rgba(0,0,0,0.06) at 68%`.
- Bubbles: `fill: ${colour}26`, `stroke: colour`, `strokeWidth: theme.stroke * 5 / 6` (2.5 at the
  house stroke) — a tinted fill with a solid stroke reads far better against a dark ground than a
  solid fill.
- Four groups keyed by `theme.series[1]` (ui), `theme.series[0]` (video), `theme.series[4]` (gfx),
  `theme.series[2]` (data), as the `palette` default; unknown groups fall back to `theme.muted`.
- Title at 58px weight 800 in `displayFamily` (default `theme.display`), a monospace subtitle, and a
  legend built by iterating the **palette object itself** so it can never drift from the chart's
  colours.

**Requirements**
- One self-contained `.tsx` file exporting `BubblePack`.
- Props: `title`, `subtitle`, `data` (array of `{label, value, group}`), `palette`, `stagger`,
  `startAt`, `backgroundColor`, `paperColor` — the ink for the title and bubble labels:
  `theme.paper` on a dark scheme, `theme.body` on a light one; never the ground the effect is drawn on.
- Size the chart from `useVideoConfig()` — `Math.min(width - 260, height - 300)` — and centre it.
- Give the `<svg>` `overflow: 'visible'` so strokes on edge bubbles are not clipped.
- SVG `<text>` needs `fontFamily` set on the element; it does not inherit from an ancestor div.
- Load Inter via `@remotion/google-fonts/Inter`.
