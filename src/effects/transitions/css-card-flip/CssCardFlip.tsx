import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

// palette: data whole-file — a card's front and back have to read as two different cards; the gradients are the subject

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * CSS Card Flip
 * A card flipping between two faces in real 3D, with no library. The three
 * properties that make it work are `perspective` on the parent,
 * `transformStyle: preserve-3d` on the rotating element, and
 * `backfaceVisibility: hidden` on each face. Miss any one and you get a squash
 * instead of a flip.
 */

type Face = {
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
  readonly background: string;
  readonly color: string;
  readonly accent: string;
};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it.
 */
type Theme = {
  readonly body: string;
  readonly text: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  body: '#eef1f7',
  text: fontFamily,
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly front?: Face;
  readonly back?: Face;
  /** [frame, degrees] pairs. Multiples of 180 land on a face. */
  readonly flips?: readonly (readonly [number, number])[];
  readonly backgroundColor?: string;
};

const CardFace: React.FC<{face: Face; flipped?: boolean}> = ({face, flipped}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      borderRadius: 28,
      padding: '58px 62px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      background: face.background,
      color: face.color,
      // Hide the mirrored side, so only the face pointing at the camera is drawn.
      backfaceVisibility: 'hidden',
      WebkitBackfaceVisibility: 'hidden',
      // The back face starts pre-rotated so it faces away at 0°.
      transform: flipped ? 'rotateY(180deg)' : undefined,
      boxShadow: '0 40px 90px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255,255,255,0.14)',
    }}
  >
    <div
      style={{
        fontSize: 26,
        fontWeight: 700,
        letterSpacing: '0.24em',
        textTransform: 'uppercase',
        color: face.accent,
      }}
    >
      {face.eyebrow}
    </div>
    <div style={{fontSize: 92, fontWeight: 800, letterSpacing: '-0.035em', marginTop: 16, lineHeight: 1.05}}>
      {face.title}
    </div>
    <div style={{fontSize: 32, fontWeight: 500, marginTop: 20, opacity: 0.78, lineHeight: 1.45}}>
      {face.body}
    </div>
  </div>
);

export const CssCardFlip: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  front = {
    eyebrow: 'Before',
    title: 'A flat rectangle',
    body: 'transform: rotateY() on its own just squashes the card horizontally.',
    background: 'linear-gradient(150deg, #1c2030, #10131d)',
    color: theme.body,
    accent: '#7f8aa3',
  },
  back = {
    eyebrow: 'After',
    title: 'A card in space',
    body: 'perspective + preserve-3d + backface-visibility. Three properties, no library.',
    background: 'linear-gradient(150deg, #ff5c39, #b8322a)',
    color: '#fff5f1',
    accent: '#ffd8cc',
  },
  flips = [
    [0, 0],
    [40, 180],
    [95, 360],
    [140, 540],
  ],
  backgroundColor = '#08090f',
}) => {
  const frame = useCurrentFrame();

  const rotation = interpolate(
    frame,
    flips.map(([f]) => f),
    flips.map(([, d]) => d),
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.5, 0, 0.2, 1),
    },
  );

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        backgroundImage: 'radial-gradient(ellipse at 50% 44%, rgba(255,255,255,0.055) 0%, rgba(0,0,0,0.42) 62%)',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
        // 1. Perspective lives on the PARENT of the rotating element.
        perspective: 1900,
      }}
    >
      <Interactive.Div
        name="Card"
        style={{
          position: 'relative',
          width: 940,
          height: 560,
          // 2. Children are positioned in the same 3D space, not flattened.
          transformStyle: 'preserve-3d',
          transform: `rotateY(${rotation}deg)`,
          scale: interpolate(frame, [0, 22], [0.9, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: 'perceptual-scale',
          }),
        }}
      >
        {/* 3. backfaceVisibility: hidden on each face. */}
        <CardFace face={front} />
        <CardFace face={back} flipped />
      </Interactive.Div>
    </AbsoluteFill>
  );
};
