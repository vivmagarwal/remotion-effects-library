import {useMemo} from 'react';
import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation} from 'd3-force';
import type {SimulationLinkDatum, SimulationNodeDatum} from 'd3-force';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Force Network
 * A graph settling out of d3-force's phyllotaxis starting spiral into a
 * readable web. d3-force is the one D3 layout that is stateful — it advances a
 * physics integrator on a timer — so it cannot be called per frame. The fix is
 * to run the whole simulation ONCE and record a snapshot of every tick, then
 * index that array by the frame. It is deterministic all the way down:
 * d3-force seeds its starting positions with a phyllotaxis spiral and its
 * jiggle with an internal LCG, never Math.random().
 */

type Node = SimulationNodeDatum & {
  readonly id: string;
  readonly group: number;
  readonly hub: boolean;
};
type Link = SimulationLinkDatum<Node> & {readonly value: number};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
/**
 * A system monospace stack. It is the inline default for the theme's `mono`
 * token, so a pasted file needs no extra font download, and a theme that names
 * a loaded monospace family replaces it.
 */
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

type Theme = {
  readonly scheme: 'dark' | 'light';
  readonly mono: string;
  readonly paperMuted: string;
  readonly muted: string;
  readonly text: string;
  readonly display: string;
  readonly bg: string;
  readonly body: string;
  readonly series: readonly string[];
  readonly accentOnPaper: string;
  readonly stroke: number;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  scheme: 'dark',
  mono: MONO,
  paperMuted: '#4a4e5a',
  muted: '#8d93a5',
  text: fontFamily,
  display: fontFamily,
  bg: '#0a0b10',
  body: '#eef1f7',
  series: ['#ff5c39', '#4cc9f0', '#c6ff3d', '#ffd166', '#c77dff', '#8d93a5'],
  accentOnPaper: '#c2410c',
  stroke: 3,
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** CSS family for the title. Defaults to the theme's display face. */
  readonly displayFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly title?: string;
  readonly subtitle?: string;
  readonly colors?: readonly string[];
  /** Simulation ticks recorded. More = a more settled final layout. */
  readonly ticks?: number;
  /**
   * Ticks advanced per rendered frame. Check this against the duration:
   * `startAt + (ticks - 1) / ticksPerFrame` is the last frame that changes, and
   * everything after it is a frozen hold.
   */
  readonly ticksPerFrame?: number;
  readonly startAt?: number;
  readonly backgroundColor?: string;
  readonly paperColor?: string;
};

const CLUSTERS = [
  {name: 'render', leaves: ['bundler', 'renderer', 'cli', 'lambda', 'cloudrun', 'compositor']},
  {name: 'react', leaves: ['player', 'studio', 'preload', 'media-utils']},
  {name: 'draw', leaves: ['three', 'skia', 'shapes', 'paths', 'svg']},
  {name: 'sound', leaves: ['audio', 'waveform', 'whisper']},
  {name: 'text', leaves: ['fonts', 'captions', 'animated-emoji']},
  {name: 'motion', leaves: ['transitions', 'effects', 'motion-blur', 'noise']},
];

export const ForceNetwork: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  displayFamily = theme.display,
  title = 'One package, many neighbours',
  subtitle = 'force-directed graph · d3-force, pre-ticked',
  colors = [
    theme.series[0],
    theme.series[1],
    theme.series[4],
    theme.series[3],
    theme.series[2],
    theme.accentOnPaper,
  ],
  ticks = 280,
  ticksPerFrame = 1.9,
  startAt = 12,
  backgroundColor = theme.bg,
  paperColor = theme.body,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  // Run the physics once, record every tick. This is the whole technique.
  const {snapshots, nodes, links} = useMemo(() => {
    const ns: Node[] = [];
    const ls: Link[] = [];

    CLUSTERS.forEach((c, gi) => {
      ns.push({id: c.name, group: gi, hub: true});
      c.leaves.forEach((leaf) => {
        ns.push({id: leaf, group: gi, hub: false});
        ls.push({source: c.name, target: leaf, value: 1});
      });
    });
    // A ring through the hubs, plus a couple of cross-cluster edges so the
    // graph is one connected component instead of six drifting islands.
    CLUSTERS.forEach((c, gi) => {
      ls.push({source: c.name, target: CLUSTERS[(gi + 1) % CLUSTERS.length].name, value: 3});
    });
    ls.push({source: 'three', target: 'motion', value: 2});
    ls.push({source: 'player', target: 'renderer', value: 2});
    ls.push({source: 'captions', target: 'whisper', value: 2});

    // Collision has to reserve room for the LABEL, not just the circle, or the
    // leaf captions overlap even though the dots do not.
    const keepClear = (n: Node) => (n.hub ? 46 : 34);

    // .stop() immediately: forceSimulation() starts a timer on construction,
    // and a running timer would tick differently on every render tab.
    const sim = forceSimulation<Node>(ns)
      .force(
        'link',
        forceLink<Node, Link>(ls)
          .id((d) => d.id)
          .distance((l) => (l.value > 2 ? 178 : 96))
          .strength(0.42),
      )
      .force('charge', forceManyBody<Node>().strength((n) => (n.hub ? -900 : -190)))
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide<Node>().radius(keepClear).strength(0.9))
      .stop();

    const frames: {x: number; y: number}[][] = [];
    for (let i = 0; i < ticks; i++) {
      sim.tick();
      frames.push(ns.map((n) => ({x: n.x ?? 0, y: n.y ?? 0})));
    }
    return {snapshots: frames, nodes: ns, links: ls};
  }, [ticks]);

  const index = Math.min(
    ticks - 1,
    Math.max(0, Math.round((frame - startAt) * ticksPerFrame)),
  );
  const pos = snapshots[index];

  // d3-force's link force replaces the string ids with node objects on first
  // tick, so after running, source/target ARE the nodes.
  const indexOf = useMemo(() => new Map(nodes.map((n, i) => [n.id, i])), [nodes]);

  // Starts at 0.35, not 0. The phyllotaxis spiral at tick 0 is the opening
  // image; fading it up from nothing makes frame 0 a black frame, which renders
  // without error and passes a careless check.
  const appear = interpolate(frame, [0, startAt + 20], [0.35, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.32, 1),
  });

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        // A dark scrim reads as depth on a dark ground and as dirt on a light
        // one, so the scheme picks which way the vignette runs.
        backgroundImage:
          theme.scheme === 'light'
            ? 'radial-gradient(ellipse at 50% 54%, rgba(255,255,255,0.5) 0%, rgba(0,0,0,0.06) 72%)'
            : 'radial-gradient(ellipse at 50% 54%, rgba(255,255,255,0.055) 0%, rgba(0,0,0,0.42) 72%)',
        fontFamily,
        overflow: 'hidden',
      }}
    >
      <Interactive.Div
        name="Title"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 72,
          textAlign: 'center',
          fontSize: 54,
          fontWeight: 800,
          letterSpacing: '-0.025em',
          fontFamily: displayFamily,
          color: paperColor,
          opacity: interpolate(frame, [0, 20], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {title}
      </Interactive.Div>
      <Interactive.Div
        name="Subtitle"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 140,
          textAlign: 'center',
          fontFamily: theme.mono,
          fontSize: 24,
          color: theme.muted,
          opacity: interpolate(frame, [8, 28], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {subtitle}
      </Interactive.Div>

      <svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(${width / 2} ${height / 2 + 62})`} opacity={appear}>
          {links.map((l, i) => {
            const s = typeof l.source === 'object' ? (l.source as Node).id : String(l.source);
            const t = typeof l.target === 'object' ? (l.target as Node).id : String(l.target);
            const a = pos[indexOf.get(s) ?? 0];
            const b = pos[indexOf.get(t) ?? 0];
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={l.value > 2 ? `${theme.muted}8c` : `${theme.muted}47`}
                strokeWidth={(theme.stroke * (l.value > 2 ? 2.4 : 1.4)) / 3}
              />
            );
          })}

          {nodes.map((n, i) => {
            const p = pos[i];
            const colour = colors[n.group % colors.length];
            const r = n.hub ? 20 : 9;
            return (
              <g key={n.id} transform={`translate(${p.x} ${p.y})`}>
                <circle
                  r={r}
                  fill={n.hub ? colour : `${colour}44`}
                  stroke={colour}
                  strokeWidth={n.hub ? 0 : (theme.stroke * 2) / 3}
                />
                {n.hub ? (
                  <text
                    y={-r - 14}
                    textAnchor="middle"
                    fill={paperColor}
                    fontFamily={fontFamily}
                    fontSize={26}
                    fontWeight={800}
                  >
                    {n.id}
                  </text>
                ) : (
                  <text
                    y={r + 20}
                    textAnchor="middle"
                    fill={theme.muted}
                    fontFamily={fontFamily}
                    fontSize={17}
                    fontWeight={500}
                  >
                    {n.id}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* The tick counter makes the technique legible: this is a recording. */}
      <Interactive.Div
        name="TickReadout"
        style={{
          position: 'absolute',
          right: 78,
          bottom: 62,
          fontFamily: theme.mono,
          fontSize: 24,
          color: theme.paperMuted,
          fontVariantNumeric: 'tabular-nums',
          opacity: appear,
        }}
      >
        tick {String(index).padStart(3, '0')} / {ticks}
      </Interactive.Div>
    </AbsoluteFill>
  );
};
