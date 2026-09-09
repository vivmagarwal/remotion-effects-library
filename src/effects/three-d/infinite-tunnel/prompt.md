Build a Remotion composition called **InfiniteTunnel**: a camera flying through a twisting tube that
loops with no seam.

**Setup**

```bash
npx remotion add @remotion/three
npm i three @react-three/fiber
npm i -D @types/three
```

**The one rule that governs all 3D in Remotion**
`useFrame()` from `@react-three/fiber` is forbidden — Remotion overwrites `state.clock.elapsedTime`
with `performance.now()`. Everything derives from `useCurrentFrame()`.

**The path**
A **closed** `CatmullRomCurve3`. Closed is what makes it infinite: the last frame lands where the
first began. Seed the wobble with `random()` from `remotion`, not `Math.random()`.

```tsx
const curve = useMemo(() => {
  const controlPoints = 14;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < controlPoints; i++) {
    const a = (i / controlPoints) * Math.PI * 2;
    pts.push(new THREE.Vector3(
      Math.cos(a) * loopRadius + (random(`tx-${i}`) - 0.5) * wobble,
      (random(`ty-${i}`) - 0.5) * wobble * 0.75,
      Math.sin(a) * loopRadius + (random(`tz-${i}`) - 0.5) * wobble,
    ));
  }
  return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5); // true = closed
}, [loopRadius, wobble]);
```

**The tube — `BackSide` is the whole trick**

```tsx
<mesh>
  <tubeGeometry args={[curve, 420, tubeRadius, 26, true]} />
  <meshStandardMaterial color={wallColor} side={THREE.BackSide} roughness={0.72} metalness={0.35} />
</mesh>
```
Default `FrontSide` culls every face you are inside of, so a camera in the tube sees **nothing**.
`side: THREE.BackSide` draws the interior. Add a second, slightly smaller tube
(`args={[curve, 420, tubeRadius * 0.985, 14, true]}`) with `<meshBasicMaterial wireframe transparent
opacity={0.14} />` for streak lines. That one needs no `side`: a wireframe material draws `gl.LINES`,
and face culling only applies to triangles — so unlike the wall above, it is visible from inside
either way.

**Flying the camera**

```tsx
const Flight: React.FC<{curve: THREE.Curve<THREE.Vector3>; t: number; roll: number}> =
  ({curve, t, roll}) => {
    const camera = useThree((s) => s.camera);
    const wrap  = ((t % 1) + 1) % 1;
    const here  = curve.getPointAt(wrap);
    const ahead = curve.getPointAt((wrap + 0.006) % 1);

    // up MUST be set before lookAt — lookAt reads it to build the orientation,
    // so rolling up rolls the camera.
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    camera.position.copy(here);
    camera.lookAt(ahead);
    return null;
  };
```
`t = (frame / durationInFrames) * laps`, `roll = Math.sin(t * Math.PI * 6) * 0.4`.
Keep `laps` a whole number: the seamless loop depends on the last frame landing where the first
began, and `laps: 1.5` leaves you halfway round the tube.
Aiming at a point *further along the curve* is what makes the tunnel bend toward you instead of
sliding sideways. Use `getPointAt` (arc-length parameterised), not `getPoint`, or the speed surges
through the curves.

**The travelling light — where the speed comes from**

```tsx
const light = curve.getPointAt((((t + 0.02) % 1) + 1) % 1);
<ambientLight intensity={0.16} />
<pointLight position={light} intensity={34} color={glowColor} distance={13} decay={1.6} />
```
The wall lights up ahead and falls into black behind. Keep ambient very low or the effect dies.

**The rings**
`rings` torus rings (default 46) threaded along the tube, at `u = i / rings`.

Their transforms do not depend on time, so precompute them in a `useMemo` — but be careful where you
draw the line. If `rel`/`glow` below end up **inside** the memo the rings freeze in place, silently
and with no error:

```tsx
const u          = i / rings;                  // 0 … 1, evenly spaced around the loop
const position   = curve.getPointAt(u);
const tangent    = curve.getTangentAt(u);
// A torus lies in the XY plane with its axis along +Z, so mapping +Z onto the
// tangent stands the ring square across the tunnel.
const quaternion = new THREE.Quaternion()
  .setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
```
Everything above goes in the memo. **Per frame, outside it**, only the brightness:
`rel = ((((u - t) % 1) + 1.5) % 1) - 0.5` is the signed distance along the loop from the camera, and
`glow = Math.max(0, 1 - Math.abs(rel) * 9) * (rel > -0.02 ? 1 : 0.15)`.
Geometry `args={[tubeRadius * 0.93, 0.022, 8, 44]}`, `<meshBasicMaterial transparent
opacity={0.12 + glow * 0.88} />`.

**The scene**
- 1920×1080, 30fps, 180 frames. Background `#03020a`.
- `<ThreeCanvas>` with explicit `width`/`height` and `camera={{fov: 88, near: 0.02, far: 60}}`.
  A wide fov exaggerates the rush; `near` must be small or the wall clips away at close range.
- Over the canvas, a vignette `<AbsoluteFill>`:
  ``radial-gradient(ellipse at 50% 50%, transparent 34%, ${backgroundColor} 92%)`` — sells the depth
  and hides the far clipping plane. Interpolate the **prop**, not the literal, or changing
  `backgroundColor` leaves a halo of the old one.

**The overlay**
Bottom-centred in its own `<AbsoluteFill>` with `pointerEvents: 'none'` and `padding-bottom: 88`.

| | |
|---|---|
| title | Sora 96px, weight 700, `letter-spacing: 0.32em` with a matching negative `margin-right`, colour `#ffffff`, `textShadow: '0 0 74px <glowColor>'`, fades in over frames 18→44 |
| subtitle | monospace 25px, colour `#9b8fc4`, `margin-top: 16`, fades in over frames 32→56 |

**Requirements**
- One self-contained `.tsx` file exporting `InfiniteTunnel`.
- Props, with defaults: `title` (`'HYPERSPACE'`), `subtitle`
  (`'TubeGeometry · BackSide · closed curve'`), `loopRadius` (9), `wobble` (4.4), `tubeRadius`
  (1.35), `rings` (46), `laps` (1), `wallColor` (`#1a1035`), `glowColor` (`#ff4fd8`),
  `backgroundColor` (`#03020a`).
- Load Sora via `@remotion/google-fonts/Sora`.
- Set `Config.setChromiumOpenGlRenderer('angle')` in `remotion.config.ts`, or pass `--gl=angle`.
