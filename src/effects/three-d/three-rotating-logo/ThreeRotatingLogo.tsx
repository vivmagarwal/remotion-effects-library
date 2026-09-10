import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {loadFont} from '@remotion/google-fonts/Sora';

// palette: data whole-file — a three.js lighting setup: material colour, emissive and a point light are physical quantities, not brand choices

const {fontFamily} = loadFont('normal', {weights: ['300', '700'], subsets: ['latin']});

/**
 * Three Rotating Logo
 * A metallic torus knot spinning under three lights. The rule that governs all
 * 3D in Remotion: nothing may animate itself. `useFrame()` from
 * @react-three/fiber is forbidden — every transform is computed from
 * `useCurrentFrame()`, or the render flickers.
 */

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it.
 */
type Theme = {
  readonly text: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  text: fontFamily,
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
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
  title = 'DIMENSION',
  subtitle = 'three.js, frame-driven',
  color = '#7c5cff',
  emissive = '#2a1a6b',
  backgroundColor = '#06060d',
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
        <pointLight position={[0, 0, 5]} intensity={22} color="#ff7bd5" distance={16} />

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
            fontSize: 108,
            fontWeight: 700,
            letterSpacing: '0.26em',
            color: '#f2f0ff',
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
            color: '#8b86b8',
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
