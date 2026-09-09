Build a Remotion composition called **DnaHelix**: a double helix whose base pairs snap in from the
bottom up while the whole thing turns.

**Setup**

```bash
npx remotion add @remotion/three
npm i three @react-three/fiber
npm i -D @types/three
```

**The one rule**
`useFrame()` is forbidden — Remotion overwrites `state.clock.elapsedTime` with `performance.now()`.
Everything comes from `useCurrentFrame()`.

**The backbones — subclass `THREE.Curve`**
This is the cleanest way to make `TubeGeometry` sweep any parametric path, and far simpler than
assembling one out of control points.

```tsx
class HelixCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    private readonly radius: number,
    private readonly height: number,
    private readonly turns: number,
    private readonly phase: number,
  ) { super(); }

  getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    const a = t * Math.PI * 2 * this.turns + this.phase;
    return target.set(
      Math.cos(a) * this.radius,
      (t - 0.5) * this.height,
      Math.sin(a) * this.radius,
    );
  }
}

const strandA = useMemo(() => new HelixCurve(radius, helixHeight, turns, 0),        [/* … */]);
const strandB = useMemo(() => new HelixCurve(radius, helixHeight, turns, Math.PI),  [/* … */]);
```
`getPoint` **must** accept and write into `target` — three reuses one vector across the sweep, and
allocating a fresh one per sample is the difference between instant and sluggish.

Render each with `<tubeGeometry args={[strand, 220, 0.09, 12, false]} />` and a
`<meshStandardMaterial color={strandColor} emissive={strandColor} emissiveIntensity={0.32}
roughness={0.28} metalness={0.6} />`.

**The rungs — quaternion alignment**
This is the general recipe for pointing anything axis-based at an arbitrary direction. A
`CylinderGeometry` runs along **+Y**, so map +Y onto the strand-to-strand vector:

```tsx
const rungs = useMemo(() =>
  new Array(basePairs).fill(0).map((_, i) => {
    const t = basePairs === 1 ? 0.5 : i / (basePairs - 1);
    const a = strandA.getPoint(t);
    const b = strandB.getPoint(t);
    const dir = b.clone().sub(a);
    const len = dir.length();

    const quaternion = new THREE.Quaternion()
      .setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());

    // Each pair is two coloured halves, like a real base pair. Seeded, so every
    // parallel render tab builds the same ladder.
    const flip = random(`bp-${i}`) < 0.5;
    return {
      i, len, quaternion,
      quarterA: a.clone().lerp(b, 0.25),   // centre of the first half
      quarterB: a.clone().lerp(b, 0.75),   // centre of the second
      colorA: flip ? pairColors[0] : pairColors[1],
      colorB: flip ? pairColors[1] : pairColors[0],
    };
  }), [basePairs, strandA, strandB, pairColors]);
```
Everything above is time-independent, so it belongs in a `useMemo`. Only the reveal animates:

```tsx
const pop = spring({
  frame: frame - (18 + r.i * 1.6),        // each rung a beat behind the last
  fps,
  config: {damping: 13, stiffness: 190, mass: 0.6},
});
if (pop <= 0.001) return null;
```
Each half is `<cylinderGeometry args={[0.055, 0.055, r.len / 2, 10]} />` at `position={r.quarterA}`
/ `r.quarterB`, `quaternion={r.quaternion}`, `scale={[pop, pop, pop]}`.

**The scene**
- 1920×1080, 30fps, 180 frames. Background `#04060e` with a
  `radial-gradient(ellipse at 50% 50%, <strandColor>1f 0%, transparent 62%)` behind the canvas.
- `<ThreeCanvas>` with explicit `width`/`height`, camera `{position: [0, 0, 12], fov: 42}`.
- Lights: `<ambientLight intensity={0.5} />`, `<directionalLight position={[5, 6, 8]}
  intensity={2.2} />`, `<pointLight position={[-6, -2, 4]} intensity={60} color={strandColor}
  distance={22} />`.
- Motion: outer `<group position={[0, drift, dolly - 12]} rotation={[0.1, frame * 0.019, 0]}>`
  where `drift = Math.sin(frame / fps / 3) * 0.22` and `dolly` interpolates `13.5 → 9.4` over
  frames 0–130. Inner `<group scale={[1, grow, 1]}>` where `grow` goes `0.02 → 1` over frames
  6–62 on `Easing.bezier(0.36, 0, 0.2, 1)` — the ladder grows out of nothing.

**The overlay**
Left-aligned, vertically centred, 108px left padding, `pointerEvents: 'none'`: Sora 92px weight 700
with `textShadow: '0 0 60px <strandColor>66'`; monospace subtitle below, `maxWidth: 520`.

**Requirements**
- One self-contained `.tsx` file exporting `DnaHelix`.
- Props: `title`, `subtitle`, `radius` (1.15), `helixHeight` (7.4), `turns` (2.6), `basePairs` (40),
  `strandColor` (`#3ea9ff`), `pairColors` (`['#ff5c7a', '#8affc1']`), `backgroundColor`.
- Load Sora via `@remotion/google-fonts/Sora`.
- Set `Config.setChromiumOpenGlRenderer('angle')` in `remotion.config.ts`, or pass `--gl=angle`.
