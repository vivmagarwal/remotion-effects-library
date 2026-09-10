import {useMemo} from 'react';
import {AbsoluteFill, Interactive, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {loadFont} from '@remotion/google-fonts/Sora';

const {fontFamily} = loadFont('normal', {weights: ['300', '700'], subsets: ['latin']});

/**
 * Infinite Tunnel
 * A camera flying through a closed twisting tube. Two ideas carry it: the tube
 * is a `TubeGeometry` built on a closed `CatmullRomCurve3` and rendered
 * BackSide so you see its inside, and the camera is positioned by sampling that
 * same curve. Because the curve is closed, the flight loops forever with no
 * seam — frame 0 and the last frame are the same place.
 */

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly text: string;
  readonly bg: string;
  readonly bgDeep: string;
  readonly series: readonly string[];
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  text: fontFamily,
  bg: '#0a0b10',
  bgDeep: '#04050a',
  series: ['#ff5c39', '#4cc9f0', '#c6ff3d', '#ffd166', '#c77dff', '#8d93a5'],
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly title?: string;
  readonly subtitle?: string;
  /** Radius of the loop the tunnel is bent around. */
  readonly loopRadius?: number;
  /** How much the loop wanders off a perfect circle. */
  readonly wobble?: number;
  readonly tubeRadius?: number;
  /** Number of glowing rings threaded along the tube. */
  readonly rings?: number;
  /** Loops completed over the whole composition. */
  readonly laps?: number;
  readonly wallColor?: string;
  readonly glowColor?: string;
  readonly backgroundColor?: string;
};

/** Positions the default camera on the curve. Pure function of `t`. */
const Flight: React.FC<{curve: THREE.Curve<THREE.Vector3>; t: number; roll: number}> = ({
  curve,
  t,
  roll,
}) => {
  const camera = useThree((s) => s.camera);
  const wrap = ((t % 1) + 1) % 1;
  const here = curve.getPointAt(wrap);
  // Looking a short way further along the curve is what makes the tunnel bend
  // toward you instead of sliding sideways.
  const ahead = curve.getPointAt((wrap + 0.006) % 1);

  // The up-vector must be set before lookAt; lookAt reads it to build the
  // orientation, so rolling it rolls the camera.
  camera.up.set(Math.sin(roll), Math.cos(roll), 0);
  camera.position.copy(here);
  camera.lookAt(ahead);
  return null;
};

export const InfiniteTunnel: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  title = 'HYPERSPACE',
  subtitle = 'TubeGeometry · BackSide · closed curve',
  loopRadius = 9,
  wobble = 4.4,
  tubeRadius = 1.35,
  rings = 46,
  laps = 1,
  wallColor = theme.bg,
  glowColor = theme.series[4],
  backgroundColor = theme.bgDeep,
}) => {
  const frame = useCurrentFrame();
  const {width, height, durationInFrames} = useVideoConfig();

  // The path. Seeded, so every parallel render tab builds the same tunnel.
  const curve = useMemo(() => {
    const controlPoints = 14;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < controlPoints; i++) {
      const a = (i / controlPoints) * Math.PI * 2;
      pts.push(
        new THREE.Vector3(
          Math.cos(a) * loopRadius + (random(`tx-${i}`) - 0.5) * wobble,
          (random(`ty-${i}`) - 0.5) * wobble * 0.75,
          Math.sin(a) * loopRadius + (random(`tz-${i}`) - 0.5) * wobble,
        ),
      );
    }
    // `true` closes the loop — that is the whole trick behind "infinite".
    return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
  }, [loopRadius, wobble]);

  // Ring transforms are static; only their colour depends on the frame.
  const ringFrames = useMemo(
    () =>
      new Array(rings).fill(0).map((_, i) => {
        const u = i / rings;
        const position = curve.getPointAt(u);
        const tangent = curve.getTangentAt(u);
        // A torus lies in the XY plane with its axis along +Z, so aligning +Z
        // to the tangent stands the ring square across the tunnel.
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          tangent,
        );
        return {u, position, quaternion};
      }),
    [curve, rings],
  );

  const t = (frame / durationInFrames) * laps;
  const roll = Math.sin(t * Math.PI * 6) * 0.4;
  const light = curve.getPointAt((((t + 0.02) % 1) + 1) % 1);

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor}}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{fov: 88, near: 0.02, far: 60}}
        style={{position: 'absolute', inset: 0}}
      >
        <Flight curve={curve} t={t} roll={roll} />

        <ambientLight intensity={0.16} />
        {/* Travels with the camera, so the wall lights up ahead and falls away
            into black behind — the entire sense of speed comes from this. */}
        <pointLight position={light} intensity={34} color={glowColor} distance={13} decay={1.6} />

        {/* The wall. BackSide means only the inside faces are drawn, so the
            camera can sit inside without the tube culling away. */}
        <mesh>
          <tubeGeometry args={[curve, 420, tubeRadius, 26, true]} />
          <meshStandardMaterial color={wallColor} side={THREE.BackSide} roughness={0.72} metalness={0.35} />
        </mesh>

        {/* A wireframe skin just inside the wall, for streak lines. */}
        <mesh>
          <tubeGeometry args={[curve, 420, tubeRadius * 0.985, 14, true]} />
          <meshBasicMaterial
            color={glowColor}
            side={THREE.BackSide}
            wireframe
            transparent
            opacity={0.14}
          />
        </mesh>

        {ringFrames.map((r, i) => {
          // Distance along the loop from the camera, wrapped to [-0.5, 0.5].
          const rel = ((((r.u - t) % 1) + 1.5) % 1) - 0.5;
          // Bright just ahead of the camera, dark once passed.
          const glow = Math.max(0, 1 - Math.abs(rel) * 9) * (rel > -0.02 ? 1 : 0.15);
          return (
            <mesh key={i} position={r.position} quaternion={r.quaternion}>
              <torusGeometry args={[tubeRadius * 0.93, 0.022, 8, 44]} />
              <meshBasicMaterial color={glowColor} transparent opacity={0.12 + glow * 0.88} />
            </mesh>
          );
        })}
      </ThreeCanvas>

      {/* Vignette sells the depth and hides the far clipping plane. */}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(ellipse at 50% 50%, transparent 34%, ${backgroundColor} 92%)`,
          pointerEvents: 'none',
        }}
      />

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
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: '0.32em',
            marginRight: '-0.32em',
            color: '#ffffff',
            textShadow: `0 0 74px ${glowColor}`,
            opacity: interpolate(frame, [18, 44], [0, 1], {
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
            fontSize: 25,
            color: '#8d93a5',
            marginTop: 16,
            opacity: interpolate(frame, [32, 56], [0, 1], {
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
