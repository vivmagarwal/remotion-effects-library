import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Anton';

const {fontFamily} = loadFont('normal', {weights: ['400'], subsets: ['latin']});

/**
 * Extruded Text
 * Solid 3D type, faked by stacking many copies of the same word along the depth
 * axis. Because the copies are real DOM nodes in a preserve-3d space, they rotate
 * correctly with the parent — which a `text-shadow` stack cannot do, since a
 * shadow is painted flat in screen space and stays flat however you turn it.
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
  readonly accent: string;
  readonly accentOnPaper: string;
  readonly bg: string;
  readonly paper: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  muted: '#8d93a5',
  display: fontFamily,
  accent: '#ff5c39',
  accentOnPaper: '#c2410c',
  bg: '#0a0b10',
  paper: '#f6f5f2',
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly text?: string;
  readonly caption?: string;
  /** How many extrusion layers. More = smoother side, slower. */
  readonly depth?: number;
  /** Pixels between layers. */
  readonly step?: number;
  readonly faceColor?: string;
  readonly sideColor?: string;
  readonly sideShadeColor?: string;
  readonly backgroundColor?: string;
  readonly accentColor?: string;
  /** Degrees of yaw the word swings through. */
  readonly swing?: number;
};

export const ExtrudedText: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.display,
  text = 'SOLID',
  caption = 'preserve-3d · one word, forty copies',
  depth = 40,
  step = 3,
  faceColor = theme.paper,
  sideColor = theme.accent,
  sideShadeColor = theme.accentOnPaper,
  backgroundColor = theme.bg,
  accentColor = theme.accent,
  swing = 26,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const enter = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // A swing, not a spin: the word turns far enough to show its side and comes back.
  const yaw = Math.sin(t * 0.62) * swing;
  const pitch = Math.sin(t * 0.4 + 1.1) * 8;

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        backgroundImage: `radial-gradient(ellipse at 50% 46%, ${accentColor}1f 0%, transparent 62%)`,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
        // Perspective belongs on the PARENT of the rotated element.
        perspective: 2200,
      }}
    >
      <Interactive.Div
        name="Word"
        style={{
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${yaw * enter}deg) rotateX(${pitch * enter}deg)`,
          scale: 0.8 + enter * 0.2,
          opacity: enter,
        }}
      >
        {/* Extrusion: the same word, pushed back one step at a time. Drawn back
            to front so the nearest layer paints last and stays crisp. */}
        {new Array(depth).fill(0).map((_, i) => {
          const layer = depth - 1 - i; // furthest first
          const isFace = layer === 0;
          // Shade the side along its length, so the extrusion has form.
          const shade = layer / Math.max(1, depth - 1);
          return (
            <div
              key={layer}
              style={{
                position: layer === depth - 1 ? 'relative' : 'absolute',
                inset: layer === depth - 1 ? undefined : 0,
                fontSize: 300,
                lineHeight: 1.05,
                letterSpacing: '0.01em',
                whiteSpace: 'nowrap',
                color: isFace ? faceColor : shade < 0.55 ? sideColor : sideShadeColor,
                transform: `translateZ(${-layer * step}px)`,
              }}
            >
              {text}
            </div>
          );
        })}
      </Interactive.Div>

      <Interactive.Div
        name="Caption"
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 28,
          letterSpacing: '0.24em',
          marginRight: '-0.24em',
          color: theme.muted,
          marginTop: 70,
          opacity: interpolate(frame, [24, 48], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {caption}
      </Interactive.Div>

      {/* Floor reflection: a flipped, faded copy of the face only. */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          marginTop: 190,
          fontSize: 300,
          lineHeight: 1.05,
          letterSpacing: '0.01em',
          color: faceColor,
          opacity: 0.09 * enter,
          transform: `scaleY(-1) rotateY(${yaw * enter}deg)`,
          filter: 'blur(5px)',
          maskImage: 'linear-gradient(transparent 30%, black 100%)',
          WebkitMaskImage: 'linear-gradient(transparent 30%, black 100%)',
          pointerEvents: 'none',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
