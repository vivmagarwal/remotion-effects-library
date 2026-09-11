import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {loadFont} from '@remotion/google-fonts/Sora';

const {fontFamily} = loadFont('normal', {weights: ['300', '700'], subsets: ['latin']});

/**
 * Three Rotating Logo
 * A metallic torus knot spinning under three lights. The rule that governs all
 * 3D in Remotion: nothing may animate itself. `useFrame()` from
 * @react-three/fiber is forbidden — every transform is computed from
 * `useCurrentFrame()`, or the render flickers.
 */

/**
 * Darkens a `#rrggbb` by a flat factor. The self-glow of a metal has to be the
 * knot's OWN colour turned down, not a second hue — so deriving it from `color`
 * keeps the emissive doing the same job whatever accent a theme hands over.
 */
const shade = (hex: string, k: number) =>
  '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it.
 */
type Theme = {
  readonly display: string;
  readonly text: string;
  readonly ink: string;
  readonly muted: string;
  readonly bgDeep: string;
  readonly accent: string;
  readonly pair: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  display: fontFamily,
  text: fontFamily,
  ink: '#ffffff',
  muted: '#8d93a5',
  bgDeep: '#04050a',
  accent: '#ff5c39',
  pair: '#4cc9f0',
};

type Props = {
  /** CSS family for the subtitle and any inherited text. Defaults to this file's Sora, or the theme's text face. */
  readonly fontFamily?: string;
  /** CSS family for the title. Defaults to this file's own Sora, or the theme's display face. */
  readonly displayFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly title?: string;
  readonly subtitle?: string;
  readonly color?: string;
  readonly emissive?: string;
  readonly backgroundColor?: string;
  readonly metalness?: number;
  readonly roughness?: number;
};

export const ThreeRotatingLogo: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  displayFamily = theme.display,
  title = 'DIMENSION',
  subtitle = 'three.js, frame-driven',
  color = theme.accent,
  emissive = shade(color, 0.36),
  backgroundColor = theme.bgDeep,
  metalness = 0.92,
  roughness = 0.18,
}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();

  // Every transform below is a function of `frame`. Never useFrame().
  const spinY = frame * 0.026;
  const spinX = Math.sin(frame / fps / 2.4) * 0.42;

  const rise = interpolate(frame, [0, 34], [-2.6, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const scaleIn = interpolate(frame, [0, 40], [0.2, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor}}>
      <AbsoluteFill
        style={{backgroundImage: `radial-gradient(ellipse at 50% 44%, ${color}22 0%, transparent 62%)`}}
      />

      <ThreeCanvas width={width} height={height} style={{position: 'absolute', inset: 0}}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[6, 7, 5]} intensity={2.4} color="#ffffff" />
        <directionalLight position={[-7, -3, 3]} intensity={1.3} color={color} />
        <pointLight position={[0, 0, 5]} intensity={22} color={theme.pair} distance={16} />

        <mesh rotation={[spinX, spinY, 0]} position={[0, rise, 0]} scale={scaleIn}>
          <torusKnotGeometry args={[1.35, 0.42, 220, 36]} />
          <meshStandardMaterial
            color={color}
            emissive={emissive}
            emissiveIntensity={0.55}
            metalness={metalness}
            roughness={roughness}
          />
        </mesh>
      </ThreeCanvas>

      <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingBottom: 96,
          fontFamily,
          pointerEvents: 'none',
        }}
      >
        <Interactive.Div
          name="Title"
          style={{
            fontFamily: displayFamily,
            fontSize: 108,
            fontWeight: 700,
            letterSpacing: '0.26em',
            color: theme.ink,
            textShadow: `0 0 60px ${color}88`,
            opacity: interpolate(frame, [22, 46], [0, 1], {
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
            fontSize: 28,
            fontWeight: 300,
            letterSpacing: '0.32em',
            marginRight: '-0.32em',
            textTransform: 'uppercase',
            color: theme.muted,
            marginTop: 16,
            opacity: interpolate(frame, [34, 58], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {subtitle}
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
