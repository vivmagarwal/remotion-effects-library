Build a Remotion composition called **GlassRefraction**: a glass torus knot turning in front of a
field of coloured bars, bending and prism-splitting everything behind it.

**Setup**

```bash
npx remotion add @remotion/three
npm i three @react-three/fiber
npm i -D @types/three
```

**The one rule**
`useFrame()` is forbidden — Remotion overwrites `state.clock.elapsedTime` with `performance.now()`.
Everything derives from `useCurrentFrame()`.

**How transmission actually works — and the mistake everyone makes**
`transmission: 1` makes `MeshPhysicalMaterial` render whatever is *behind* the object into a buffer
and refract through it. So **glass against an empty background is invisible.** If your scene is a
glass shape on a dark backdrop you will get a flat grey blob and conclude the material is broken.

Put something structured behind it. Here, 78 thin unlit bars scattered across depth. Density matters: with too few, most of what sits
behind the object is empty black, the refraction carries nothing, and the lights win — the glass
reads as milky plastic.

```tsx
const bars = useMemo(() => new Array(78).fill(0).map((_, i) => ({
  i,
  x: (random(`bx-${i}`) - 0.5) * 12,       // seeded — never Math.random()
  y: (random(`by-${i}`) - 0.5) * 8,
  z: -3.5 - random(`bz-${i}`) * 5,
  h: 0.9 + random(`bh-${i}`) * 3.4,
  w: 0.12 + random(`bw-${i}`) * 0.24,
  color: colors[i % colors.length],
  drift: 0.3 + random(`bd-${i}`) * 0.7,
})), [colors]);

<mesh position={[b.x, b.y + Math.sin(t * b.drift + b.i) * 0.4, b.z]}>
  <boxGeometry args={[b.w, b.h, b.w]} />
  {/* Unlit and bright: the backdrop is a light SOURCE for the glass, not a lit
      object in its own right. meshStandardMaterial here reads muddy. */}
  <meshBasicMaterial color={b.color} />
</mesh>
```

**The glass**

```tsx
<mesh position={[0, 0.5, 0]} rotation={[spin * 0.6, spin, spin * 0.25]} scale={scaleIn * 0.92}>
  <torusKnotGeometry args={[1.15, 0.42, 200, 40]} />
  <meshPhysicalMaterial
    transmission={1}          // 1 = fully see-through; below ~0.9 reads as frosted plastic
    ior={1.72}                // window glass 1.5 · sapphire 1.77 · diamond 2.42
    thickness={2.1}           // how deep it pretends to be → how hard it bends
    dispersion={7}            // offsets R/G/B refraction → the prism fringing
    roughness={0.03}
    metalness={0}             // MUST be 0. Metal does not transmit; any non-zero
                              // value quietly kills the effect.
    iridescence={0.32}
    iridescenceIOR={1.35}
    clearcoat={1}
    clearcoatRoughness={0.06}
    color="#ffffff"
    side={THREE.FrontSide}
  />
</mesh>
```
Note `dispersion` is a getter/setter on `MeshPhysicalMaterial` (three ≥ r166) — check it exists in
your installed version before relying on the fringing.

**The scene**
- 1920×1080, 30fps, 180 frames. Background `backgroundColor` (`theme.bgDeep`, `#04050a`).
- `<ThreeCanvas>` from `@remotion/three` needs explicit `width`/`height` from `useVideoConfig()`.
  Camera `{position: [0, 0, 6.2], fov: 46}`.
- Lights: `<ambientLight intensity={0.22} />`, `<directionalLight position={[5, 6, 8]}
  intensity={0.7} />`, `<pointLight position={[-6, 3, 4]} intensity={40} color={theme.pair}
  distance={22} />` (house `#4cc9f0`). Keep these **low** — strong white light drowns the refracted colour. The bars are unlit, so these only shape the glass itself.
- Motion: `spin` interpolates `0 → 1.1π` across the whole composition (`extrapolateRight: 'extend'`),
  applied unevenly on the three axes so the knot never appears to spin about one obvious pole.
  Scale `0.3 → 1` over frames 0–46 on `Easing.bezier(0.16, 1, 0.3, 1)`.
- `backdropColors` = `[theme.series[0], theme.series[1], theme.series[4], theme.series[3],
  theme.series[2], theme.accentOnPaper]` (house `['#ff5c39', '#4cc9f0', '#c77dff', '#ffd166',
  '#c6ff3d', '#c2410c']`).

**The overlay**
Bottom-centred, `pointerEvents: 'none'`: `fontFamily` (default `theme.display`, whose inline value
is this file's Sora) 98px weight 700, colour `theme.ink`, `letter-spacing: 0.3em` with a
matching negative `margin-right`, ``textShadow: `0 0 60px ${theme.pair}80` ``; subtitle below in
`theme.mono`, colour `theme.muted`.

**Requirements**
- One self-contained `.tsx` file exporting `GlassRefraction`.
- Props: `theme` (destructured FIRST), `fontFamily` (`theme.display`), `title`, `subtitle`,
  `transmission`, `ior`, `thickness`, `dispersion`, `roughness`, `backdropColors`,
  `backgroundColor` (`theme.bgDeep`).
- Load Sora via `@remotion/google-fonts/Sora`.
- Set `Config.setChromiumOpenGlRenderer('angle')` in `remotion.config.ts`, or pass `--gl=angle`.
