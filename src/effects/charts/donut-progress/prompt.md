Build a Remotion composition called **DonutProgress**: three concentric rings sweeping to their
values, with a legend beside them.

**The look**
- 1920×1080, 30fps, 120 frames. Background `theme.bg`. A row: the 620px chart on the left, a legend on
  the right, 110px apart, both vertically centred. Inter throughout.
- Three rings — Render `theme.series[1]` at 92%, Encode `theme.series[2]` at 74%, Upload
  `theme.series[0]` at 48% — as the `rings` default. Stroke width
  46, 18px gap between rings, so radius `i` is `CENTER - STROKE/2 - i * (STROKE + GAP)`.
- A big label in the middle of the donut at 96px weight 800 in `displayFamily` (default
  `theme.display`), scaling 0.7→1 as it fades in.
- Legend rows: a 22px colour chip with radius `theme.radius / 3`, the label at 38px weight 600 in a fixed 220px column, and the
  percentage at 44px weight 800 in the ring's colour with `fontVariantNumeric: 'tabular-nums'`.

**Drawing the arcs**
Use SVG circles with `strokeDasharray`, not a `conic-gradient`:

```tsx
const circumference = 2 * Math.PI * r;
<circle cx={CENTER} cy={CENTER} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={STROKE} />
<circle cx={CENTER} cy={CENTER} r={r} fill="none" stroke={color} strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={`${circumference * p} ${circumference}`} />
```

One dash exactly as long as the swept arc, then a gap long enough to cover the rest. A conic-gradient
cannot give you round caps or a dim track behind the arc, and both of those are what make this read
as a designed gauge rather than a pie chart.

**Rotate the svg, not the circles**
`style={{rotate: '-90deg'}}` on the `<svg>` itself. SVG arcs start at three o'clock; a progress ring
has to start at twelve. Rotating the container moves every ring and its track together — rotating each
circle individually is more code and drifts out of alignment.

**Timing**
- Ring `i` sweeps over `[i * 6, i * 6 + sweepSeconds * fps]` with `Easing.bezier(0.16, 1, 0.3, 1)`,
  `sweepSeconds ≈ 1.6`.
- **Drive the legend percentage from the same `interpolate` call as the arc.** If you animate the
  number separately the two drift apart and the chart contradicts its own label — a small bug that is
  very obvious on screen.
- Legend rows slide in from `'-28px 0px'` on the same stagger.
- Add `filter: drop-shadow(0 0 16px COLOR55)` to each arc for a subtle glow.

**Requirements**
- One self-contained `.tsx` file exporting `DonutProgress`.
- Props: `rings` (array of `{label, value, color}` with values 0–1), `title`, `centerLabel`,
  `backgroundColor`, `sweepSeconds`.
- Load Inter via `@remotion/google-fonts/Inter`.
