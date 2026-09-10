import {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {loadFont} from '@remotion/google-fonts/Sora';

const {fontFamily} = loadFont('normal', {weights: ['300', '700'], subsets: ['latin']});

/**
 * Instanced Cube Wave
 * Four thousand boxes rising in a radial wave — one draw call, not four
 * thousand. `<instancedMesh>` shares one geometry and one material across every
 * copy and reads a per-instance matrix out of a buffer, which is the only way a
 * field this dense stays real-time. Height and colour are pure functions of the
 * frame, so no state accumulates between renders.
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
  readonly pair: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  text: fontFamily,
  bg: '#0a0b10',
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
  /** Cubes per side. Total instances is grid².  */
  readonly grid?: number;
  readonly spacing?: number;
  /** Radians of wave travel per second. */
  readonly speed?: number;
  readonly lowColor?: string;
  readonly highColor?: string;
  readonly backgroundColor?: string;
};

const CubeField: React.FC<{
  grid: number;
  spacing: number;
  speed: number;
  lowColor: string;
  highColor: string;
  frame: number;
  fps: number;
}> = ({grid, spacing, speed, lowColor, highColor, frame, fps}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = grid * grid;

  // Scratch objects, allocated once. Re-allocating per instance per frame is
  // what makes naïve instancing slower than plain meshes.
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const scratch = useMemo(() => new THREE.Color(), []);
  const low = useMemo(() => new THREE.Color(lowColor), [lowColor]);
  const high = useMemo(() => new THREE.Color(highColor), [highColor]);

  // useLayoutEffect, not useFrame: it runs on every frame React renders, in
  // Remotion's order, before the canvas is drawn. useFrame would run off the
  // browser clock and desynchronise from the timeline.
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;

    const t = frame / fps;
    const half = (grid - 1) / 2;
    let i = 0;

    for (let gx = 0; gx < grid; gx++) {
      for (let gz = 0; gz < grid; gz++) {
        const x = (gx - half) * spacing;
        const z = (gz - half) * spacing;
        const d = Math.hypot(x, z);

        // One ring travelling out from the centre, plus a slower cross swell so
        // the field never looks like a single repeating ripple.
        const wave =
          Math.sin(d * 0.62 - t * speed) * 0.92 + Math.sin(x * 0.24 + t * speed * 0.4) * 0.34;
        const h = 0.28 + Math.max(0, wave + 1.25) * 1.05;

        // The box geometry is one unit tall, so scale.y IS the height and
        // position.y = h/2 stands it on the ground plane.
        dummy.position.set(x, h / 2, z);
        dummy.scale.set(1, h, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        // Biased low (power > 1) so the troughs actually read as lowColor.
        // A straight linear ramp leaves the mean past the midpoint and the
        // whole field comes out one colour.
        const lift = Math.pow(Math.min(1, (h - 0.28) / 2.62), 1.7);
        mesh.setColorAt(i, scratch.copy(low).lerp(high, lift));
        i++;
      }
    }

    // Without these flags the buffers never reach the GPU and the field is frozen.
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [frame, fps, grid, spacing, speed, dummy, scratch, low, high]);

  return (
    // args = [geometry, material, count]. Passing undefined for the first two
    // lets the children below supply them, which is the R3F idiom.
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[spacing * 0.82, 1, spacing * 0.82]} />
      <meshStandardMaterial roughness={0.34} metalness={0.28} />
    </instancedMesh>
  );
};

export const InstancedCubeWave: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  title = 'FOUR THOUSAND',
  subtitle = 'one draw call · instancedMesh',
  grid = 64,
  spacing = 0.42,
  speed = 2.7,
  lowColor = theme.bg,
  highColor = theme.pair,
  backgroundColor = theme.bgDeep,
}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();

  // A slow orbit around the field, plus a drop from a steeper angle at the top.
  const orbit = frame * 0.005;
  const elevation = interpolate(frame, [0, 120], [10.5, 5.4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.32, 1),
  });
  const dolly = interpolate(frame, [0, 120], [22, 15], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.32, 1),
  });

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor}}>
      <ThreeCanvas
        width={width}
        height={height}
        // Only fov is honoured here: PerspectiveRig below owns the position.
        camera={{fov: 46}}
        style={{position: 'absolute', inset: 0}}
      >
        {/* The camera is a scene object here: rotating a group around the origin
            is equivalent to orbiting, and stays declarative. */}
        <group rotation={[0, orbit, 0]}>
          <group position={[0, 0, 0]}>
            <ambientLight intensity={0.4} />
            <directionalLight position={[8, 14, 6]} intensity={2.1} />
            <pointLight position={[-9, 5, -6]} intensity={70} color={highColor} distance={34} />
            {/* Closes the gaps between columns. Without it you see straight
                through the grid to the background, which at rotation 0 is a
                hard black stripe through the centre of frame. */}
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[grid * spacing * 1.6, grid * spacing * 1.6]} />
              <meshBasicMaterial color={lowColor} />
            </mesh>
            <CubeField
              grid={grid}
              spacing={spacing}
              speed={speed}
              lowColor={lowColor}
              highColor={highColor}
              frame={frame}
              fps={fps}
            />
          </group>
        </group>
        <PerspectiveRig elevation={elevation} dolly={dolly} />
      </ThreeCanvas>

      <AbsoluteFill
        style={{
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          padding: '100px 96px',
          fontFamily,
          pointerEvents: 'none',
        }}
      >
        <Interactive.Div
          name="Title"
          style={{
            fontSize: 86,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            textShadow: `0 0 60px ${highColor}66`,
            opacity: interpolate(frame, [10, 34], [0, 1], {
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
            fontSize: 30,
            letterSpacing: '0.14em',
            marginRight: '-0.14em',
            color: highColor,
            marginTop: 18,
            opacity: interpolate(frame, [24, 48], [0, 1], {
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

/**
 * Moves the default camera. R3F gives no declarative way to reposition the
 * canvas camera without drei, so a null-rendering child writes to it. The values
 * come from `frame`, so it is still a pure function of the timeline.
 */
const PerspectiveRig: React.FC<{elevation: number; dolly: number}> = ({elevation, dolly}) => {
  const camera = useThree((s) => s.camera);
  camera.position.set(0, elevation, dolly);
  camera.lookAt(0, 0.8, 0);
  return null;
};
