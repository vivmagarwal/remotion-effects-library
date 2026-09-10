import {useMemo} from 'react';
import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {sankey as d3sankey, sankeyJustify, sankeyLinkHorizontal} from 'd3-sankey';
import type {SankeyGraph, SankeyLink, SankeyNode} from 'd3-sankey';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['700', '800'], subsets: ['latin']});

/**
 * Sankey Flow
 * Value moving left to right, splitting and recombining, with every band's
 * thickness proportional to what it carries. d3-sankey computes the whole
 * layout — but it MUTATES the arrays you hand it, writing x0/y0/x1/y1 onto your
 * nodes and replacing link source/target ids with node objects. So it runs once
 * inside a useMemo, on clones.
 */

type NodeExtra = {readonly name: string; readonly column?: number; readonly color?: string};
type LinkExtra = Record<string, never>;
type LaidOutNode = SankeyNode<NodeExtra, LinkExtra>;
type LaidOutLink = SankeyLink<NodeExtra, LinkExtra>;

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly muted: string;
  readonly text: string;
  readonly bg: string;
  readonly body: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  muted: '#8d93a5',
  text: fontFamily,
  bg: '#0a0b10',
  body: '#eef1f7',
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly title?: string;
  readonly subtitle?: string;
  readonly nodes?: readonly NodeExtra[];
  readonly links?: readonly {readonly source: string; readonly target: string; readonly value: number}[];
  /** Frames the flow takes to travel across. */
  readonly drawFrames?: number;
  readonly startAt?: number;
  readonly backgroundColor?: string;
  readonly paperColor?: string;
};

const DEFAULT_NODES: NodeExtra[] = [
  {name: 'Script', color: '#ff5c39'},
  {name: 'Stock footage', color: '#c2410c'},
  {name: 'Screen capture', color: '#ffd166'},
  {name: 'Edit', color: '#4cc9f0'},
  {name: 'Motion graphics', color: '#c77dff'},
  {name: 'Colour', color: '#c6ff3d'},
  {name: 'YouTube', color: '#ff5c39'},
  {name: 'Shorts', color: '#4cc9f0'},
  {name: 'Archive', color: '#8d93a5'},
];

const DEFAULT_LINKS = [
  {source: 'Script', target: 'Edit', value: 42},
  {source: 'Script', target: 'Motion graphics', value: 26},
  {source: 'Stock footage', target: 'Edit', value: 30},
  {source: 'Screen capture', target: 'Edit', value: 22},
  {source: 'Screen capture', target: 'Motion graphics', value: 14},
  // Interior nodes must CONSERVE: Edit takes 42+30+22 = 94 and must pass 94 on,
  // Colour takes 94+40 = 134 and must pass 134 on. d3-sankey does not check
  // this — it silently sizes the node to the larger side and the chart lies.
  {source: 'Edit', target: 'Colour', value: 94},
  {source: 'Motion graphics', target: 'Colour', value: 40},
  {source: 'Colour', target: 'YouTube', value: 72},
  {source: 'Colour', target: 'Shorts', value: 42},
  {source: 'Colour', target: 'Archive', value: 20},
];

export const SankeyFlow: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  title = 'Where the footage ends up',
  subtitle = 'sankey · d3-sankey, laid out once',
  nodes = DEFAULT_NODES,
  links = DEFAULT_LINKS,
  drawFrames = 104,
  startAt = 18,
  backgroundColor = theme.bg,
  paperColor = theme.body,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const PAD = {left: 150, right: 150, top: 232, bottom: 118};
  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;

  const graph = useMemo(() => {
    // Clone. d3-sankey writes layout fields onto these objects and swaps the
    // link ids for node references, so passing the props straight in would
    // corrupt them for every later render.
    const input: SankeyGraph<NodeExtra, LinkExtra> = {
      nodes: nodes.map((n) => ({...n})) as LaidOutNode[],
      links: links.map((l) => ({...l})) as unknown as LaidOutLink[],
    };

    return d3sankey<NodeExtra, LinkExtra>()
      .nodeId((d) => d.name)
      .nodeAlign(sankeyJustify)
      .nodeWidth(22)
      .nodePadding(22)
      .extent([
        [0, 0],
        [plotW, plotH],
      ])(input);
  }, [nodes, links, plotW, plotH]);

  const linkPath = useMemo(() => sankeyLinkHorizontal<NodeExtra, LinkExtra>(), []);

  // The flow travels left to right behind a clip. A sankey reads as a journey,
  // so wiping along the direction of travel is the only reveal that fits.
  const p = interpolate(frame, [startAt, startAt + drawFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  const colorOf = (n: LaidOutNode) => n.color ?? '#8d93a5';

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        backgroundImage: 'radial-gradient(ellipse at 50% 56%, rgba(255,255,255,0.055) 0%, rgba(0,0,0,0.42) 74%)',
        fontFamily,
        overflow: 'hidden',
      }}
    >
      <Interactive.Div
        name="Title"
        style={{
          position: 'absolute',
          left: PAD.left,
          top: 96,
          fontSize: 58,
          fontWeight: 800,
          letterSpacing: '-0.025em',
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
          left: PAD.left,
          top: 168,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
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
        <defs>
          <clipPath id="sankey-wipe">
            <rect x={0} y={-40} width={plotW * p} height={plotH + 80} />
          </clipPath>
          {/* One gradient per link, source colour to target colour. Without it a
              node that feeds several terminals paints that whole side of the
              chart in a single flat colour. userSpaceOnUse + explicit x1/x2 is
              required — the default objectBoundingBox maps to the path's box,
              which for a curved link is not the flow direction. */}
          {graph.links.map((l, i) => {
            const src = l.source as LaidOutNode;
            const dst = l.target as LaidOutNode;
            return (
              <linearGradient
                key={i}
                id={`sankey-link-${i}`}
                gradientUnits="userSpaceOnUse"
                x1={src.x1 ?? 0}
                x2={dst.x0 ?? 0}
              >
                <stop offset="0%" stopColor={colorOf(src)} />
                <stop offset="100%" stopColor={colorOf(dst)} />
              </linearGradient>
            );
          })}
        </defs>

        <g transform={`translate(${PAD.left} ${PAD.top})`}>
          <g clipPath="url(#sankey-wipe)">
            {graph.links.map((l, i) => (
                <path
                  key={i}
                  d={linkPath(l) ?? undefined}
                  fill="none"
                  stroke={`url(#sankey-link-${i})`}
                  // The band's thickness IS the value — that is the whole chart.
                  strokeWidth={Math.max(1, l.width ?? 1)}
                  strokeOpacity={0.46}
                />
            ))}
          </g>

          {graph.nodes.map((n) => {
            // A node appears as the wipe reaches its column, so labels never
            // arrive before the flow that feeds them.
            // The leading edge has to start OFF the plot. Driving it from
            // `p * plotW` puts the edge at 0 when p is 0, which lands inside
            // column 0's own [-30, +10] window and paints the first column at
            // 75% opacity from frame 0 — before the wipe has started at all.
            const edge = interpolate(p, [0, 1], [-40, plotW]);
            const reached = interpolate(edge, [(n.x0 ?? 0) - 30, (n.x0 ?? 0) + 10], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            if (reached <= 0) return null;

            const h = (n.y1 ?? 0) - (n.y0 ?? 0);
            const isLast = (n.x1 ?? 0) > plotW - 40;

            return (
              <g key={n.name} opacity={reached}>
                <rect
                  x={n.x0}
                  y={n.y0}
                  width={(n.x1 ?? 0) - (n.x0 ?? 0)}
                  height={h}
                  rx={4}
                  fill={colorOf(n)}
                />
                <text
                  // Labels flip to the inside at the right-hand edge, or they
                  // run off the frame.
                  x={isLast ? (n.x0 ?? 0) - 14 : (n.x1 ?? 0) + 14}
                  y={(n.y0 ?? 0) + h / 2}
                  textAnchor={isLast ? 'end' : 'start'}
                  dominantBaseline="middle"
                  fill={paperColor}
                  fontFamily={fontFamily}
                  fontSize={26}
                  fontWeight={700}
                  style={{paintOrder: 'stroke', stroke: backgroundColor, strokeWidth: 5}}
                >
                  {n.name}
                </text>
                <text
                  x={isLast ? (n.x0 ?? 0) - 14 : (n.x1 ?? 0) + 14}
                  y={(n.y0 ?? 0) + h / 2 + 28}
                  textAnchor={isLast ? 'end' : 'start'}
                  dominantBaseline="middle"
                  fill={colorOf(n)}
                  fontFamily={fontFamily}
                  fontSize={22}
                  fontWeight={800}
                  style={{paintOrder: 'stroke', stroke: backgroundColor, strokeWidth: 5}}
                >
                  {Math.round(n.value ?? 0)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
