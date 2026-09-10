import {useMemo} from 'react';
import {AbsoluteFill, Easing, Interactive, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {area as d3area, curveBasis, stack as d3stack, stackOffsetWiggle, stackOrderInsideOut} from 'd3-shape';
import type {SeriesPoint} from 'd3-shape';
import {scaleLinear} from 'd3-scale';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['600', '800'], subsets: ['latin']});

/**
 * Streamgraph
 * Stacked bands flowing like a river around a wandering baseline. Two d3-shape
 * choices make it a streamgraph rather than a stacked area chart:
 * `stackOffsetWiggle`, which floats the baseline to minimise how much the bands
 * have to wobble, and `stackOrderInsideOut`, which puts the series that peak
 * earliest on the outside so the shape reads as a flow. `curveBasis` is what
 * makes the edges organic instead of faceted.
 */

type Row = Record<string, number>;

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
  readonly mono: string;
  readonly muted: string;
  readonly text: string;
  readonly bg: string;
  readonly body: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  mono: MONO,
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
  readonly keys?: readonly string[];
  readonly colors?: readonly string[];
  /** Time steps along the x axis. */
  readonly samples?: number;
  /** Frames the river takes to draw itself across. */
  readonly drawFrames?: number;
  readonly startAt?: number;
  readonly backgroundColor?: string;
  readonly paperColor?: string;
};

const DEFAULT_KEYS = ['shorts', 'tutorials', 'launches', 'demos', 'devlogs', 'talks', 'ads'];
const DEFAULT_COLORS = ['#ff5c39', '#4cc9f0', '#c77dff', '#ffd166', '#c6ff3d', '#c2410c', '#8d93a5'];

export const Streamgraph: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  title = 'What people are rendering',
  subtitle = 'streamgraph · stackOffsetWiggle + stackOrderInsideOut',
  keys = DEFAULT_KEYS,
  colors = DEFAULT_COLORS,
  samples = 48,
  drawFrames = 96,
  startAt = 16,
  backgroundColor = theme.bg,
  paperColor = theme.body,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const PAD = {left: 92, right: 92, top: 214, bottom: 128};
  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;

  // Seeded data: each series is a smooth bump at its own point in time plus a
  // little seeded texture. random(seed) keeps it identical across render tabs.
  const rows = useMemo<Row[]>(() => {
    return new Array(samples).fill(0).map((_, i) => {
      const t = i / (samples - 1);
      const row: Row = {};
      keys.forEach((k, ki) => {
        const peak = 0.14 + (ki / keys.length) * 0.78;
        const spread = 0.16 + random(`w-${k}`) * 0.16;
        const bump = Math.exp(-((t - peak) ** 2) / (2 * spread * spread));
        const texture = 0.82 + random(`n-${k}-${i}`) * 0.36;
        row[k] = bump * (34 + random(`h-${k}`) * 70) * texture + 1.4;
      });
      return row;
    });
  }, [keys, samples]);

  const series = useMemo(
    () =>
      d3stack<Row, string>()
        .keys(keys as string[])
        .offset(stackOffsetWiggle)
        .order(stackOrderInsideOut)(rows),
    [keys, rows],
  );

  // The wiggle offset produces a signed baseline, so the extent has to be read
  // from the stacked output — it is not 0-based.
  const [lo, hi] = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const s of series) {
      for (const point of s) {
        if (point[0] < min) min = point[0];
        if (point[1] > max) max = point[1];
      }
    }
    return [min, max];
  }, [series]);

  const x = useMemo(() => scaleLinear().domain([0, samples - 1]).range([0, plotW]), [samples, plotW]);
  const y = useMemo(() => scaleLinear().domain([lo, hi]).range([plotH, 0]), [lo, hi, plotH]);

  const areaGen = useMemo(
    () =>
      d3area<SeriesPoint<Row>>()
        .x((_, i) => x(i))
        .y0((d) => y(d[0]))
        .y1((d) => y(d[1]))
        .curve(curveBasis),
    [x, y],
  );

  // The river draws itself left to right behind a clip rect.
  const p = interpolate(frame, [startAt, startAt + drawFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.22, 1),
  });

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        backgroundImage: 'radial-gradient(ellipse at 50% 58%, rgba(255,255,255,0.055) 0%, rgba(0,0,0,0.42) 74%)',
        fontFamily,
        overflow: 'hidden',
      }}
    >
      <Interactive.Div
        name="Title"
        style={{
          position: 'absolute',
          left: PAD.left,
          top: 76,
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
          top: 148,
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
        <defs>
          <clipPath id="stream-wipe">
            <rect x={0} y={-40} width={plotW * p} height={plotH + 80} />
          </clipPath>
        </defs>

        <g transform={`translate(${PAD.left} ${PAD.top})`}>
          <g clipPath="url(#stream-wipe)">
            {series.map((s, i) => (
              <path
                key={s.key}
                d={areaGen(s) ?? undefined}
                fill={colors[i % colors.length]}
                fillOpacity={0.88}
              />
            ))}
          </g>

          {/* The leading edge, so the draw reads as a playhead rather than a wipe. */}
          {p > 0.002 && p < 0.999 ? (
            <line
              x1={plotW * p}
              y1={-40}
              x2={plotW * p}
              y2={plotH + 40}
              stroke={paperColor}
              strokeWidth={2}
              opacity={0.75}
            />
          ) : null}
        </g>
      </svg>

      {/* Legend, keyed off the same arrays that drew the bands. */}
      <div
        style={{
          position: 'absolute',
          left: PAD.left,
          right: PAD.right,
          bottom: 62,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px 34px',
        }}
      >
        {keys.map((k, i) => (
          <div
            key={k}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              fontSize: 25,
              fontWeight: 600,
              color: theme.body,
              opacity: interpolate(frame, [startAt + 20 + i * 5, startAt + 40 + i * 5], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 5,
                backgroundColor: colors[i % colors.length],
              }}
            />
            {k}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
