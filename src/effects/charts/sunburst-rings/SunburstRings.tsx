import {useMemo} from 'react';
import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {hierarchy, partition} from 'd3-hierarchy';
import {arc as d3arc} from 'd3-shape';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Sunburst Rings
 * A hierarchy drawn as concentric arc rings, opening outward from the root.
 * `partition()` maps the tree onto a rectangle — x is the angular span, y is
 * the depth — so setting `.size([2π, radius])` turns those rectangles straight
 * into polar arcs. Nothing about the layout is stochastic, so every frame
 * agrees and only the sweep is animated.
 */

type Node = {
  readonly name: string;
  readonly value?: number;
  readonly color?: string;
  readonly children?: readonly Node[];
};

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
  readonly muted: string;
  readonly text: string;
  readonly display: string;
  readonly bg: string;
  readonly body: string;
  readonly series: readonly string[];
  readonly radius: number;
  readonly stroke: number;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  scheme: 'dark',
  mono: MONO,
  muted: '#8d93a5',
  text: fontFamily,
  display: fontFamily,
  bg: '#0a0b10',
  body: '#eef1f7',
  series: ['#ff5c39', '#4cc9f0', '#c6ff3d', '#ffd166', '#c77dff', '#8d93a5'],
  radius: 18,
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
  readonly data?: Node;
  /** Frames between one ring opening and the next. */
  readonly ringStagger?: number;
  readonly startAt?: number;
  readonly backgroundColor?: string;
  readonly paperColor?: string;
};

/** Only the depth-1 branches carry a colour; everything under them inherits. */
const defaultData = (s: readonly string[]): Node => ({
  name: 'render',
  children: [
    {
      name: 'compose',
      color: s[1],
      children: [
        {name: 'layout', value: 34},
        {name: 'fonts', value: 20},
        {name: 'assets', value: 26},
        {name: 'props', value: 14},
      ],
    },
    {
      name: 'animate',
      color: s[0],
      children: [
        {name: 'spring', value: 40},
        {name: 'interpolate', value: 36},
        {name: 'easing', value: 18},
        {name: 'noise', value: 12},
      ],
    },
    {
      name: 'draw',
      color: s[4],
      children: [
        {name: 'canvas', value: 28},
        {name: 'svg', value: 24},
        {name: 'webgl', value: 22},
        {name: 'css', value: 16},
      ],
    },
    {
      name: 'encode',
      color: s[2],
      children: [
        {name: 'h264', value: 30},
        {name: 'audio', value: 16},
        {name: 'stitch', value: 12},
      ],
    },
  ],
});

export const SunburstRings: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  displayFamily = theme.display,
  title = 'Anatomy of a render',
  subtitle = 'sunburst · d3-hierarchy partition',
  data = defaultData(theme.series),
  ringStagger = 16,
  startAt = 16,
  backgroundColor = theme.bg,
  paperColor = theme.body,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const radius = Math.min(width - 560, height - 300) / 2;
  const cx = width / 2;
  const cy = height / 2 + 44;

  // partition() lays the tree into a rectangle. Sizing that rectangle
  // [2π, radius] is what makes x an angle and y a radius.
  const nodes = useMemo(() => {
    const root = hierarchy<Node>(data, (d) => d.children as Node[])
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    return partition<Node>().size([Math.PI * 2, radius])(root).descendants().slice(1);
  }, [data, radius]);

  const arcGen = useMemo(
    () =>
      d3arc<{startAngle: number; endAngle: number; innerRadius: number; outerRadius: number}>()
        .padAngle(0.008)
        .padRadius(radius)
        .cornerRadius(theme.radius / 6),
    [radius, theme.radius],
  );

  /** Walks up to the nearest ancestor that declares a colour. */
  const colorOf = (n: (typeof nodes)[number]): string => {
    let cur: typeof n | null = n;
    while (cur) {
      if (cur.data.color) return cur.data.color;
      cur = cur.parent as typeof n | null;
    }
    return theme.muted;
  };

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        // A dark scrim reads as depth on a dark ground and as dirt on a light
        // one, so the scheme picks which way the vignette runs.
        backgroundImage:
          theme.scheme === 'light'
            ? 'radial-gradient(ellipse at 50% 52%, rgba(255,255,255,0.5) 0%, rgba(0,0,0,0.06) 70%)'
            : 'radial-gradient(ellipse at 50% 52%, rgba(255,255,255,0.055) 0%, rgba(0,0,0,0.42) 70%)',
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
          top: 76,
          textAlign: 'center',
          fontSize: 56,
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
          top: 146,
          textAlign: 'center',
          fontFamily: theme.mono,
          fontSize: 25,
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
        <g transform={`translate(${cx} ${cy})`}>
          {nodes.map((n) => {
            // Each ring opens one beat after the ring inside it.
            const begin = startAt + (n.depth - 1) * ringStagger;
            const p = interpolate(frame, [begin, begin + 30], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.22, 1, 0.32, 1),
            });
            if (p <= 0) return null;

            const d = arcGen({
              startAngle: n.x0,
              // The wedge sweeps open from its own start angle…
              endAngle: n.x0 + (n.x1 - n.x0) * p,
              innerRadius: n.y0,
              // …while also growing outward from the ring inside it.
              outerRadius: n.y0 + (n.y1 - n.y0) * p,
            });

            const colour = colorOf(n);
            const mid = (n.x0 + n.x1) / 2 - Math.PI / 2;
            const r = (n.y0 + n.y1) / 2;
            const span = n.x1 - n.x0;
            // Only label a wedge wide enough to hold the text.
            const showLabel = span > 0.16 && p > 0.85;
            const flip = mid > Math.PI / 2 || mid < -Math.PI / 2;

            return (
              <g key={`${n.depth}-${n.data.name}`}>
                <path
                  d={d ?? undefined}
                  fill={colour}
                  fillOpacity={n.depth === 1 ? 0.92 : 0.42}
                  stroke={colour}
                  strokeWidth={n.depth === 1 ? 0 : (theme.stroke * 1.6) / 3}
                />
                {showLabel ? (
                  <g
                    transform={`rotate(${(mid * 180) / Math.PI}) translate(${r} 0)${
                      flip ? ' rotate(180)' : ''
                    }`}
                  >
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={n.depth === 1 ? backgroundColor : paperColor}
                      fontFamily={fontFamily}
                      fontSize={n.depth === 1 ? 25 : 21}
                      fontWeight={n.depth === 1 ? 800 : 600}
                    >
                      {n.data.name}
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}

          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill={paperColor}
            fontFamily={fontFamily}
            fontSize={30}
            fontWeight={800}
            opacity={interpolate(frame, [startAt, startAt + 24], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}
          >
            {data.name}
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
