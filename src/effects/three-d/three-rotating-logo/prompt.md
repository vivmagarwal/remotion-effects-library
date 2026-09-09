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
- 1920×1080, 30fps, 180 frames. Background `#06060d`, with
  `radial-gradient(ellipse at 50% 44%, #7c5cff22 0%, transparent 62%)` behind the canvas.
- `<torusKnotGeometry args={[1.35, 0.42, 220, 36]} />` with
  `<meshStandardMaterial color="#7c5cff" emissive="#2a1a6b" emissiveIntensity={0.55} metalness={0.92}
  roughness={0.18} />`.
- **Three lights, not one.** `<ambientLight intensity={0.55} />`, a white key
  `<directionalLight position={[6, 7, 5]} intensity={2.4} />`, a coloured rim
  `<directionalLight position={[-7, -3, 3]} intensity={1.3} color="#7c5cff" />`, and a magenta
  `<pointLight position={[0, 0, 5]} intensity={22} color="#ff7bd5" distance={16} />`. A high-metalness
  material has almost nothing to reflect under a single light and reads as a flat grey donut; the
  separation between key, rim and accent is what makes it look like metal.
- Entrance: the knot rises from `y = -2.6` to `0` and scales `0.2 → 1` over the first ~40 frames on
  `Easing.bezier(0.16, 1, 0.3, 1)`.

**The overlay**
- HTML text over the canvas in a separate `<AbsoluteFill>` with `pointerEvents: 'none'`: a title in
  Sora at 108px weight 700, `letter-spacing: 0.26em`, with `textShadow: '0 0 60px #7c5cff88'`, and an
  uppercase subtitle below. Bottom-anchored with 96px padding, staggered fades.

**Requirements**
- One self-contained `.tsx` file exporting `ThreeRotatingLogo`.
- Props: `title`, `subtitle`, `color`, `emissive`, `backgroundColor`, `metalness`, `roughness`.
- Load Sora via `@remotion/google-fonts/Sora`.
- Rendering 3D benefits from `Config.setChromiumOpenGlRenderer('angle')` in `remotion.config.ts`, or
  `--gl=angle` on the CLI.
