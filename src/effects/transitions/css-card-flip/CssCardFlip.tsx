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
  readonly bg: string;
  readonly body: string;
  readonly accent: string;
  readonly accentInk: string;
  readonly display: string;
  readonly text: string;
  readonly radius: number;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  bg: '#0a0b10',
  body: '#eef1f7',
  accent: '#ff5c39',
  accentInk: '#04050a',
  display: fontFamily,
  text: fontFamily,
  radius: 18,
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** CSS family for the card titles. Defaults to the theme's display face. */
  readonly displayFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly front?: Face;
  readonly back?: Face;
  /** [frame, degrees] pairs. Multiples of 180 land on a face. */
  readonly flips?: readonly (readonly [number, number])[];
  readonly backgroundColor?: string;
  /** Card corner radius. Defaults to `theme.radius × 1.56` — 28 at the house 18. */
  readonly cornerRadius?: number;
};

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** The authored back face runs #ff5c39 -> #b8322a. As a per-channel multiply, that same shade applies to any accent. */
const SHADE = [184 / 255, 50 / 92, 42 / 57];

const shade = (hex: string) =>
  '#' +
  channels(hex)
    .map((c, i) => Math.round(Math.min(255, c * SHADE[i])).toString(16).padStart(2, '0'))
    .join('');

/** WCAG relative luminance. */
const luminance = (hex: string) => {
  const [r, g, b] = channels(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const CardFace: React.FC<{
  face: Face;
  flipped?: boolean;
  radius: number;
  /** Threaded: at module scope a bare `theme` is not in lexical reach. */
  displayFamily: string;
}> = ({face, flipped, radius, displayFamily}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      borderRadius: radius,
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
    <div
      style={{
        fontFamily: displayFamily,
        fontSize: 92,
        fontWeight: 800,
        letterSpacing: '-0.035em',
        marginTop: 16,
        lineHeight: 1.05,
      }}
    >
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
  displayFamily = theme.display,
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
    background: `linear-gradient(150deg, ${theme.accent}, ${shade(theme.accent)})`,
    color: luminance(theme.accent) > 0.4 ? theme.accentInk : '#fff5f1',
    accent: luminance(theme.accent) > 0.4 ? `${theme.accentInk}b3` : '#ffd8cc',
  },
  flips = [
    [0, 0],
    [40, 180],
    [95, 360],
    [140, 540],
  ],
  backgroundColor = theme.bg,
  cornerRadius = Math.round(theme.radius * 1.56),
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
        <CardFace face={front} radius={cornerRadius} displayFamily={displayFamily} />
        <CardFace face={back} flipped radius={cornerRadius} displayFamily={displayFamily} />
      </Interactive.Div>
    </AbsoluteFill>
  );
};
