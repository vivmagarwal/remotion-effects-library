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

type Props = {
  readonly title?: string;
  readonly caption?: string;
  readonly backgroundColor?: string;
  readonly blobs?: readonly {readonly color: string; readonly x: number; readonly y: number; readonly r: number}[];
};

export const TextMaskReveal: React.FC<Props> = ({
  title = 'INSIDE',
  caption = 'the type is the window',
  backgroundColor = '#f2f0ec',
  blobs = [
    {color: '#ff4d3d', x: 22, y: 40, r: 46},
    {color: '#2f6bff', x: 68, y: 30, r: 40},
    {color: '#ffc93c', x: 50, y: 74, r: 42},
    {color: '#12c48b', x: 84, y: 68, r: 34},
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
          backgroundImage: `${scene}, linear-gradient(#111, #111)`,
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
          color: '#8e8a84',
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
