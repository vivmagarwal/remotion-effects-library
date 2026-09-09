## Remotion essentials (read this before writing any code)

You are writing **Remotion** — React that renders to video, deterministically, one frame at a time.
Remotion is at version **4.0.522**. These rules are the ones models most often get wrong; follow them exactly.

### 0. Where everything comes from

Code snippets below and in the brief are shown **without import lines**. These are the only places
anything comes from:

```tsx
// The core — everything animation-related lives here.
import {
  AbsoluteFill, Sequence, Series, Freeze, Img, Video, Audio, CanvasImage, Interactive, Solid,
  useCurrentFrame, useVideoConfig, interpolate, spring, random, staticFile, Easing,
} from 'remotion';

import {loadFont} from '@remotion/google-fonts/Inter';        // one module per typeface
import {Player, Thumbnail} from '@remotion/player';
import {TransitionSeries, springTiming, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';              // one subpath per presentation
import {duotone} from '@remotion/effects/duotone';            // one subpath per effect
import {getLength, evolvePath, getPointAtLength} from '@remotion/paths';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';

// 3D
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';   // useThree is fine; useFrame is NOT — see §12
import * as THREE from 'three';

// D3 is per-module, never a `d3` meta-package.
import {scaleLinear} from 'd3-scale';
import {arc, area, line, stack, curveBasis} from 'd3-shape';
import {hierarchy, pack, partition, treemap} from 'd3-hierarchy';
import {chord, ribbon} from 'd3-chord';
import {forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide} from 'd3-force';
import {Delaunay} from 'd3-delaunay';
```

`random`, `interpolate`, `spring` and `Easing` all come from `remotion` itself — there is no separate
animation package to install.

### 1. Animation is a pure function of the frame

```tsx
import {useCurrentFrame, useVideoConfig, interpolate, Easing} from 'remotion';

const frame = useCurrentFrame();      // 0, 1, 2, … within the current <Sequence>
const {fps, width, height, durationInFrames} = useVideoConfig();
```

Every animated value must be derived from `frame`.

**Forbidden — these silently break rendering** (the renderer screenshots frames out of order, so
anything driven by wall-clock time freezes or flickers):

- CSS `transition` or `animation`, `@keyframes`
- Tailwind animation classes (`animate-pulse`, `animate-bounce`, …)
- `setTimeout`, `setInterval`, `requestAnimationFrame`
- `useFrame()` from `@react-three/fiber`
- Any library that animates itself on a timer (GSAP tickers, Framer Motion, Lottie autoplay, CSS libs)

If a design idea comes from a CSS/JS animation library, **port the keyframes to `interpolate()`** —
read its `@keyframes` percentages, convert them to frame numbers, and drive them from `frame`.

### 2. `interpolate()` is the workhorse

```tsx
interpolate(frame, [0, 0.5 * fps], [0, 1], {
  extrapolateLeft: 'clamp',    // ← almost always want both
  extrapolateRight: 'clamp',
  easing: Easing.bezier(0.16, 1, 0.3, 1),
});
```

- Without `clamp`, values run past the range and things fly off screen. Clamp by default.
- Prefer seconds-times-fps (`1.5 * fps`) when a timing is conceptually "half a second". Raw frame
  numbers are fine — and clearer — when a brief specifies exact frames and the composition's fps is
  fixed. What matters is that a reader can tell which one a number is.
- Multiple keyframes are allowed: `interpolate(frame, [0, 30, 60, 90], [0, 1, 1, 0])`.
  For per-segment easing pass an array of `n - 1` easings.
- Easings: `Easing.bezier(a,b,c,d)` (like CSS `cubic-bezier`), `Easing.spring({damping: 200})`,
  `Easing.linear`, `Easing.ease`, `Easing.in/out/inOut(...)`.
- **Scale animations must pass `output: 'perceptual-scale'`** — linear scale looks like it decelerates
  to the eye at large values, and this compensates.
- `posterize: 3` samples only every 3rd frame — a deliberate choppy/stop-motion look.

```tsx
scale: interpolate(frame, [0, 20], [0, 1], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  easing: Easing.bezier(0.16, 1, 0.3, 1),
  output: 'perceptual-scale',
}),
```

There is also a physical `spring()` helper when you want real overshoot:

```tsx
import {spring} from 'remotion';
const s = spring({frame, fps, config: {damping: 12, stiffness: 120, mass: 1}});
```

### 3. Keep `interpolate()` inline, and use the CSS transform shorthands

Remotion Studio can read keyframes back out of your code and let the user drag them — but only when
the call sits directly in the `style` prop and uses the individual transform properties.

```tsx
// 👍
style={{
  scale: interpolate(frame, [0, 30], [0, 1], {/* … */, output: 'perceptual-scale'}),
  translate: interpolate(frame, [0, 30], ['0px 40px', '0px 0px'], {/* … */}),
  rotate: interpolate(frame, [0, 30], ['-8deg', '0deg'], {/* … */}),
  opacity: interpolate(frame, [0, 10], [0, 1], {/* … */}),
}}

// 👎 — computed away from the style prop, and a transform string
const scale = interpolate(frame, [0, 30], [0, 1]);
style={{transform: `scale(${scale})`}}
```

Note `translate` and `rotate` take **strings with units** (`'0px 40px'`, `'90deg'`); `scale` and
`opacity` take numbers. Fall back to a `transform` string only for things the shorthands cannot
express: `skew()`, `perspective()`, or an order-sensitive chain.

### 4. Layout

`<AbsoluteFill>` is a `position:absolute; inset:0` div — the base layer of nearly every scene.
It accepts `style`, and also `name` (labels it in the Studio timeline).

```tsx
import {AbsoluteFill} from 'remotion';

<AbsoluteFill style={{backgroundColor: '#08070c', justifyContent: 'center', alignItems: 'center'}}>
  …
</AbsoluteFill>
```

`<Interactive.Div>` (also `.Span`, `.H1`, `.P`, `.Svg`, `.Path`, `.Rect`, `.Circle`, …) is a drop-in
replacement for the plain element that additionally registers it in the Studio timeline so a user can
select, move and retime it. Give each one a `name`. Prefer it for the elements a user would want to
tweak; plain elements are fine for structural wrappers.

```tsx
import {Interactive} from 'remotion';
<Interactive.Div name="Title" style={{fontSize: 96}}>Hello</Interactive.Div>
```

### 5. Timing: `<Sequence>` and `<Series>`

```tsx
import {Sequence, Series} from 'remotion';

// Shift an element later in the timeline. Inside it, useCurrentFrame() restarts at 0.
<Sequence from={1 * fps} durationInFrames={2 * fps} premountFor={fps} layout="none">
  <Title />
</Sequence>

// Play things strictly one after another.
<Series>
  <Series.Sequence durationInFrames={45}><Intro /></Series.Sequence>
  <Series.Sequence durationInFrames={60} offset={-15}><Main /></Series.Sequence>
</Series>
```

- `layout="none"` skips the absolute-fill wrapper; `layout="absolute-fill"` (default) adds one.
- **Always add `premountFor`** so the subtree mounts (and its images/fonts load) before it is visible.
- Most Remotion components accept `from`, `durationInFrames` and `trimBefore` directly — including
  `<AbsoluteFill>`, `<Interactive.*>`, `<CanvasImage>`, `<Solid>`, and `<Video>`/`<Audio>`. Reach for
  a wrapping `<Sequence>` only when the component you want to delay does not.
- `trimBefore` starts a child's internal clock later (skip the first N frames of a video, for example).

### 6. Media and assets

Put files in `public/` and reference them with `staticFile('name.png')`, or pass a remote URL.

```tsx
import {Video, Audio} from '@remotion/media';                    // ← not from 'remotion'
import {staticFile, CanvasImage, AnimatedImage} from 'remotion';

<Video src={staticFile('clip.mp4')} durationInFrames={12 * fps} />
<Audio src={staticFile('music.mp3')} volume={0.4} />
<CanvasImage src={staticFile('logo.png')} style={{width: 240}} />   {/* images */}
<AnimatedImage src={staticFile('loop.gif')} />                      {/* gif/webp/apng/avif */}
```

`<Video>`/`<Audio>` come from `@remotion/media`; `staticFile`, `CanvasImage` and `AnimatedImage` come
from `remotion`. Pass a media element's natural length as `durationInFrames`.

### 7. Compositions

Register in `src/Root.tsx`. Keep `defaultProps` as an **inline object literal** — Studio writes edits
back into it, and it cannot do that through a variable, a spread, or `satisfies`.

```tsx
import {Composition} from 'remotion';

<Composition
  id="MyEffect"
  component={MyEffect}
  durationInFrames={90}
  fps={30}
  width={1920}
  height={1080}
  defaultProps={{title: 'Hello'}}
/>
```

Use `type` (not `interface`) for props so `defaultProps` type-checks. `<Still>` is the single-frame
variant. `<Folder name="Group">` groups compositions in the sidebar (letters, numbers and hyphens only).

### 8. Design for video, not for a web page

- 1920×1080 at 30fps unless told otherwise; 1080×1920 for vertical/social.
- Keep key content ≥80px from the sides and ≥100px from top and bottom at 1080px width; scale
  proportionally at other sizes. Full-bleed elements — a background field, a chart that is meant to
  run off the edge — are deliberately outside this; it governs anything that must be *read*.
- At 1080px wide: **headlines ≥84px, important supporting text ≥44px.** Video text is read at a
  glance from across a room — text sized like a web page will look tiny.
- That floor applies to text carrying the message. **Dense informational layers — chart labels, axis
  ticks, HUD readouts, code, UI recreations — are exempt**, and forcing them up to 44px destroys the
  layout. They earn their smaller size by being supported by shape, colour and position rather than
  read cold. When a brief gives explicit sizes, the brief wins: it has seen the composition.
- Decide the one thing the viewer should notice in each shot and build the frame around it.
- Load real fonts. `@remotion/google-fonts` blocks the render until the font is ready:

```tsx
import {loadFont} from '@remotion/google-fonts/Inter';
// List exactly the weights this composition uses — no more, no less.
const {fontFamily} = loadFont('normal', {weights: ['400', '700', '900'], subsets: ['latin']});
```

  **Do not copy that weight array.** It is an example, not a default; if your design calls for 800
  and you paste `['400', '700', '900']`, you get no 800 face, no TypeScript error, and a silently
  synthesised weight. The weight list is **per typeface and type-checked** — Inter has 900, Space Grotesk stops at 700, and
  passing a weight a font does not ship is a TypeScript error. Do not copy a weight array between
  fonts; check `node_modules/@remotion/google-fonts/dist/cjs/<Font>.d.ts` if unsure.

### 9. Installing packages

Use `npx remotion add <pkg>` — it picks the version matching your Remotion install. It works for
`@remotion/*`, `mediabunny`, `@mediabunny/*` and `zod`. Use plain `npm i` for anything else.

```bash
npx remotion add @remotion/transitions
```

### 10. Previewing and checking your work

```bash
npx remotion studio --no-open     # long-running; prints the preview URL
```

Visit `http://localhost:3000/<composition-id>` for a specific composition. To verify a frame without
opening a browser:

```bash
npx remotion still <composition-id> --frame=30 --scale=0.5 --output=out/check.png
```

`--frame` is zero-based, so at 30fps `--frame=30` is the one-second mark. Each `still` re-bundles the
project (~30s), so to inspect motion rather than a single moment, render the whole thing as frames in
one pass instead:

```bash
npx remotion render <composition-id> out/seq --sequence --image-format=png --scale=0.4
```

Render an actual video only when asked: `npx remotion render <composition-id>`.

### 11. Driving a third-party library

Anything with its own clock has to be put on Remotion's instead. The adapter is always the same shape —
find the library's "seek" and feed it `frame / fps`:

| library | how to drive it |
|---|---|
| Anime.js | `animation.seek((frame / fps) * 1000)` |
| Lottie | `<Lottie animationData={…} />` from `@remotion/lottie` handles it |
| GSAP | `timeline.pause().seek(frame / fps)` |
| raw CSS `@keyframes` | `animationPlayState: 'paused'` + `animationDelay: \`${-frame / fps}s\`` |
| shader/WebGL libs | pass the time in as a uniform; never read `performance.now()` |

Two rules that apply to every library:

- **Construct *mutable* objects inside the component render, not at module scope.** Remotion renders
  frames in parallel, and a shared mutable instance (a D3 projection, a simulation, a loader cache)
  gives different results depending on which frame touched it first. Idempotent module-level setup
  that returns the same value every time — `loadFont(...)`, a frozen palette, a compiled regex — is
  fine and belongs at module scope. The test is: *would calling this twice give two different
  answers, or leave something changed behind?*
- **Never fetch at render time.** Bundle the data or put it in `public/` and use `staticFile()`. A
  network call per frame is a network call several hundred times, and any failure is a broken frame.

A few library-specific traps worth knowing, all verified:

- **three.js ships no fonts.** `three/examples/fonts/…` does not exist in the npm package even though
  the export map advertises it, so `TextGeometry` needs a typeface JSON you generate and vendor
  yourself (an ASCII subset is ~36 KB). `three-stdlib` spells the extrusion depth `height`;
  the three addon spells it `depth` — the wrong one is silently ignored.
- **`new Delaunay(flatArray)` from `d3-delaunay` aliases and can mutate the array you pass it.** Use
  `Delaunay.from(...)`, or pass a copy.
- **d3-geo wants exterior rings clockwise** — the opposite of GeoJSON RFC 7946. Feed it RFC-compliant
  data unrewound and you get the whole world filled in except your country.

### 12. If you are using three.js / React Three Fiber

`<ThreeCanvas>` from `@remotion/three` takes every `<Canvas>` prop, but `width` and `height` are
**required** — take them from `useVideoConfig()`. A `<Sequence>` inside it needs `layout="none"`,
because the default absolute-fill wrapper is a DOM node and cannot exist in a WebGL scene graph.

**`useFrame()` is not merely discouraged — understand exactly what it does.** It still *runs*, once
per rendered frame. What breaks is the clock: Remotion advances the canvas with
`advance(performance.now())`, and R3F assigns that straight to `state.clock.elapsedTime`. So the
clock is wall-time **in milliseconds** — about 1000× out of scale, and different on every run. `delta`
is a wall-clock difference, equally meaningless. **It looks perfectly fine in the Studio** (where the
frameloop is still running normally) and only breaks in the render.

The safe pattern is a material whose time is a **prop**:

```tsx
const uniforms = useMemo(() => ({uTime: {value: frame / fps}, …}), [frame, fps, …]);
<shaderMaterial vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} />
```

For imperative per-instance work (`InstancedMesh.setMatrixAt`, geometry rebuilds), use
**`useLayoutEffect` keyed on the frame** — never `useFrame`.

**drei components that read the clock cannot be used, at any setting.** `MeshDistortMaterial`,
`MeshWobbleMaterial`, `Float`, `Sparkles`, `Stars`, `CameraShake` and `Cloud` all do
`useFrame((s) => … s.clock.elapsedTime …)` internally; `speed={0}` pins time to zero and freezes them
rather than fixing them. `Trail` and `useAnimations` accumulate state across calls. Write your own
`shaderMaterial` instead. (`Instances`, `Points`, `Grid`, `Line`, `Edges`, `Environment` +
`Lightformer`, `ContactShadows` and the shape primitives are all fine.) Two are worse than broken:
`AccumulativeShadows` re-runs a 40-iteration `Math.random()` accumulation on every React render, and
`PerformanceMonitor`/`AdaptiveDpr` measure 1–20 fps under a renderer and can **silently drop your
video's resolution mid-render**.

Rendering 3D wants `Config.setChromiumOpenGlRenderer('angle')` in `remotion.config.ts`, or
`--gl=angle` on the CLI.

### 13. Gotchas that will bite you

- **`translate` units must match per axis.** `['0px 110%', '0px 0px']` throws
  *"Cannot interpolate translate values with different units on axis 2"*. Write `['0px 110%', '0px 0%']`.
  The same applies to every multi-value shorthand.
- `rotate` needs a unit on both ends: `['0deg', '360deg']`, not `[0, 360]`.
- `scale` is a **number**, not a string — and wants `output: 'perceptual-scale'`.
- An element you animate with `translate` still occupies its original layout box. Wrap it in an
  `overflow: hidden` parent when you want a masked reveal.
- `useCurrentFrame()` is **local to the enclosing `<Sequence>`**. Inside `<Sequence from={60}>` it
  starts at 0 again — do not subtract the offset yourself.
- Randomness must be deterministic. Use `random(seed)` from `remotion`, never `Math.random()`, or
  particles will jitter differently on every frame of the render.
- Fonts and images must be loaded before the frame is captured. Use `@remotion/google-fonts`, and
  `delayRender()`/`continueRender()` for anything else asynchronous.
- `@remotion/effects` and `<HtmlInCanvas>` WebGL passes need `Config.setChromiumOpenGlRenderer('angle')`
  in `remotion.config.ts` (or `--gl=angle` on the CLI), or they render black.
- **Half of `@remotion/transitions` is shader-based and may not render at all.** `bookFlip`, `crossZoom`,
  `crosswarp`, `dissolve`, `dreamyZoom`, `filmBurn`, `linearBlur`, `ripple`, `swap`, `zoomBlur` and
  `zoomInOut` all draw through `<HtmlInCanvas>` + WebGL2; on an environment without the required Chrome
  support they render a **blank white frame with no error**, and `--gl=swiftshader` throws
  *"Failed to create WebGL2 context"*. `fade`, `slide`, `wipe`, `clockWipe`, `iris`, `flip`, `pushCut`
  and `none` are plain DOM and always work. Tell them apart by whether the presentation's module also
  exports a `…Shader` — and always render a **mid-transition** frame to check, because the cards on
  either side look perfect either way.
- `@remotion/effects` parameters are **range-validated at runtime and throw**, and the ranges are not
  uniform: `brightness()` takes a signed offset in `[-1, 1]` (so `1.06` throws — you want `0.06`),
  while `saturation()` and `contrast()` are multipliers where `1` is neutral and `1.5` is valid. Check
  the effect's own `.d.ts` rather than assuming one convention across the package.
- A fixed-width character slot must be sized to the **actual typeface**. A monospace-style layout at
  `width: 0.68em` looks fine for narrow glyphs and lets `M` and `W` overflow into their neighbours in
  most display faces — measure, or start around `0.92em` for a bold sans and adjust.
- Escaping bites in glyph pools and regexes: `'\/'` in a JavaScript string is just `/` — the backslash
  is silently eaten. Write `'\\/'` if you want both characters.
- The first render downloads a ~93 MB Chrome Headless Shell. Expected, one-time, do not kill it.
- On macOS below 15 the CLI prints *"Your macOS version is older than macOS 15 (Sequoia)…"*. It is a
  warning, not an error; rendering still works.
- Studio does **not** always land on port 3000 — if 3000 and 3001 are busy it silently takes 3002.
  Read the URL it prints rather than assuming.
- A **centred** line with `letter-spacing` gets that spacing appended after its last glyph too, so it
  sits half a letter-space left of true centre. Cancel it with a matching negative right margin
  (`letterSpacing: '0.28em'` → `marginRight: '-0.28em'`). Only do this when the line is centred — on a
  left-aligned element in a `space-between` row it drags the sibling instead.
- **A camera push crops the frame.** Scaling a full-bleed layer to `1.03` pushes ~1.5% off each edge —
  about 29px at 1920 wide. Anything nearer the edge than that gets clipped part-way through the shot.
  Set your safe padding from the push, not the other way round.
- A hard ease-out like `Easing.bezier(0.1, 0.9, 0.2, 1)` covers **~91% of the distance in the first
  third**. That is usually what you want, but it means "halfway through the animation" is visually
  almost finished — pick verification frames from the first quarter, not the middle.
