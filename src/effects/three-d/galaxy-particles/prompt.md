Build a Remotion composition called **GalaxyParticles**: a spiral galaxy of 30,000 points that tips
and turns beneath a fixed camera.

**Setup**

```bash
npx remotion add @remotion/three
npm i three @react-three/fiber
npm i -D @types/three
```

**The one rule that governs all 3D in Remotion**
`useFrame()` from `@react-three/fiber` is forbidden. It still *runs* under Remotion, but
`state.clock.elapsedTime` is overwritten with `performance.now()` in milliseconds, so anything
reading the clock is both ~1000× out of scale and non-deterministic. Every transform must be a pure
function of `useCurrentFrame()`.

**Building the cloud — the part that actually matters**
Build the point cloud **once** in a `useMemo`, using `random(seed)` from `remotion`, never
`Math.random()`. Remotion hands frames to parallel browser tabs by work-stealing, so an unseeded
draw inside a `useMemo` gives a *different galaxy on every frame*, not merely a seam between chunks.

```tsx
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);
const cIn = new THREE.Color(insideColor);
const cOut = new THREE.Color(outsideColor);
const mixed = new THREE.Color();

for (let i = 0; i < count; i++) {
  const i3 = i * 3;

  // Power > 1 biases stars inward — this is what gives it a bright dense core
  // instead of an evenly grey disc.
  const r = Math.pow(random(`r-${i}`), 1.6) * radius;
  const branchAngle = ((i % branches) / branches) * Math.PI * 2;
  const spinAngle = r * spin;               // twist grows with radius → a spiral

  // Cubing the scatter clusters stars tight against the arm and lets a few
  // stragglers drift out. A FLAT random offset just blurs the arms away.
  const stray = (key: string, scale: number) => {
    const sign = random(`s-${key}`) < 0.5 ? 1 : -1;
    return Math.pow(random(key), 3) * sign * randomness * r * scale;
  };

  positions[i3]     = Math.cos(branchAngle + spinAngle) * r + stray(`x-${i}`, 1);
  positions[i3 + 1] = stray(`y-${i}`, 0.32);          // thin disc
  positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + stray(`z-${i}`, 1);

  // Power < 1 biases the ramp inward so the cold colour reaches the core
  // region. A LINEAR ramp leaves the whole visible galaxy warm.
  mixed.copy(cIn).lerp(cOut, Math.pow(Math.min(1, r / radius), 0.55));
  colors[i3] = mixed.r; colors[i3 + 1] = mixed.g; colors[i3 + 2] = mixed.b;
}

const g = new THREE.BufferGeometry();
g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
```

**The material**

```tsx
<points geometry={geometry}>
  <pointsMaterial
    size={0.034}
    sizeAttenuation
    vertexColors
    transparent
    opacity={0.6}
    depthWrite={false}
    blending={THREE.AdditiveBlending}
  />
</points>
```
`AdditiveBlending` is what makes the core glow — overlapping points sum toward white.
`depthWrite={false}` is not optional: with it on, points punch holes in each other and the cloud
looks moth-eaten.

**The scene**
- 1920×1080, 30fps, 180 frames. Background `backgroundColor` (`theme.bgDeep`, `#04050a`).
- `<ThreeCanvas>` from `@remotion/three` **must** be given explicit `width`/`height` from
  `useVideoConfig()`. Camera `{position: [0, 3.4, 7.2], fov: 52}`.
- The camera never moves. Wrap the points in a `<group>` and animate that instead:
  `rotation={[tilt, frame * 0.0042, 0]}` where `tilt` interpolates `1.32 → 0.42` over frames 0–130
  on `Easing.bezier(0.22, 1, 0.32, 1)` — the galaxy flattens out toward the viewer. Scale `0.55 → 1`
  over the first 48 frames.
- Over the canvas, an `<AbsoluteFill>` with
  `backgroundImage: 'radial-gradient(circle at 50% 46%, <insideColor>2e 0%, transparent 42%)'` and
  `mixBlendMode: 'screen'` — a DOM glow, cheaper and more controllable than a bloom pass, and it
  keeps the render deterministic.

**The overlay**
Bottom-centred, `pointerEvents: 'none'`: title in `fontFamily` (default `theme.display`, whose
inline value is this file's Sora) 100px weight 700, colour `theme.ink`, `letter-spacing: 0.3em`
with a matching `margin-right: -0.3em`, `textShadow: '0 0 70px <outsideColor>aa'`; a subtitle below
in `theme.mono`, colour `theme.body`. Staggered fades at frames 26–52 and 40–66.

**Requirements**
- One self-contained `.tsx` file exporting `GalaxyParticles`.
- Props: `theme` (destructured FIRST), `fontFamily` (`theme.display`), `title`, `subtitle`, `count`,
  `branches`, `radius`, `spin`, `randomness`, `insideColor`, `outsideColor`, `backgroundColor`.
  Defaults: 30000, 5 branches, radius 5.2, spin 0.72, randomness 0.34, `insideColor`
  `theme.series[3]` (house `#ffd166`) → `outsideColor` `theme.pair` (house `#4cc9f0`),
  `backgroundColor` `theme.bgDeep`.
- Load Sora via `@remotion/google-fonts/Sora`.
- Set `Config.setChromiumOpenGlRenderer('angle')` in `remotion.config.ts`, or pass `--gl=angle`.
