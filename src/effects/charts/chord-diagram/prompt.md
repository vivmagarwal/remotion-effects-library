Build a Remotion composition called **ChordDiagram**: a ring of arcs joined by ribbons, each chord
reaching across the ring as it arrives.

**Setup**

```bash
npm i d3-chord d3-shape d3-array
npm i -D @types/d3-chord @types/d3-shape @types/d3-array
```

**The layout is pure — this is why it works in video**
`d3-chord` takes a square matrix and returns angles. No simulation, no internal state, no RNG. Call
it in a `useMemo` and every frame agrees; only the reveal needs animating.

```tsx
const chords = useMemo(
  () => d3chord().padAngle(0.045).sortSubgroups(descending)(matrix),
  [matrix],
);
```
`matrix[i][j]` is the flow **from i to j**. A 6×6 with a zero diagonal is the usual shape.

**Type the arc generator, don't cast it**

```tsx
// The untyped arc() demands innerRadius/outerRadius on every DATUM, even when
// they are fixed on the generator. Typing it with the datum you will actually
// pass keeps these calls cast-free.
const groupArc = useMemo(
  () => d3arc<{startAngle: number; endAngle: number}>().innerRadius(inner).outerRadius(outer),
  [inner, outer],
);
```

**The reveal — the part worth stealing**
Don't fade a finished ribbon in. Rebuild the ribbon generator each frame with a **shrunken radius**,
so the chord grows out of the centre and reaches across:

```tsx
const grown = d3ribbon<Chord, ChordSubgroup>().radius(inner * p);
const d = grown(c) ?? undefined;
```
`p` interpolates `0 → 1` over 26 frames starting at `startAt + i * 1.6`, on
`Easing.bezier(0.22, 1, 0.32, 1)`. Ribbons render **before** the group arcs so the arcs sit on top
of their ends.

Group arcs sweep open from their own start angle over frames `startAt - 12 → startAt + 18`:

```tsx
const end = g.startAngle + (g.endAngle - g.startAngle) * p;
const d = groupArc({startAngle: g.startAngle, endAngle: end}) ?? undefined;
```

**Labels that never read upside down**

```tsx
const mid  = (g.startAngle + end) / 2 - Math.PI / 2;   // −π/2: SVG 0° is East, arcs start North
const flip = mid > Math.PI / 2 || mid < -Math.PI / 2;

<g transform={`rotate(${mid * 180 / Math.PI}) translate(${outer + 20} 0)${flip ? ' rotate(180)' : ''}`}>
  <text textAnchor={flip ? 'end' : 'start'} dominantBaseline="middle" …>{name}</text>
</g>
```

**The scene**
- 1920×1080, 30fps, 180 frames. Background `#0a0c14` with
  `radial-gradient(ellipse at 50% 52%, #161a28 0%, #070810 70%)`.
- `SIZE = Math.min(width - 760, height - 500)`, `outer = SIZE / 2`, `inner = outer - 24`. Labels run
  RADIALLY outward, so the frame must hold the ring PLUS the longest label at top and bottom.
- Draw everything in **centred coordinates** inside
  `<g transform={`translate(${width/2} ${height/2 + 52}) rotate(…) scale(…)`}>` — then a scale about
  the origin is a scale about the middle of the ring, and the whole assembly can be spun as a unit.
- The ring turns in from `-0.42 rad` over 46 frames and then creeps at `frame * 0.0012`; it blooms
  `0.82 → 1` over the same window.
- Title (Inter 56px/800) and monospace subtitle centred at the top.

**Data**
Six platforms — YouTube, TikTok, Instagram, X, LinkedIn, Reddit — and a matrix of audience overlap.
Colours `['#ff5c39', '#20e3b2', '#c77dff', '#4cc9f0', '#ffd166', '#ff7bd5']`; ribbons take their
source group's colour at `fillOpacity: 0.42 * p`.

**Requirements**
- One self-contained `.tsx` file exporting `ChordDiagram`.
- Props: `title`, `subtitle`, `names`, `matrix`, `colors`, `stagger` (1.6), `startAt` (20),
  `backgroundColor`, `paperColor`.
- Load Inter via `@remotion/google-fonts/Inter`.
