Build a Remotion composition called **ForceNetwork**: a graph settling out of its starting spiral
into a readable web.

**Setup**

```bash
npm i d3-force
npm i -D @types/d3-force
```

**The problem, and the general recipe**
`d3-force` is the one D3 layout that is **stateful** — it advances a physics integrator on its own
timer — so it cannot be called per frame. Remotion renders frames out of order and in parallel, so
a live simulation gives a different answer every time.

The fix generalises to *any* simulation: **run it once, record every tick, index the recording by
the frame.** You get the real settling motion rather than an approximation of it.

**The data.** Six hub nodes, each with 3–6 leaves, plus a ring of hub↔hub edges. Every link carries
a `value` that does double duty — it picks both the spring length and the stroke weight, via a single
`value > 2` test:

```ts
type Node = SimulationNodeDatum & {id: string; group: number; hub: boolean};
type Link = SimulationLinkDatum<Node> & {value: number};

// hub → leaf, and leaf → leaf ties: value 1.   hub → hub ring: value 3.
```

Invent plausible labels — the graph's subject is yours to pick, but every node is labelled on screen,
so choose something coherent (here: the parts of a video pipeline).

```tsx
const {snapshots, nodes, links} = useMemo(() => {
  // Build FRESH objects. d3-force mutates nodes in place, and forceLink
  // destructively rewrites ls[i].source/.target from ids to node references on
  // the first tick — so neither array may be hoisted to module scope or reused
  // across mounts.
  const ns: Node[] = […];
  const ls: Link[] = […];

  // .stop() immediately: forceSimulation() starts a timer the moment it is
  // constructed, and a running timer would tick differently on every render tab.
  const sim = forceSimulation<Node>(ns)
    .force('link', forceLink<Node, Link>(ls).id((d) => d.id)
      .distance((l) => (l.value > 2 ? 178 : 96)).strength(0.42))
    .force('charge', forceManyBody<Node>().strength((n) => (n.hub ? -900 : -190)))
    .force('center', forceCenter(0, 0))
    // Collision must reserve room for the LABEL, not just the circle (drawn at
    // r = 20 / 9), or the captions overlap even where the dots do not.
    .force('collide', forceCollide<Node>().radius((n) => (n.hub ? 46 : 34)).strength(0.9))
    .stop();

  const frames: {x: number; y: number}[][] = [];
  for (let i = 0; i < ticks; i++) {
    sim.tick();
    frames.push(ns.map((n) => ({x: n.x ?? 0, y: n.y ?? 0})));
  }
  return {snapshots: frames, nodes: ns, links: ls};
}, [ticks]);

const index = Math.min(ticks - 1, Math.max(0, Math.round((frame - startAt) * ticksPerFrame)));
const pos = snapshots[index];
```

**Check the arithmetic against the duration.** The last frame that changes anything is
`startAt + (ticks - 1) / ticksPerFrame`; everything after it is a frozen hold. At the defaults below
that is frame ~159 of 180, so the graph settles and holds for about 0.7s — a deliberate beat, not an
accident. Change `ticks` or `ticksPerFrame` and re-check, or you can silently freeze a quarter of the
video.

**Do not fade the graph up from zero.** Tick 0 is the opening image and must be on screen at frame 0
— if the graph, title and subtitle all start at opacity 0 you get a **pure black first frame**, which
renders without error and passes a careless check. Start the graph at `0.35` and bring it to `1`:

```tsx
const appear = interpolate(frame, [0, startAt + 20], [0.35, 1],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.22, 1, 0.32, 1)});
```
(The phyllotaxis start is a tight ~120px cluster and blows apart within a handful of ticks — it is a
good first frame, not a set piece to budget seconds for.)

**This is deterministic, and that is not an accident.** d3-force seeds its starting positions with a
phyllotaxis spiral and its jiggle with an internal LCG — it never calls `Math.random()`. So the same
input gives the same recording in every render tab. (That opening spiral is also a gift: tick 0 is a
tight, beautiful starting state to animate out of.)

**The gotcha that bites everyone**
`forceLink().id()` **replaces your string ids with node objects** on the first tick. After running,
`link.source` is a `Node`, not a `string`. Handle both:

```tsx
const s = typeof l.source === 'object' ? (l.source as Node).id : String(l.source);
```
Keep a `Map<id, index>` so you can look positions up out of the snapshot array.

**The scene**
- 1920×1080, 30fps, 180 frames. Background `theme.bg` under a scrim picked by `theme.scheme`: dark
  `rgba(255,255,255,0.055) -> rgba(0,0,0,0.42) at 72%`, light
  `rgba(255,255,255,0.5) -> rgba(0,0,0,0.06) at 72%`.
- Draw in centred coordinates: `<g transform={`translate(${width/2} ${height/2 + 62})`}>`, which
  matches `forceCenter(0, 0)`.
- Six hubs (r=20, solid, 26px/800 label above) each with 3–6 leaves (r=9, 20%-alpha fill +
  `theme.stroke * 2 / 3` stroke, 17px label below in `theme.muted`). Colours
  `[theme.series[0], theme.series[1], theme.series[4], theme.series[3], theme.series[2],
  theme.accentOnPaper]` by cluster, as the `colors` default.
- Link the hubs in a **ring** (`value: 3`), then add two or three extra ties between *leaves of
  different clusters* (`value: 1`) — without them you get six drifting islands instead of one
  graph. Hub-to-hub links are heavier (`theme.stroke * 2.4 / 3`, `${theme.muted}8c`); the rest
  `theme.stroke * 1.4 / 3`, `${theme.muted}47`.
- Title (54px/800 in `displayFamily`) and monospace subtitle centred at the top.
- Bottom-right, a monospace `tick 042 / 280` readout with `fontVariantNumeric: 'tabular-nums'` —
  it makes the technique legible: this is a recording being played back.

**Requirements**
- One self-contained `.tsx` file exporting `ForceNetwork`.
- Props, with defaults: `title` (`'One package, many neighbours'`), `subtitle`
  (`'force-directed graph · d3-force, pre-ticked'`), `colors` (the six above), `ticks` (280),
  `ticksPerFrame` (1.9), `startAt` (12), `backgroundColor` (`theme.bg`), and `paperColor`
  (`theme.body`) — the **ink** colour, used for the title and the hub labels. `backgroundColor` is the
  surface; `paperColor` is what is written on it.
- Load Inter via `@remotion/google-fonts/Inter`.
