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

type Props = {
  readonly title?: string;
  readonly subtitle?: string;
  readonly data?: Node;
  /** Frames between one ring opening and the next. */
  readonly ringStagger?: number;
  readonly startAt?: number;
  readonly backgroundColor?: string;
  readonly paperColor?: string;
};

const DEFAULT_DATA: Node = {
  name: 'render',
  children: [
    {
      name: 'compose',
      color: '#4cc9f0',
      children: [
        {name: 'layout', value: 34},
        {name: 'fonts', value: 20},
        {name: 'assets', value: 26},
        {name: 'props', value: 14},
      ],
    },
    {
      name: 'animate',
      color: '#ff5c39',
      children: [
        {name: 'spring', value: 40},
        {name: 'interpolate', value: 36},
        {name: 'easing', value: 18},
        {name: 'noise', value: 12},
      ],
    },
    {
      name: 'draw',
      color: '#c77dff',
      children: [
        {name: 'canvas', value: 28},
        {name: 'svg', value: 24},
        {name: 'webgl', value: 22},
        {name: 'css', value: 16},
      ],
    },
    {
      name: 'encode',
      color: '#c6ff3d',
      children: [
        {name: 'h264', value: 30},
        {name: 'audio', value: 16},
        {name: 'stitch', value: 12},
      ],
    },
  ],
};

export const SunburstRings: React.FC<Props> = ({
  title = 'Anatomy of a render',
  subtitle = 'sunburst · d3-hierarchy partition',
  data = DEFAULT_DATA,
  ringStagger = 16,
  startAt = 16,
  backgroundColor = '#0a0b10',
  paperColor = '#eef1f7',
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
        .cornerRadius(3),
    [radius],
  );

  /** Walks up to the nearest ancestor that declares a colour. */
  const colorOf = (n: (typeof nodes)[number]): string => {
    let cur: typeof n | null = n;
    while (cur) {
      if (cur.data.color) return cur.data.color;
      cur = cur.parent as typeof n | null;
    }
    return '#8d93a5';
  };

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        backgroundImage: 'radial-gradient(ellipse at 50% 52%, rgba(255,255,255,0.055) 0%, rgba(0,0,0,0.42) 70%)',
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
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 25,
          color: '#8d93a5',
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
                  strokeWidth={n.depth === 1 ? 0 : 1.6}
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
                      fill={n.depth === 1 ? '#0a0b10' : paperColor}
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
