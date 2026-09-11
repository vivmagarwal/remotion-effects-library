Build a Remotion composition called **InstancedCubeWave**: a 64×64 field of boxes rising in a radial
wave, drawn with a single `InstancedMesh`.

**Setup**

```bash
npx remotion add @remotion/three
npm i three @react-three/fiber
npm i -D @types/three
```

**The one rule that governs all 3D in Remotion**
`useFrame()` from `@react-three/fiber` is forbidden. It still runs, but Remotion overwrites
`state.clock.elapsedTime` with `performance.now()` in milliseconds, so it desynchronises from the
timeline. Drive everything from `useCurrentFrame()`. For imperative per-instance writes use
**`useLayoutEffect` keyed on the frame**.

**The instancing**
One geometry, one material, `grid²` copies, one draw call. This lives in its own component **inside
`<ThreeCanvas>`**, taking `frame`, `fps`, `grid`, `spacing`, `speed`, `lowColor` and `highColor` as
props from the parent.

```tsx
const ref = useRef<THREE.InstancedMesh>(null);
const count = grid * grid;

// Allocate scratch ONCE. Re-allocating per instance per frame is what makes
// naive instancing slower than plain meshes.
const dummy   = useMemo(() => new THREE.Object3D(), []);
const scratch = useMemo(() => new THREE.Color(), []);
const low     = useMemo(() => new THREE.Color(lowColor), [lowColor]);
const high    = useMemo(() => new THREE.Color(highColor), [highColor]);

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

      // A ring travelling outward, plus a slower cross swell so the field never
      // looks like one repeating ripple.
      const wave = Math.sin(d * 0.62 - t * speed) * 0.92
                 + Math.sin(x * 0.24 + t * speed * 0.4) * 0.34;
      const h = 0.28 + Math.max(0, wave + 1.25) * 1.05;

      // The box is ONE UNIT TALL, so scale.y IS the height and position.y = h/2
      // stands it on the ground plane.
      dummy.position.set(x, h / 2, z);
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      // Biased low (power > 1) so the troughs actually read as lowColor. A
      // straight linear ramp puts the mean past the midpoint and the entire
      // field comes out one colour — lowColor never appears on screen.
      const lift = Math.pow(Math.min(1, (h - 0.28) / 2.62), 1.7);
      mesh.setColorAt(i, scratch.copy(low).lerp(high, lift));
      i++;
    }
  }

  // Without these the buffers never reach the GPU and the field is FROZEN.
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}, [frame, fps, grid, spacing, speed, dummy, scratch, low, high]);

return (
  // args = [geometry, material, count]. undefined for the first two lets the
  // children supply them — the standard R3F idiom.
  <instancedMesh ref={ref} args={[undefined, undefined, count]}>
    <boxGeometry args={[spacing * 0.82, 1, spacing * 0.82]} />
    <meshStandardMaterial roughness={0.34} metalness={0.28} />
  </instancedMesh>
);
```

**Close the floor, or you get a black stripe through the middle of frame**
The cubes sit on an axis-aligned grid with gaps between them. Whenever the camera looks straight
down a row you see clean through to the background — at rotation 0 that is a hard black stripe
through the dead centre of the shot, and it sweeps left as the group rotates. Two fixes together:
make the boxes fill most of their cell (`spacing * 0.82`, above) and put a plane underneath.

```tsx
<mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
  <planeGeometry args={[grid * spacing * 1.6, grid * spacing * 1.6]} />
  <meshBasicMaterial color={lowColor} />
</mesh>
```

**Moving the camera**
R3F offers no declarative way to reposition the canvas camera without drei. Use a null-rendering
child — the values still come from `frame`, so it stays pure:

```tsx
const PerspectiveRig: React.FC<{elevation: number; dolly: number}> = ({elevation, dolly}) => {
  const camera = useThree((s) => s.camera);
  camera.position.set(0, elevation, dolly);
  camera.lookAt(0, 0.8, 0);
  return null;
};
```
`elevation` interpolates `10.5 → 5.4` and `dolly` `22 → 15` over frames 0–120 on
`Easing.bezier(0.22, 1, 0.32, 1)`. Orbit by wrapping the field in
`<group rotation={[0, frame * 0.005, 0]}>` — rotating the scene is equivalent and stays declarative.

**The scene**
- 1920×1080, 30fps, 180 frames. Background `backgroundColor` (`theme.bgDeep`, `#04050a`). Pass the canvas `camera={{fov: 46}}` **only** —
  `PerspectiveRig` overwrites the position on every frame, so giving a position here is dead config
  that never appears on screen.
- `<ThreeCanvas>` needs explicit `width`/`height` from `useVideoConfig()`.
- Lights: `<ambientLight intensity={0.4} />`, `<directionalLight position={[8, 14, 6]}
  intensity={2.1} />`, and a coloured `<pointLight position={[-9, 5, -6]} intensity={70}
  color={highColor} distance={34} />`. Push that point light much past 70 and it tints the whole
  field its own colour, which undoes the height ramp.

**The overlay**
Top-left, `padding: '100px 96px'`, `pointerEvents: 'none'`.

| | |
|---|---|
| title | `fontFamily` (default `theme.display`, whose inline value is this file's Sora) 86px, weight 700, `letter-spacing: -0.02em`, colour `theme.ink`, `textShadow: '0 0 60px <highColor>66'` |
| subtitle | `theme.mono` 30px, `letter-spacing: 0.14em` with a matching negative `margin-right`, colour `highColor`, `margin-top: 18` |

Both fade **in** only and stay up: the title over frames 10→34, the subtitle over 24→48, no easing
(linear is right for a plain opacity fade). Note `textShadow` concatenates a hex alpha onto
`highColor`, so that prop has to stay a `#rrggbb` string.

**Requirements**
- One self-contained `.tsx` file exporting `InstancedCubeWave`.
- Props, with defaults: `theme` (destructured FIRST), `fontFamily` (`theme.display`), `title`
  (`'FOUR THOUSAND'`), `subtitle` (`'one draw call · instancedMesh'`), `grid` (64), `spacing`
  (0.42), `speed` (2.7), `lowColor` (`theme.bg`, house `#0a0b10`), `highColor` (`theme.pair`,
  house `#4cc9f0`), `backgroundColor` (`theme.bgDeep`, house `#04050a`).
- Load Sora via `@remotion/google-fonts/Sora`.
- Set `Config.setChromiumOpenGlRenderer('angle')` in `remotion.config.ts`, or pass `--gl=angle`.
