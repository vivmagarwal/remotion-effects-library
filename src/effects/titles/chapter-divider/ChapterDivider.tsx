import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Archivo';

const {fontFamily} = loadFont('normal', {weights: ['400', '600', '800'], subsets: ['latin']});

/**
 * Chapter Divider
 * The card that sits between sections of a longer video. It has to do three
 * jobs in about three seconds: say where you are, give the eye a rest, and get
 * out of the way. So it is built as a complete in-and-out — the whole thing
 * clears the frame before the composition ends, which means you can drop it
 * straight into a <Series> without trimming anything.
 */

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly muted: string;
  readonly display: string;
  readonly bg: string;
  readonly ink: string;
  readonly series: readonly string[];
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  muted: '#8d93a5',
  display: fontFamily,
  bg: '#0a0b10',
  ink: '#ffffff',
  series: ['#ff5c39', '#4cc9f0', '#c6ff3d', '#ffd166', '#c77dff', '#8d93a5'],
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly number?: string;
  readonly title?: string;
  readonly subtitle?: string;
  /** Frame the exit begins. Everything before this is the entrance and the hold. */
  readonly exitAt?: number;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
  readonly textColor?: string;
};

export const ChapterDivider: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.display,
  number = '02',
  title = 'Timing & Easing',
  subtitle = 'springs, béziers, and when to use which',
  exitAt = 108,
  accentColor = theme.series[3],
  backgroundColor = theme.bg,
  textColor = theme.ink,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const ease = Easing.bezier(0.16, 1, 0.3, 1);
  const easeIn = Easing.bezier(0.7, 0, 0.84, 0);

  // Two bands close on the centre line, then part again on the way out. Solving
  // both from one progress value keeps them exactly symmetrical.
  const close = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
  const part = interpolate(frame, [exitAt, exitAt + 26], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeIn,
  });
  const bandShift = (1 - close) + part;

  // The rule draws out from the centre, then retracts the same way.
  const rule = interpolate(frame, [22, 52, exitAt - 4, exitAt + 12], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

  /** Text rises into place, holds, then drops out — one interpolation, four stops. */
  const reveal = (delay: number) =>
    interpolate(
      frame,
      [26 + delay, 46 + delay, exitAt + delay * 0.4, exitAt + 18 + delay * 0.4],
      [0, 1, 1, 0],
      {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease},
    );

  const HALF = height / 2;

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor: '#04050a', overflow: 'hidden', fontFamily}}>
      {/* Top band */}
      <AbsoluteFill
        style={{
          height: HALF,
          top: 0,
          backgroundColor,
          translate: `0px ${-bandShift * HALF}px`,
        }}
      />
      {/* Bottom band */}
      <AbsoluteFill
        style={{
          height: HALF,
          top: HALF,
          backgroundColor,
          translate: `0px ${bandShift * HALF}px`,
        }}
      />

      {/* The seam between the bands, which the rule sits on. */}
      <div
        style={{
          position: 'absolute',
          left: width / 2 - (width * 0.34 * rule) / 2,
          top: HALF - 1.5,
          width: width * 0.34 * rule,
          height: 3,
          backgroundColor: accentColor,
        }}
      />

      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
        <Interactive.Div
          name="Number"
          style={{
            position: 'absolute',
            top: HALF - 232,
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: '0.42em',
            marginRight: '-0.42em',
            color: accentColor,
            opacity: reveal(0),
            translate: `0px ${(1 - reveal(0)) * 18}px`,
          }}
        >
          CHAPTER {number}
        </Interactive.Div>

        <Interactive.Div
          name="Title"
          style={{
            position: 'absolute',
            top: HALF - 168,
            width: '100%',
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.06,
            color: textColor,
            opacity: reveal(6),
            translate: `0px ${(1 - reveal(6)) * 26}px`,
          }}
        >
          {title}
        </Interactive.Div>

        <Interactive.Div
          name="Subtitle"
          style={{
            position: 'absolute',
            top: HALF + 44,
            width: '100%',
            fontSize: 30,
            fontWeight: 400,
            color: theme.muted,
            opacity: reveal(14),
            translate: `0px ${(1 - reveal(14)) * 22}px`,
          }}
        >
          {subtitle}
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
