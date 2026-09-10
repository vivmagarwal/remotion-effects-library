import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '800'], subsets: ['latin']});

/**
 * Count-Up Stat
 * A number ticks from zero to its target and settles. Two things stop it from
 * looking cheap: the digits are tabular (so the number does not jitter as it
 * counts), and the easing decelerates hard so the last few units crawl in.
 */

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly muted: string;
  readonly text: string;
  readonly accent: string;
  readonly bg: string;
  readonly ink: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
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
  readonly value?: number;
  readonly prefix?: string;
  readonly suffix?: string;
  readonly label?: string;
  readonly caption?: string;
  readonly decimals?: number;
  /** Seconds the count takes. */
  readonly countSeconds?: number;
  readonly backgroundColor?: string;
  readonly color?: string;
  readonly accentColor?: string;
};

export const CountUpStat: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  value = 11772,
  prefix = '',
  suffix = '+',
  label = 'Happy customers',
  caption = 'and counting',
  decimals = 0,
  countSeconds = 1.8,
  backgroundColor = theme.bg,
  color = theme.ink,
  accentColor = theme.accent,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const counted = interpolate(frame, [8, 8 + countSeconds * fps], [0, value], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    // Hard deceleration: most of the distance is covered early, the last units crawl.
    easing: Easing.bezier(0.1, 0.9, 0.2, 1),
  });

  const settleAt = 8 + countSeconds * fps;

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        backgroundImage: `radial-gradient(ellipse at 50% 42%, ${accentColor}26 0%, transparent 58%)`,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
      }}
    >
      <Interactive.Div
        name="Number"
        style={{
          fontSize: 300,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: '-0.045em',
          color,
          // Tabular figures: every digit the same width, so the number does not
          // shuffle sideways as it counts.
          fontVariantNumeric: 'tabular-nums',
          // No landing pulse, deliberately. The deceleration IS the effect here:
          // the number arrives because it stopped, not because something hit it.
          // `titles/stat-slam` is the one with the impact stack, and having both
          // do a small punch is what made the two read as the same effect.
          opacity: interpolate(frame, [0, 10], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {prefix}
        {counted.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}
        <span style={{color: accentColor}}>{suffix}</span>
      </Interactive.Div>

      <Interactive.Div
        name="Label"
        style={{
          fontSize: 46,
          fontWeight: 500,
          color: theme.muted,
          marginTop: 6,
          translate: interpolate(frame, [12, 34], ['0px 18px', '0px 0px'], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          opacity: interpolate(frame, [12, 30], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {label}
      </Interactive.Div>

      <Interactive.Div
        name="Caption"
        style={{
          fontSize: 26,
          fontWeight: 500,
          letterSpacing: '0.28em',
          marginRight: '-0.28em',
          textTransform: 'uppercase',
          color: accentColor,
          marginTop: 30,
          opacity: interpolate(frame, [settleAt, settleAt + 16], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {caption}
      </Interactive.Div>
    </AbsoluteFill>
  );
};
