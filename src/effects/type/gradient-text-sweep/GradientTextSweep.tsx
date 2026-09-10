import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Outfit';

const {fontFamily} = loadFont('normal', {weights: ['800'], subsets: ['latin']});

/**
 * Gradient Text Sweep
 * A wide gradient is clipped to the glyphs with `background-clip: text` and then
 * slid horizontally, so colour appears to travel through the letters. The
 * gradient is much wider than the text (300%) — that spare width is what the
 * sweep travels across.
 */

type Props = {
  readonly title?: string;
  readonly subtitle?: string;
  readonly colors?: readonly string[];
  readonly backgroundColor?: string;
  /** Seconds for one full pass of the gradient. */
  readonly sweepSeconds?: number;
};

export const GradientTextSweep: React.FC<Props> = ({
  title = 'Gradient',
  subtitle = 'background-clip: text',
  colors = ['#ff5c39', '#ffd166', '#c6ff3d', '#4cc9f0', '#c77dff', '#ff5c39'],
  backgroundColor = '#04050a',
  sweepSeconds = 3,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const gradient = `linear-gradient(100deg, ${colors.join(', ')})`;

  return (
    <AbsoluteFill
      name="Scene"
      style={{backgroundColor, justifyContent: 'center', alignItems: 'center', fontFamily}}
    >
      <Interactive.Div
        name="Title"
        style={{
          fontSize: 260,
          fontWeight: 800,
          letterSpacing: '-0.045em',
          lineHeight: 1,
          backgroundImage: gradient,
          // Room for the gradient to travel through.
          backgroundSize: '300% 100%',
          backgroundPosition: interpolate(
            frame,
            [0, sweepSeconds * fps],
            ['0% 50%', '200% 50%'],
            {extrapolateRight: 'extend', easing: Easing.linear},
          ),
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          scale: interpolate(frame, [0, 24], [0.9, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: 'perceptual-scale',
          }),
          opacity: interpolate(frame, [0, 16], [0, 1], {
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
          fontSize: 36,
          fontWeight: 800,
          letterSpacing: '0.3em',
          marginRight: '-0.3em',
          textTransform: 'uppercase',
          color: '#4a4e5a',
          marginTop: 18,
          translate: interpolate(frame, [14, 40], ['0px 22px', '0px 0px'], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          opacity: interpolate(frame, [14, 34], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {subtitle}
      </Interactive.Div>
    </AbsoluteFill>
  );
};
