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

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly paperMuted: string;
  readonly text: string;
  readonly bgDeep: string;
  readonly series: readonly string[];
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  paperMuted: '#4a4e5a',
  text: fontFamily,
  bgDeep: '#04050a',
  series: ['#ff5c39', '#4cc9f0', '#c6ff3d', '#ffd166', '#c77dff', '#8d93a5'],
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly title?: string;
  readonly subtitle?: string;
  readonly colors?: readonly string[];
  readonly backgroundColor?: string;
  /** Seconds for one full pass of the gradient. */
  readonly sweepSeconds?: number;
};

export const GradientTextSweep: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  title = 'Gradient',
  subtitle = 'background-clip: text',
  // Six stops walked out of the theme palette, warm → cool → warm, closing on
  // the colour it opened with so the loop has no seam. Still a prop default, so
  // an explicit `colors` wins.
  colors = [theme.series[0], theme.series[3], theme.series[2], theme.series[1], theme.series[4], theme.series[0]],
  backgroundColor = theme.bgDeep,
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
          color: theme.paperMuted,
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
