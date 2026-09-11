import {useMemo} from 'react';
import {AbsoluteFill, Easing, Interactive, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {loadFont} from '@remotion/google-fonts/Sora';

const {fontFamily} = loadFont('normal', {weights: ['300', '700'], subsets: ['latin']});

/**
 * Glass Refraction
 * Thick glass bending the scene behind it and splitting it into colour.
 * `MeshPhysicalMaterial` with `transmission: 1` renders whatever is behind the
 * object into a buffer and refracts through it, so the effect only exists if
 * there is something back there to bend — glass against an empty background is
 * invisible. `dispersion` offsets the R, G and B refractions slightly, which is
 * what produces the prism fringing.
 */

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
/**
 * A system monospace stack. It is the inline default for the theme's `mono`
 * token, so a pasted file needs no extra font download, and a theme that names
 * a loaded monospace family replaces it.
 */
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

type Theme = {
  readonly mono: string;
  readonly muted: string;
  readonly ink: string;
  readonly display: string;
  readonly bgDeep: string;
  readonly pair: string;
  readonly series: readonly string[];
  readonly accentOnPaper: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  mono: MONO,
  muted: '#8d93a5',
  ink: '#ffffff',
  display: fontFamily,
  bgDeep: '#04050a',
  pair: '#4cc9f0',
  series: ['#ff5c39', '#4cc9f0', '#c6ff3d', '#ffd166', '#c77dff', '#8d93a5'],
  accentOnPaper: '#c2410c',
};

type Props = {
  /** CSS family for the title. Defaults to this file's own loaded Sora, or the theme's display face. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly title?: string;
  readonly subtitle?: string;
  /** 1 is fully see-through. Below ~0.9 it starts to look like frosted plastic. */
  readonly transmission?: number;
  /** Index of refraction. Window glass 1.5, sapphire 1.77, diamond 2.42. */
  readonly ior?: number;
  /** How deep the material pretends to be. Drives how hard it bends. */
  readonly thickness?: number;
  /** Prism strength — the R/G/B split. 0 is colourless glass. */
  readonly dispersion?: number;
  readonly roughness?: number;
  readonly backdropColors?: readonly string[];
  readonly backgroundColor?: string;
};

/**
 * The thing being refracted. Glass needs structure behind it — a flat colour
 * gives you a flat grey blob, because there is no detail for it to distort.
 */
const Backdrop: React.FC<{colors: readonly string[]; t: number}> = ({colors, t}) => {
  const bars = useMemo(
    () =>
      new Array(78).fill(0).map((_, i) => ({
        i,
        x: (random(`bx-${i}`) - 0.5) * 12,
        y: (random(`by-${i}`) - 0.5) * 8,
        z: -3.5 - random(`bz-${i}`) * 5,
        h: 0.9 + random(`bh-${i}`) * 3.4,
        w: 0.12 + random(`bw-${i}`) * 0.24,
        color: colors[i % colors.length],
        drift: 0.3 + random(`bd-${i}`) * 0.7,
      })),
    [colors],
  );

  return (
    <group>
      {bars.map((b) => (
        <mesh key={b.i} position={[b.x, b.y + Math.sin(t * b.drift + b.i) * 0.4, b.z]}>
          <boxGeometry args={[b.w, b.h, b.w]} />
          {/* Unlit and bright: the backdrop is a light source for the glass, not
              a lit object in its own right. */}
          <meshBasicMaterial color={b.color} />
        </mesh>
      ))}
    </group>
  );
};

export const GlassRefraction: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.display,
  title = 'REFRACT',
  subtitle = 'MeshPhysicalMaterial · transmission + dispersion',
  transmission = 1,
  ior = 1.72,
  thickness = 2.1,
  dispersion = 7,
  roughness = 0.03,
  backdropColors = [theme.series[0], theme.series[1], theme.series[4], theme.series[3], theme.series[2], theme.accentOnPaper],
  backgroundColor = theme.bgDeep,
}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();

  const t = frame / fps;

  const spin = interpolate(frame, [0, 180], [0, Math.PI * 1.1], {extrapolateRight: 'extend'});
  const scaleIn = interpolate(frame, [0, 46], [0.3, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor}}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{position: [0, 0, 6.2], fov: 46}}
        style={{position: 'absolute', inset: 0}}
      >
        <ambientLight intensity={0.22} />
        <directionalLight position={[5, 6, 8]} intensity={0.7} />
        <pointLight position={[-6, 3, 4]} intensity={40} color={theme.pair} distance={22} />

        <Backdrop colors={backdropColors} t={t} />

        <mesh position={[0, 0.5, 0]} rotation={[spin * 0.6, spin, spin * 0.25]} scale={scaleIn * 0.92}>
          <torusKnotGeometry args={[1.15, 0.42, 200, 40]} />
          {/* transmission needs `metalness: 0` — metal does not transmit, and a
              non-zero value quietly kills the effect. */}
          <meshPhysicalMaterial
            transmission={transmission}
            ior={ior}
            thickness={thickness}
            dispersion={dispersion}
            roughness={roughness}
            metalness={0}
            iridescence={0.32}
            iridescenceIOR={1.35}
            clearcoat={1}
            clearcoatRoughness={0.04}
            color="#ffffff"
            side={THREE.FrontSide}
          />
        </mesh>
      </ThreeCanvas>

      <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingBottom: 88,
          fontFamily,
          pointerEvents: 'none',
        }}
      >
        <Interactive.Div
          name="Title"
          style={{
            fontSize: 98,
            fontWeight: 700,
            letterSpacing: '0.3em',
            marginRight: '-0.3em',
            color: theme.ink,
            textShadow: `0 0 60px ${theme.pair}80`,
            opacity: interpolate(frame, [24, 50], [0, 1], {
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
            fontFamily: theme.mono,
            fontSize: 24,
            color: theme.muted,
            textShadow: '0 2px 14px rgba(0,0,0,0.9)',
            marginTop: 16,
            opacity: interpolate(frame, [38, 62], [0, 1], {
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
