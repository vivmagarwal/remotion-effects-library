Build a Remotion composition called **ThreeRotatingLogo**: a metallic torus knot spinning under
studio lighting, using React Three Fiber.

**Setup**

```bash
npx remotion add @remotion/three
npm i three @react-three/fiber
npm i -D @types/three
```

**The one rule that governs all 3D in Remotion**
**`useFrame()` from `@react-three/fiber` is forbidden.** So is any self-animating shader, mixer or
model clip. They advance on the browser's clock, and Remotion renders frames out of order and in
parallel — so anything time-driven flickers or freezes in the output. Every transform must be a pure
function of `useCurrentFrame()`:

```tsx
const frame = useCurrentFrame();
const spinY = frame * 0.026;
const spinX = Math.sin(frame / fps / 2.4) * 0.42;
<mesh rotation={[spinX, spinY, 0]} position={[0, rise, 0]} scale={scaleIn}>
```

**The canvas**
- `<ThreeCanvas>` from `@remotion/three` **must** be given explicit `width` and `height` — take them
  from `useVideoConfig()`. It will not size itself.
- If you put a `<Sequence>` inside `<ThreeCanvas>`, it must have `layout="none"` — the default
  absolute-fill wrapper is a DOM node and cannot exist inside a WebGL scene graph.

**The scene**
- 1920×1080, 30fps, 180 frames. Background `backgroundColor` (`theme.bgDeep`, `#04050a`), with
  ``radial-gradient(ellipse at 50% 44%, ${color}22 0%, transparent 62%)`` behind the canvas.
- `<torusKnotGeometry args={[1.35, 0.42, 220, 36]} />` with
  `<meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.55}
  metalness={0.92} roughness={0.18} />`, where `color` defaults to `theme.accent` (house `#ff5c39`).
- The emissive is the knot's OWN colour turned down, never a second hue — derive it so the self-glow
  does the same job whatever accent a theme hands over. `emissive` defaults to `shade(color, 0.36)`:

  ```tsx
  const shade = (hex: string, k: number) =>
    '#' + [1, 3, 5]
      .map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0'))
      .join('');
  ```
  A default parameter may read one declared before it, so `emissive = shade(color, 0.36)` works as
  long as `color` comes first.
- **Three lights, not one.** `<ambientLight intensity={0.55} />`, a white key
  `<directionalLight position={[6, 7, 5]} intensity={2.4} color="#ffffff" />`, a rim in the knot's
  own colour `<directionalLight position={[-7, -3, 3]} intensity={1.3} color={color} />`, and a cool
  `<pointLight position={[0, 0, 5]} intensity={22} color={theme.pair} distance={16} />` (house
  `#4cc9f0`). A high-metalness material has almost nothing to reflect under a single light and reads
  as a flat grey donut; the separation between key, rim and accent is what makes it look like metal.
- Entrance: the knot rises from `y = -2.6` to `0` and scales `0.2 → 1` over the first ~40 frames on
  `Easing.bezier(0.16, 1, 0.3, 1)`.

**The overlay**
- HTML text over the canvas in a separate `<AbsoluteFill>` with `pointerEvents: 'none'`: a title in
  `displayFamily` (default `theme.display`, whose inline value is this file's Sora) at 108px weight
  700, `letter-spacing: 0.26em`, colour `theme.ink`, with ``textShadow: `0 0 60px ${color}88` ``, and
  an uppercase subtitle below in `fontFamily` (default `theme.text`), colour `theme.muted`
  (`#8d93a5`). Bottom-anchored with 96px padding, staggered fades.

**Requirements**
- One self-contained `.tsx` file exporting `ThreeRotatingLogo`.
- Props: `theme` (destructured FIRST), `fontFamily` (`theme.text`), `displayFamily`
  (`theme.display`), `title`, `subtitle`, `color` (`theme.accent`), `emissive`
  (`shade(color, 0.36)`), `backgroundColor` (`theme.bgDeep`), `metalness`, `roughness`.
- Load Sora via `@remotion/google-fonts/Sora`.
- Rendering 3D benefits from `Config.setChromiumOpenGlRenderer('angle')` in `remotion.config.ts`, or
  `--gl=angle` on the CLI.
