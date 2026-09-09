import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '800'], subsets: ['latin']});

/**
 * Count-Up Stat
 * A number ticks from zero to its target and settles. Two things stop it from
 * looking cheap: the digits are tabular (so the number does not jitter as it
 * counts), and the easing decelerates hard so the last few units crawl in.
 */

type Props = {
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
  value = 11772,
  prefix = '',
  suffix = '+',
  label = 'Happy customers',
  caption = 'and counting',
  decimals = 0,
  countSeconds = 1.8,
  backgroundColor = '#0b0b10',
  color = '#ffffff',
  accentColor = '#ff8a3d',
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
          scale: interpolate(frame, [settleAt, settleAt + 8, settleAt + 22], [1, 1.045, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: 'perceptual-scale',
          }),
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
          color: '#9aa0b0',
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
