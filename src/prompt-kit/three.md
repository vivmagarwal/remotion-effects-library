## three.js / React Three Fiber

### The rule, and exactly why

**`useFrame()` is not merely discouraged.** It still *runs* — once per rendered frame. What breaks is
the clock. `<ThreeCanvas>` sets `frameloop: 'never'` while rendering and then calls
`advance(performance.now())` (verified in `@remotion/three/dist/cjs/ThreeCanvas.js:24`), and r3f
assigns that value straight to `state.clock.elapsedTime`. So inside `useFrame` the clock is wall-time
**in milliseconds** — about 1000× out of scale, and different on every run. `delta` is a wall-clock
difference and is equally meaningless.

**And it looks perfectly fine in the Studio**, where `frameloop` is still `'always'`. It only breaks
in the render. Never trust a Studio preview of a `useFrame` scene.

`useThree()` is fine. So are refs, `useMemo`, and `useLayoutEffect`.

---

### 1. `<ThreeCanvas>`

```tsx
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';

const {width, height} = useVideoConfig();
<ThreeCanvas width={width} height={height} camera={{fov: 45, position: [0, 0, 6]}}>
  …
</ThreeCanvas>
```

`npx remotion add @remotion/three` and `npm i three @react-three/fiber`, plus `npm i -D @types/three`.

`<ThreeCanvas>` takes every `<Canvas>` prop, but **`width` and `height` are required** — take them
from `useVideoConfig()`. A `<Sequence>` inside it needs `layout="none"`, because the default
absolute-fill wrapper is a DOM node and cannot exist in a WebGL scene graph.

### 2. Time as a prop, not as a clock

```tsx
const frame = useCurrentFrame();
const {fps} = useVideoConfig();

const uniforms = useMemo(
  () => ({uTime: {value: frame / fps}, uAmp: {value: amplitude}}),
  [frame, fps, amplitude],
);
<shaderMaterial vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} />
```

For imperative per-instance work — `InstancedMesh.setMatrixAt`, geometry rebuilds, attribute writes —
use **`useLayoutEffect` keyed on the frame**, never `useFrame`:

```tsx
useLayoutEffect(() => {
  const m = new THREE.Matrix4();
  for (let i = 0; i < COUNT; i++) {
    m.setPosition(x(i, frame), y(i, frame), z(i, frame));
    ref.current.setMatrixAt(i, m);
  }
  ref.current.instanceMatrix.needsUpdate = true;
}, [frame]);
```

Every per-frame call must be a **total** function of `frame`, not an accumulation. The renderer seeks
out of order; anything that adds to last frame's state will differ between runs.

### 3. drei components you cannot use

**Anything that reads the clock is broken at every setting.** `MeshDistortMaterial`,
`MeshWobbleMaterial`, `Float`, `Sparkles`, `Stars`, `CameraShake` and `Cloud` all do
`useFrame((s) => … s.clock.elapsedTime …)` internally — `speed={0}` pins time to zero and *freezes*
them rather than fixing them. `Trail` and `useAnimations` accumulate state across calls. Write your
own `shaderMaterial` instead.

Two are worse than broken: **`AccumulativeShadows`** re-runs a 40-iteration `Math.random()`
accumulation on every React render (non-deterministic by construction), and
**`PerformanceMonitor` / `AdaptiveDpr`** measure 1–20 fps under a renderer and can **silently drop
your video's resolution mid-render**.

Safe: `Instances`, `Points`, `Grid`, `Line`, `Edges`, `Environment` + `Lightformer`, `ContactShadows`,
and the shape primitives.

### 4. Traps specific to three.js

- **three.js ships no fonts.** `three/examples/fonts/…` does not exist in the npm package even though
  the export map advertises it, so `TextGeometry` needs a typeface JSON you generate and vendor
  yourself (an ASCII subset is ~36 KB). Prefer a DOM text layer over the canvas whenever the design
  allows it.
- **`three-stdlib` spells the extrusion depth `height`; the three addon spells it `depth`.** The wrong
  one is silently ignored and you get a flat glyph with no error.
- **`useOffthreadVideoTexture` and `useVideoTexture` from `@remotion/three` are `@deprecated` in
  4.0.522.** The replacement is `<Video>` from `@remotion/media` in **`headless`** mode with
  `onVideoFrame` drawing into an `OffscreenCanvas` behind a `THREE.CanvasTexture`, setting
  `texture.needsUpdate = true`. Do not reach for the deprecated hooks in new code.
- Dispose nothing between frames. Geometries and materials created in `useMemo` live for the whole
  render; creating them per frame leaks GPU memory and eventually kills the context.

### 5. Rendering

3D needs `Config.setChromiumOpenGlRenderer('angle')` in `remotion.config.ts`, or `--gl=angle` on the
CLI. Without it you get a blank frame, usually with no error. `--gl=swiftshader` throws
*"Failed to create WebGL2 context"*.

```bash
npx remotion still <id> --frame=<checkFrame> --scale=0.5 --gl=angle --output=out/check.png
```

The gallery mounts many effects at once and WebGL context limits are real — keep to one
`<ThreeCanvas>` per effect.

---

### Before you ship a 3D effect

- [ ] No `useFrame` anywhere. Every moving value derives from `useCurrentFrame()`.
- [ ] No drei component from the clock-reading list above.
- [ ] `width` and `height` on `<ThreeCanvas>` come from `useVideoConfig()`; any `<Sequence>` inside it
      has `layout="none"`.
- [ ] Geometries, materials and uniform objects are built in `useMemo`, not per frame in the body.
- [ ] The check frame was rendered **with `--gl=angle`** and looked at — a black 3D frame is the
      default failure mode, not a rare one.
