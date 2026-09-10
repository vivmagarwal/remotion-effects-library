import {useMemo} from 'react';
import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {chord as d3chord, ribbon as d3ribbon} from 'd3-chord';
import type {Chord, ChordSubgroup} from 'd3-chord';
import {arc as d3arc} from 'd3-shape';
import {descending} from 'd3-array';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Chord Diagram
 * A square matrix drawn as a ring of arcs joined by ribbons — the standard way
 * to show flow between every pair in a set. d3-chord is pure: it takes the
 * matrix and returns angles, with no simulation and no internal state, so the
 * layout is identical on every frame and only the reveal is animated.
 */

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
  readonly names?: readonly string[];
  /** Square matrix: matrix[i][j] is the flow from i to j. */
  readonly matrix?: readonly (readonly number[])[];
  readonly colors?: readonly string[];
  /** Frames between one ribbon arriving and the next. */
  readonly stagger?: number;
  readonly startAt?: number;
  readonly backgroundColor?: string;
  readonly paperColor?: string;
};

const DEFAULT_NAMES = ['YouTube', 'TikTok', 'Instagram', 'X', 'LinkedIn', 'Reddit'];

const DEFAULT_MATRIX = [
  [0, 1840, 1310, 620, 240, 430],
  [1620, 0, 1720, 510, 130, 380],
  [1290, 1810, 0, 470, 290, 260],
  [700, 560, 520, 0, 610, 940],
  [260, 150, 330, 580, 0, 190],
  [480, 410, 240, 980, 210, 0],
];

const DEFAULT_COLORS = ['#ff5c39', '#c6ff3d', '#c77dff', '#4cc9f0', '#ffd166', '#c2410c'];

export const ChordDiagram: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  title = 'Where the audience goes next',
  subtitle = 'chord diagram · d3-chord',
  names = DEFAULT_NAMES,
  matrix = DEFAULT_MATRIX,
  colors = DEFAULT_COLORS,
  stagger = 1.6,
  startAt = 20,
  backgroundColor = theme.bg,
  paperColor = theme.body,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  // Labels run RADIALLY outward from the ring, so the frame has to hold the
  // ring plus the longest label at both top and bottom — not just the ring.
  const SIZE = Math.min(width - 760, height - 500);
  const outer = SIZE / 2;
  const inner = outer - 24;
  const labelGap = 18;

  // d3-chord is a pure function of the matrix: same input, same angles, always.
  const chords = useMemo(
    () =>
      d3chord()
        .padAngle(0.045)
        .sortSubgroups(descending)(matrix as number[][]),
    [matrix],
  );

  // Typing the generator with the datum it will actually receive is what keeps
  // these calls cast-free — the untyped `arc()` demands innerRadius/outerRadius
  // on every datum even when they are fixed on the generator.
  const groupArc = useMemo(
    () => d3arc<{startAngle: number; endAngle: number}>().innerRadius(inner).outerRadius(outer),
    [inner, outer],
  );

  // The ring assembles, then turns very slowly for the rest of the shot.
  const spin = interpolate(frame, [0, 46], [-0.42, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  }) + frame * 0.0012;

  const bloom = interpolate(frame, [0, 46], [0.82, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

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
          top: 66,
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
          top: 134,
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

      <svg
        width={width}
        height={height}
        style={{position: 'absolute', inset: 0}}
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* Everything is drawn in centred coordinates, so a scale about the
            origin is a scale about the middle of the ring. */}
        <g transform={`translate(${width / 2} ${height / 2 + 70}) rotate(${(spin * 180) / Math.PI}) scale(${bloom})`}>
          {/* Ribbons first, so the group arcs sit on top of their ends. */}
          {chords.map((c, i) => {
            const p = interpolate(
              frame,
              [startAt + i * stagger, startAt + i * stagger + 26],
              [0, 1],
              {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.bezier(0.22, 1, 0.32, 1),
              },
            );
            if (p <= 0) return null;

            // Shrinking the ribbon's own radius makes it grow out of the centre
            // rather than fade in place — the chord "reaches across" the ring.
            const grown = d3ribbon<Chord, ChordSubgroup>().radius(inner * p);
            const d = grown(c) ?? undefined;

            return (
              <path
                key={`${c.source.index}-${c.target.index}`}
                d={d}
                fill={colors[c.source.index % colors.length]}
                fillOpacity={0.42 * p}
                stroke={colors[c.source.index % colors.length]}
                strokeOpacity={0.5 * p}
                strokeWidth={1}
              />
            );
          })}

          {chords.groups.map((g) => {
            // The arc sweeps open from its own start angle.
            const p = interpolate(frame, [startAt - 12, startAt + 18], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.22, 1, 0.32, 1),
            });
            const end = g.startAngle + (g.endAngle - g.startAngle) * p;
            const d = groupArc({startAngle: g.startAngle, endAngle: end}) ?? undefined;

            // Labels ride the arc, flipping so they never read upside down.
            const mid = (g.startAngle + end) / 2 - Math.PI / 2;
            const flip = mid > Math.PI / 2 || mid < -Math.PI / 2;

            return (
              <g key={g.index}>
                <path d={d} fill={colors[g.index % colors.length]} />
                <g
                  transform={`rotate(${(mid * 180) / Math.PI}) translate(${outer + labelGap} 0)${
                    flip ? ' rotate(180)' : ''
                  }`}
                  opacity={interpolate(frame, [startAt + 14, startAt + 34], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  })}
                >
                  <text
                    textAnchor={flip ? 'end' : 'start'}
                    dominantBaseline="middle"
                    fill={paperColor}
                    fontFamily={fontFamily}
                    fontSize={24}
                    fontWeight={700}
                  >
                    {names[g.index] ?? g.index}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
