import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/AntonSC';

const {fontFamily} = loadFont('normal', {weights: ['400'], subsets: ['latin']});

/**
 * Text Mask Reveal
 * The word is a window: a moving scene shows through the letterforms and nothing
 * else. `background-clip: text` on a container whose background is an animated
 * layer does the clipping; the letters are painted transparent so only the
 * background survives inside them.
 */

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly display: string;
  readonly paper: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  display: fontFamily,
  paper: '#f6f5f2',
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly title?: string;
  readonly caption?: string;
  readonly backgroundColor?: string;
  readonly blobs?: readonly {readonly color: string; readonly x: number; readonly y: number; readonly r: number}[];
};

export const TextMaskReveal: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.display,
  title = 'INSIDE',
  caption = 'the type is the window',
  backgroundColor = theme.paper,
  blobs = [
    {color: '#ff5c39', x: 22, y: 40, r: 46},
    {color: '#4cc9f0', x: 68, y: 30, r: 40},
    {color: '#ffd166', x: 50, y: 74, r: 42},
    {color: '#c6ff3d', x: 84, y: 68, r: 34},
  ],
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  // The scene that shows through: soft colour blobs drifting on their own phase.
  const t = frame / fps;
  const scene = blobs
    .map((b, i) => {
      const x = b.x + Math.sin(t * 0.6 + i * 1.7) * 13;
      const y = b.y + Math.cos(t * 0.5 + i * 2.3) * 11;
      return `radial-gradient(circle at ${x}% ${y}%, ${b.color} 0%, transparent ${b.r}%)`;
    })
    .join(', ');

  // Letters grow apart slightly as the piece plays — small, but it keeps it alive.
  const tracking = interpolate(frame, [0, durationInFrames], [-0.055, -0.02], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      name="Scene"
      style={{backgroundColor, justifyContent: 'center', alignItems: 'center', fontFamily}}
    >
      <Interactive.Div
        name="Masked title"
        style={{
          fontSize: 380,
          lineHeight: 0.92,
          letterSpacing: `${tracking}em`,
          backgroundImage: `${scene}, linear-gradient(#1d1b17, #1d1b17)`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          scale: interpolate(frame, [0, 30], [1.14, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: 'perceptual-scale',
          }),
        }}
      >
        {title}
      </Interactive.Div>

      <Interactive.Div
        name="Caption"
        style={{
          fontFamily: 'Inter, -apple-system, Helvetica, sans-serif',
          fontSize: 30,
          fontWeight: 500, // font-weight-check: ignore — this rule targets the system Inter stack above, not AntonSC (which ships 400 only)
          letterSpacing: '0.28em',
          marginRight: '-0.28em',
          textTransform: 'uppercase',
          color: '#4a4e5a',
          marginTop: 26,
          opacity: interpolate(frame, [24, 46], [0, 1], {
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
