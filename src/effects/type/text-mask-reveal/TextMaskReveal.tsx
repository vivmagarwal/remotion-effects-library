import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/AntonSC';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['400'], subsets: ['latin']});
const {fontFamily: inter} = loadInter('normal', {weights: ['500'], subsets: ['latin']});

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
  readonly paperInk: string;
  readonly paperMuted: string;
  readonly display: string;
  readonly text: string;
  readonly paper: string;
  readonly series: readonly string[];
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  paperInk: '#1d1b17',
  paperMuted: '#4a4e5a',
  display: fontFamily,
  text: inter,
  paper: '#f6f5f2',
  series: ['#ff5c39', '#4cc9f0', '#c6ff3d', '#ffd166', '#c77dff', '#8d93a5'],
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
  // The field seen through the letters IS the picture here, so it is indexed out
  // of the theme palette rather than picked by eye. Still a prop default, so an
  // explicit `blobs` wins.
  blobs = [
    {color: theme.series[0], x: 22, y: 40, r: 46},
    {color: theme.series[1], x: 68, y: 30, r: 40},
    {color: theme.series[3], x: 50, y: 74, r: 42},
    {color: theme.series[2], x: 84, y: 68, r: 34},
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
          fontWeight: 800, // font-weight-check: ignore — theme display faces; Anton SC ships 400 only and fontSynthesis 'none' keeps it unsynthesised
          // No faux bold: Anton SC has one cut and must render it untouched,
          // while a theme's display family supplies a real heavy one.
          fontSynthesis: 'none',
          lineHeight: 0.92,
          letterSpacing: `${tracking}em`,
          backgroundImage: `${scene}, linear-gradient(${theme.paperInk}, ${theme.paperInk})`,
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
          fontFamily: theme.text,
          fontSize: 30,
          fontWeight: 500,
          letterSpacing: '0.28em',
          marginRight: '-0.28em',
          textTransform: 'uppercase',
          color: theme.paperMuted,
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
