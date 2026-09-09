Build a Remotion composition called **SankeyFlow**: value moving left to right, splitting and
recombining, with every band's thickness proportional to what it carries.

**Setup**

```bash
npm i d3-sankey
npm i -D @types/d3-sankey
```

**d3-sankey MUTATES what you give it**
This is the thing to know before anything else. `sankey()` stamps `index`, `sourceLinks`,
`targetLinks`, `value`, `depth`, `height`, `layer` and `x0/y0/x1/y1` onto your node objects, **and
replaces each link's `source`/`target` string ids with references to the node objects themselves**.

Re-running it on already-mutated objects is *not* destructive — `computeNodeLinks` guards with
`if (typeof source !== "object")`, so the geometry comes out identical. The damage is different and
worse: your props become **circularly referential** (`node.sourceLinks[0].source === node`), so
`JSON.stringify(props)` throws `Converting circular structure to JSON` — which breaks Studio's props
panel and `--props` round-tripping — and `links[i].source` silently changes type from `string` to an
object for anything else reading those same props. Run it once, in a `useMemo`, on clones:

```tsx
type NodeExtra = {name: string; color?: string};
type LinkExtra = Record<string, never>;
type LaidOutNode = SankeyNode<NodeExtra, LinkExtra>;
type LaidOutLink = SankeyLink<NodeExtra, LinkExtra>;

const graph = useMemo(() => {
  const input: SankeyGraph<NodeExtra, LinkExtra> = {
    nodes: nodes.map((n) => ({...n})) as LaidOutNode[],
    links: links.map((l) => ({...l})) as unknown as LaidOutLink[],
  };

  return d3sankey<NodeExtra, LinkExtra>()
    .nodeId((d) => d.name)
    .nodeAlign(sankeyJustify)     // pushes terminal nodes to the right edge
    .nodeWidth(22)
    .nodePadding(22)
    .extent([[0, 0], [plotW, plotH]])(input);
}, [nodes, links, plotW, plotH]);
```
After it runs, `link.source` is a **node object**, not a string — read its colour with
`(l.source as LaidOutNode)`.

**Drawing it**

```tsx
const linkPath = useMemo(() => sankeyLinkHorizontal<NodeExtra, LinkExtra>(), []);

<path
  d={linkPath(l) ?? undefined}
  fill="none"
  stroke={colorOf(l.source as LaidOutNode)}
  strokeWidth={Math.max(1, l.width ?? 1)}   // the WIDTH is the value — that is the chart
  strokeOpacity={0.42}
/>
```
A sankey link is a **stroked path**, not a filled shape. `l.width` comes from the layout; guard it
with `Math.max(1, …)` so a tiny flow never disappears entirely.

**Colour each link with a gradient, not its source colour.** A node that feeds several terminals
paints that entire side of the chart one flat colour otherwise — here `Colour` feeds all three
outputs, so the right half would be a single green. One `<linearGradient>` per link, in `<defs>`:

```tsx
<linearGradient
  id={`sankey-link-${i}`}
  gradientUnits="userSpaceOnUse"     // required: the default objectBoundingBox
  x1={(l.source as LaidOutNode).x1}  // maps to the PATH's box, which for a
  x2={(l.target as LaidOutNode).x0}  // curved link is not the flow direction
>
  <stop offset="0%"   stopColor={colorOf(l.source as LaidOutNode)} />
  <stop offset="100%" stopColor={colorOf(l.target as LaidOutNode)} />
</linearGradient>
```
then `stroke={`url(#sankey-link-${i})`}` with `strokeOpacity={0.46}`.

**The reveal**
A sankey reads as a journey, so wipe along the direction of flow — an SVG `clipPath` whose rect
grows to `plotW * p` with `y={-40}` and `height={plotH + 80}` so nothing is clipped vertically. Put
**only the links** inside the clip.

```tsx
const p = interpolate(frame, [startAt, startAt + drawFrames], [0, 1],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.4, 0, 0.2, 1)});
``` Nodes fade in individually as the wipe
reaches their own column, so a label never arrives before the flow that feeds it:

```tsx
// The leading edge must start OFF the plot. `p * plotW` puts it at 0 when p is
// 0 — which is already inside column 0's own [-30, +10] window, so the first
// column paints at 75% opacity from FRAME 0, before the wipe has begun.
const edge = interpolate(p, [0, 1], [-40, plotW]);
const reached = interpolate(edge, [(n.x0 ?? 0) - 30, (n.x0 ?? 0) + 10], [0, 1],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
if (reached <= 0) return null;
```
`reached` is then the node group's `opacity` — that is what makes "fade in" true.

**Node labels flip at the right edge**
Terminal nodes sit at `x1 === plotW`, so a right-hand label runs off frame:

```tsx
const isLast = (n.x1 ?? 0) > plotW - 40;
x={isLast ? (n.x0 ?? 0) - 14 : (n.x1 ?? 0) + 14}
textAnchor={isLast ? 'end' : 'start'}
```
Name at `y0 + h/2` with `dominantBaseline="middle"` (Inter 26px weight 700, `paperColor`); value
`Math.round(n.value ?? 0)` 28px below it (Inter 22px weight 800, in the node's colour).

The flip puts terminal labels **on top of** their flow bands, so give both a knockout:
`style={{paintOrder: 'stroke', stroke: backgroundColor, strokeWidth: 5}}`.

**The scene**
- 1920×1080, 30fps, **180 frames**. Background `#0a0c14` plus
  `radial-gradient(ellipse at 50% 56%, #161a28 0%, #070810 74%)`.
- Padding `{left: 150, right: 150, top: 232, bottom: 118}`, so
  `plotW = width - left - right` (1620) and `plotH = height - top - bottom` (730). Nodes are
  `rx={4}` rects. The plot group is `translate(150, 232)`.
- Title and subtitle both at `left: 150` — flush with the plot's left edge. Title `top: 96`
  (Inter 58px/800, `letter-spacing: -0.025em`); monospace subtitle `top: 168` (24px, `#7b849b`).
  Fading in over frames 0–20 and 8–28.

**Data — use these exact values**
Invented numbers give a visibly different chart, so they are pinned here. Note the columns are
*implied by the links*, not declared: sankey works out that `Script` is a source and `Archive` is a
sink from the graph alone.

```tsx
const DEFAULT_NODES: NodeExtra[] = [
  {name: 'Script',          color: '#ff5c39'},
  {name: 'Stock footage',   color: '#ff9f1c'},
  {name: 'Screen capture',  color: '#ffd166'},
  {name: 'Edit',            color: '#4cc9f0'},
  {name: 'Motion graphics', color: '#c77dff'},
  {name: 'Colour',          color: '#20e3b2'},
  {name: 'YouTube',         color: '#ff5c7a'},
  {name: 'Shorts',          color: '#8affc1'},
  {name: 'Archive',         color: '#7f88a0'},
];

const DEFAULT_LINKS = [
  {source: 'Script',          target: 'Edit',            value: 42},
  {source: 'Script',          target: 'Motion graphics', value: 26},
  {source: 'Stock footage',   target: 'Edit',            value: 30},
  {source: 'Screen capture',  target: 'Edit',            value: 22},
  {source: 'Screen capture',  target: 'Motion graphics', value: 14},
  {source: 'Edit',            target: 'Colour',          value: 74},
  {source: 'Motion graphics', target: 'Colour',          value: 40},
  {source: 'Colour',          target: 'YouTube',         value: 62},
  {source: 'Colour',          target: 'Shorts',          value: 34},
  {source: 'Colour',          target: 'Archive',         value: 18},
];
```

**Requirements**
- One self-contained `.tsx` file exporting `SankeyFlow`.
- Props, with defaults: `title` (`'Where the footage ends up'`), `subtitle`
  (`'sankey · d3-sankey, laid out once'`), `nodes`, `links`, `drawFrames` (104), `startAt` (18),
  `backgroundColor` (`#0a0c14`), `paperColor` (`#eef1f7`).
- Load Inter via `@remotion/google-fonts/Inter`, weights `['700', '800']` — the only two the design uses.
