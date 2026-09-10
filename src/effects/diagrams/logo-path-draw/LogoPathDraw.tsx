import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {evolvePath, getLength} from '@remotion/paths';
import {loadFont} from '@remotion/google-fonts/Sora';

const {fontFamily} = loadFont('normal', {weights: ['300', '700'], subsets: ['latin']});

/**
 * Logo Path Draw
 * A mark that draws itself, then fills. `evolvePath(progress, d)` from
 * @remotion/paths returns the `strokeDasharray` and `strokeDashoffset` for you,
 * which matters because the dash has to equal the path's own length — hardcode
 * a number and short paths finish early while long ones never finish at all.
 */

type Stroke = {
  /** SVG path data, in the viewBox below. */
  readonly d: string;
  /** Frame this stroke starts drawing, relative to startAt. */
  readonly at: number;
  /** Frames it takes. Longer paths want more, or the pen appears to speed up. */
  readonly over: number;
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
  readonly mono: string;
  readonly paperMuted: string;
  readonly muted: string;
  readonly text: string;
  readonly accent: string;
  readonly bg: string;
  readonly ink: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  mono: MONO,
  paperMuted: '#4a4e5a',
  muted: '#8d93a5',
  text: fontFamily,
  accent: '#ff5c39',
  bg: '#0a0b10',
  ink: '#ffffff',
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly title?: string;
  readonly subtitle?: string;
  readonly strokes?: readonly Stroke[];
  readonly viewBox?: string;
  readonly startAt?: number;
  /** Frames after the last stroke before the fill washes in. */
  readonly fillDelay?: number;
  readonly strokeWidth?: number;
  readonly accentColor?: string;
  readonly fillColor?: string;
  readonly backgroundColor?: string;
};

/**
 * An R and a play triangle. Timings are hand-tuned per path: giving a long
 * curve and a short tick the same duration makes the pen appear to change
 * speed, which is the giveaway that a draw-on was faked.
 */
const DEFAULT_STROKES: Stroke[] = [
  {d: 'M60 170 L60 30 L140 30 A40 40 0 0 1 140 110 L60 110', at: 0, over: 36},
  {d: 'M108 110 L165 170', at: 28, over: 14},
  {d: 'M215 38 L215 162 L308 100 Z', at: 36, over: 30},
];

export const LogoPathDraw: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  title = 'PATHS',
  subtitle = 'evolvePath() · one call, correct dashes',
  strokes = DEFAULT_STROKES,
  viewBox = '40 10 300 180',
  startAt = 14,
  fillDelay = 10,
  strokeWidth = 9,
  accentColor = theme.accent,
  fillColor = theme.ink,
  backgroundColor = theme.bg,
}) => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();

  const lastDone = startAt + Math.max(...strokes.map((s) => s.at + s.over));

  const fill = interpolate(frame, [lastDone + fillDelay, lastDone + fillDelay + 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  const SIZE = Math.min(width * 0.42, 760);

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, fontFamily, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{backgroundImage: `radial-gradient(ellipse at 50% 44%, ${accentColor}18 0%, transparent 62%)`}}
      />

      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <svg width={SIZE} height={SIZE * 0.58} viewBox={viewBox} style={{overflow: 'visible'}}>
          {strokes.map((stroke, i) => {
            const p = interpolate(
              frame,
              [startAt + stroke.at, startAt + stroke.at + stroke.over],
              [0, 1],
              {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.bezier(0.45, 0, 0.25, 1),
              },
            );
            if (p <= 0) return null;

            // evolvePath measures the path and returns both dash values. Doing
            // this by hand means calling getLength() yourself and keeping the
            // two numbers in step; this is one call and cannot drift.
            const {strokeDasharray, strokeDashoffset} = evolvePath(p, stroke.d);

            return (
              <path
                key={i}
                d={stroke.d}
                fill="none"
                stroke={accentColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
              />
            );
          })}

          {/* The fill is the same paths again, drawn over the top. Fading them
              in turns an outline into a solid mark without a second geometry. */}
          {fill > 0
            ? strokes.map((stroke, i) => (
                <path
                  key={`f-${i}`}
                  d={stroke.d}
                  fill="none"
                  stroke={fillColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={fill}
                />
              ))
            : null}
        </svg>

        <Interactive.Div
          name="Title"
          style={{
            marginTop: 58,
            fontSize: 62,
            fontWeight: 700,
            letterSpacing: '0.34em',
            marginRight: '-0.34em',
            color: theme.ink,
            opacity: interpolate(frame, [lastDone, lastDone + 22], [0, 1], {
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
            marginTop: 16,
            fontFamily: theme.mono,
            fontSize: 25,
            color: theme.muted,
            opacity: interpolate(frame, [lastDone + 12, lastDone + 34], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {subtitle}
        </Interactive.Div>

        {/* Proof the measurement is real, not a guess. */}
        <Interactive.Div
          name="Readout"
          style={{
            position: 'absolute',
            bottom: 76,
            fontFamily: theme.mono,
            fontSize: 22,
            color: theme.paperMuted,
            fontVariantNumeric: 'tabular-nums',
            opacity: interpolate(frame, [startAt, startAt + 16], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          total path length {Math.round(strokes.reduce((a, s) => a + getLength(s.d), 0))} units
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
