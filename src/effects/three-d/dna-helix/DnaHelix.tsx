import {useMemo} from 'react';
import {AbsoluteFill, Easing, Interactive, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {loadFont} from '@remotion/google-fonts/Sora';

const {fontFamily} = loadFont('normal', {weights: ['300', '700'], subsets: ['latin']});

/**
 * DNA Helix
 * Two backbones and a ladder of base pairs. The backbones are `TubeGeometry`
 * built on a custom `THREE.Curve` subclass — the cleanest way to get a smooth
 * swept tube along any parametric path. Each rung is aligned with a quaternion
 * derived from the vector between the two strands, which is the general recipe
 * for pointing a cylinder at an arbitrary direction.
 */

/** A parametric helix. Subclassing Curve is what lets TubeGeometry sweep it. */
class HelixCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    private readonly radius: number,
    private readonly height: number,
    private readonly turns: number,
    private readonly phase: number,
  ) {
    super();
  }

  getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    const a = t * Math.PI * 2 * this.turns + this.phase;
    return target.set(
      Math.cos(a) * this.radius,
      (t - 0.5) * this.height,
      Math.sin(a) * this.radius,
    );
  }
}

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly text: string;
  readonly bgDeep: string;
  readonly pair: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  text: fontFamily,
  bgDeep: '#04050a',
  pair: '#4cc9f0',
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly title?: string;
  readonly subtitle?: string;
  readonly radius?: number;
  readonly helixHeight?: number;
  readonly turns?: number;
  /** Number of rungs on the ladder. */
  readonly basePairs?: number;
  readonly strandColor?: string;
  /** The two base-pair colours, picked per rung from a seeded draw. */
  readonly pairColors?: readonly [string, string];
  readonly backgroundColor?: string;
};

export const DnaHelix: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  title = 'SEQUENCE',
  subtitle = 'custom Curve · quaternion alignment',
  radius = 1.15,
  helixHeight = 7.4,
  turns = 2.6,
  basePairs = 40,
  strandColor = theme.pair,
  pairColors = ['#ff5c39', '#c6ff3d'],
  backgroundColor = theme.bgDeep,
}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();

  const strandA = useMemo(
    () => new HelixCurve(radius, helixHeight, turns, 0),
    [radius, helixHeight, turns],
  );
  const strandB = useMemo(
    () => new HelixCurve(radius, helixHeight, turns, Math.PI),
    [radius, helixHeight, turns],
  );

  // Every rung's geometry is static; only its reveal depends on the frame.
  const rungs = useMemo(
    () =>
      new Array(basePairs).fill(0).map((_, i) => {
        const t = basePairs === 1 ? 0.5 : i / (basePairs - 1);
        const a = strandA.getPoint(t);
        const b = strandB.getPoint(t);
        const mid = a.clone().lerp(b, 0.5);
        const dir = b.clone().sub(a);
        const len = dir.length();

        // A cylinder points along +Y. Rotating +Y onto the strand-to-strand
        // vector is the one line that aims it, whatever the direction.
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          dir.clone().normalize(),
        );

        // Each pair is two halves in different colours, like a real base pair.
        const flip = random(`bp-${i}`) < 0.5;
        return {
          i,
          len,
          quaternion,
          mid,
          quarterA: a.clone().lerp(b, 0.25),
          quarterB: a.clone().lerp(b, 0.75),
          colorA: flip ? pairColors[0] : pairColors[1],
          colorB: flip ? pairColors[1] : pairColors[0],
        };
      }),
    [basePairs, strandA, strandB, pairColors],
  );

  const spin = frame * 0.019;
  const drift = Math.sin(frame / fps / 3) * 0.22;
  const dolly = interpolate(frame, [0, 130], [13.5, 9.4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.32, 1),
  });

  // The backbones draw themselves on by growing upward out of nothing.
  const grow = interpolate(frame, [6, 62], [0.02, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.36, 0, 0.2, 1),
  });

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor}}>
      <AbsoluteFill
        style={{backgroundImage: `radial-gradient(ellipse at 50% 50%, ${strandColor}1f 0%, transparent 62%)`}}
      />

      <ThreeCanvas
        width={width}
        height={height}
        camera={{position: [0, 0, 12], fov: 42}}
        style={{position: 'absolute', inset: 0}}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 6, 8]} intensity={2.2} />
        <pointLight position={[-6, -2, 4]} intensity={60} color={strandColor} distance={22} />

        <group position={[0, drift, dolly - 12]} rotation={[0.1, spin, 0]}>
          {/* scale-y grows the whole ladder out of the floor. */}
          <group scale={[1, grow, 1]}>
            {[strandA, strandB].map((strand, s) => (
              <mesh key={s}>
                <tubeGeometry args={[strand, 220, 0.09, 12, false]} />
                <meshStandardMaterial
                  color={strandColor}
                  emissive={strandColor}
                  emissiveIntensity={0.32}
                  roughness={0.28}
                  metalness={0.6}
                />
              </mesh>
            ))}

            {rungs.map((r) => {
              // Rungs snap in from the bottom up, each one a beat behind the last.
              const pop = spring({
                frame: frame - (18 + r.i * 1.6),
                fps,
                config: {damping: 13, stiffness: 190, mass: 0.6},
              });
              if (pop <= 0.001) return null;
              return (
                <group key={r.i}>
                  <mesh position={r.quarterA} quaternion={r.quaternion} scale={[pop, pop, pop]}>
                    <cylinderGeometry args={[0.055, 0.055, r.len / 2, 10]} />
                    <meshStandardMaterial
                      color={r.colorA}
                      emissive={r.colorA}
                      emissiveIntensity={0.3}
                      roughness={0.4}
                    />
                  </mesh>
                  <mesh position={r.quarterB} quaternion={r.quaternion} scale={[pop, pop, pop]}>
                    <cylinderGeometry args={[0.055, 0.055, r.len / 2, 10]} />
                    <meshStandardMaterial
                      color={r.colorB}
                      emissive={r.colorB}
                      emissiveIntensity={0.3}
                      roughness={0.4}
                    />
                  </mesh>
                </group>
              );
            })}
          </group>
        </group>
      </ThreeCanvas>

      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '0 0 0 108px',
          fontFamily,
          pointerEvents: 'none',
        }}
      >
        <Interactive.Div
          name="Title"
          style={{
            fontSize: 92,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            textShadow: `0 0 60px ${strandColor}66`,
            opacity: interpolate(frame, [40, 66], [0, 1], {
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
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 24,
            color: '#8d93a5',
            marginTop: 14,
            maxWidth: 520,
            opacity: interpolate(frame, [54, 78], [0, 1], {
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
