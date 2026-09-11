## Diagrams with edododraw

`edododraw` turns a small text DSL into hand-drawn-style SVG diagrams. It already has a frame-driven
path built for exactly this: `SvgRenderer{static: true}` disables **all** wall-clock CSS — visibility
transitions, reveal animations, and the animated-arrow keyframe overlay is not even emitted — so any
captured frame is final rather than mid-transition.

Everything below was verified against the published **`edododraw@0.16.2`** (`npm view edododraw
dist-tags` → `latest: 0.16.2`); the `.d.ts` quotes are from `dist-lib/engine/`. Check
`node_modules/edododraw/dist-lib/engine/render/svgRenderer.d.ts` against whatever version actually
installs before relying on a method name.

**Use 0.16.2 or newer** — 0.15.0 is the floor for the reason below. Earlier versions declare `sideEffects` globs that match no shipped
JavaScript — every line of real JS is in `dist-lib/index.js` and `dist-lib/chunks/*.js`, and the globs
pointed at `**/viz/generators/*.ts`, where the published build has only `.d.ts` files. The package
therefore looked side-effect-free, and the visualization registry is populated **by import side
effect**, so a production bundler legally removed the registrations. An unregistered `viz` type
**warns rather than errors**: `viz clouds { … }` compiled to a scene with zero nodes and rendered a
clean blank frame. A dev server was fine, server-side stills were fine, and only the production build
tree-shook. 0.15.0 also makes `CLASSIC_PRESET` smooth by default — rough.js perturbs geometry in
*world* units, so a camera push magnifies the jitter and the stroke width together; the old values
are still there as `CLASSIC_ROUGH_PRESET`.

**0.16.2 is what a video host wants.** `strokeScale` sets line weight on the renderer (under
`nonScalingStroke` a preset's 1.8px is 1.8 *screen* px, a hairline at 1080p); pinned ellipses close
without rough.js's trailing notch; icon strokes stop inverting with glyph size; every stroke has round
caps and joins; label colours hold 4.5:1; `cameraForBBox` takes `padX`/`padY`; and every viz element
carries `data-viz-role` (the block title is `title`), so a host can draw the title first and each
item's label with its own box.

**Install with `npm i edododraw --omit=optional`.** The default install pulls
`@excalidraw/mermaid-to-excalidraw` (an `optionalDependency`, which npm installs by default) and with
it mermaid → d3 → cytoscape → katex: measured **122 packages / 66 MB** versus **8 packages / 4.2 MB**.
You only need the extra tree if you are importing Mermaid source.

### The four rules

1. **Compile once in `useMemo`.** `compileEdd(source)` is pure, DOM-free and synchronous (8–18 ms for
   a 12-node scene). Never per frame.
2. **Mount and paint once in `useLayoutEffect` keyed on the scene.** `renderer.render(scene)` is
   8–30 ms. Never per frame.
3. **Per frame, call only `applyVisibility`, `applyCamera`, `setRevealProgress` and
   `AnnotationLayer.render`.** Measured: `applyCamera` ≈ 0.003 ms, `applyVisibility` ≈ 0.21 ms,
   `setRevealProgress` ≈ 0.27 ms.
4. **Never touch `CameraController` or `TimelinePlayer`** — they are `requestAnimationFrame` +
   `performance.now()`. Use the pure trio `stepStateAt` / `resolveCameraDirective` / `mixCameras`.

---

### 1. The component skeleton

```tsx
import {useLayoutEffect, useMemo, useRef, useState} from 'react';
import {AnnotationLayer, SvgRenderer, compileEdd, easingByName, mixCameras,
        resolveCameraDirective, stepStateAt} from 'edododraw';

const scene = useMemo(() => {
  const {scene, diagnostics} = compileEdd(source);
  if (diagnostics.hasErrors) throw new Error('edd compile failed');
  return scene;
}, [source]);

const hostRef = useRef<HTMLDivElement>(null);
const gfx = useRef<{r: SvgRenderer; a: AnnotationLayer} | null>(null);
const {delayRender, continueRender, cancelRender} = useDelayRender();
const [handle] = useState(() => delayRender('edododraw font'));

useLayoutEffect(() => {
  const r = new SvgRenderer(hostRef.current!, {static: true});   // ← static is not optional
  r.mount();
  r.render(scene);
  r.measure();
  const a = new AnnotationLayer(r);
  gfx.current = {r, a};
  // ensureEngineStyles() injects Excalifont as a base64 @font-face fire-and-forget.
  // Screenshot before it decodes and every text metric shifts.
  document.fonts.load('32px Excalifont').then(() => continueRender(handle)).catch(cancelRender);
  return () => {r.destroy(); gfx.current = null;};
}, [scene, handle]);

useLayoutEffect(() => {
  const g = gfx.current;
  if (!g) return;
  const vp = {w: width, h: height};

  // frame -> beat index + local progress
  let acc = 0, i = -1, local = 0;
  for (let b = 0; b < BEATS.length; b++) {
    if (frame < acc + BEATS[b]) {i = b; local = frame - acc; break;}
    acc += BEATS[b]; i = b; local = BEATS[b];
  }
  const state = stepStateAt(scene, i);
  const prev  = stepStateAt(scene, Math.max(-1, i - 1));

  g.r.applyVisibility(new Set(state.hidden));
  g.a.render(scene, state.annotations, false);   // `false` = no CSS reveal

  const to   = resolveCameraDirective(scene, state.effectiveCamera, vp);
  const from = resolveCameraDirective(scene, prev.effectiveCamera, vp);
  const t = interpolate(local, [0, MOVE_FRAMES], [0, 1],
                        {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  g.r.applyCamera(mixCameras(from, to, easingByName('ease-in-out')(t)));
}, [frame, scene, width, height]);

return <AbsoluteFill style={{backgroundColor: scene.theme.background}}>
  <div ref={hostRef} style={{position: 'absolute', inset: 0}} />
</AbsoluteFill>;
```

This is safe under the renderer because within one worker the composition stays mounted and only
`frame` changes, so a `useLayoutEffect([frame])` runs synchronously before paint on every seek — and
because every per-frame call is a **total** function of `frame`, out-of-order seeks and Studio
scrubbing are both correct.

### 2. The stale-dash trap — the one that will bite you

`setRevealProgress(id, progress)` **mutates** the element: `≥ 1` restores the untouched rendering
(original dash patterns included), `≤ 0` hides it, and anything in between leaves a dash on it. It
only restores when you call it with `≥ 1`.

So if frame N sets a dash on node `a` and frame N+1 simply never mentions `a`, **the dash from frame N
is still there.** Loop over **every** animatable id on **every** frame, calling `setRevealProgress(id,
1)` for the ones that should already be finished and `0` for the ones not yet started. A partial pass
is a rendering bug that only appears when you scrub backwards.

The same shape of bug exists for visibility: `stepStateAt(scene, i).hidden` is `[]` unless a beat
explicitly says `reveal { hide all }`, so without that first beat everything pops back on. Verified:
`hide all` in beat 0 yields `hidden = ["a","b","c","e0_a_b","e1_b_c"]` and un-sticks one id per
subsequent `show`.

### 3. Camera

`mixCameras(a, b, t)` interpolates **zoom in log space** and position linearly —
`a.zoom * (b.zoom / a.zoom) ** t` — which is what the interactive controller does and what makes a
zoom read as constant-speed rather than accelerating. `t` must already be eased; pair it with
`easingByName('ease-in-out')` or with a house `Easing` curve.

`resolveCameraDirective(scene, directive, viewport, opts?)` turns a beat's `camera focus [ids] zoom
1.8` into a concrete `{cx, cy, zoom}` for your composition size. It is pure.

If you would rather drive the camera from React than call `applyCamera`, dump the world markup once
into `dangerouslySetInnerHTML` and animate the `viewBox`. The renderer's transform is
`translate(w/2 h/2) scale(zoom) translate(-cx -cy)`, so:

```
viewBox = `${cx - w / (2 * zoom)} ${cy - h / (2 * zoom)} ${w / zoom} ${h / zoom}`
```

Verified: `{cx: 400, cy: 300, zoom: 2}` at 1920×1080 → `"-80 30 960 540"`. This is the most
Remotion-idiomatic form and the one to prefer for a copy-paste effect.

### 4. Draw-on

`setRevealProgress` measures each stroke with the DOM's `getTotalLength()` and sweeps
`stroke-dasharray`/`stroke-dashoffset` to 85 % progress, then fades `<text>` over the last 30 %. It
works — but there is a better, fully deterministic route.

rough.js emits **one `<path>` per drawable**, whose `d` holds several sub-strokes, and
`@remotion/paths` handles that: `getLength(d)` is **pure, needs no DOM, costs ~0.025 ms, and gives
identical numbers in the Studio and in a headless render**, where `getTotalLength()` can differ.
`getSubpaths(d)` splits the sub-strokes; `evolvePath(progress, d)` returns
`{strokeDasharray, strokeDashoffset}` directly.

```tsx
// once, after render: walk the paths and cache their lengths
const paths = useMemo(() => [...svg.querySelectorAll('[data-node] path, [data-edge] path')]
  .map((el) => ({el, d: el.getAttribute('d')!, len: getLength(el.getAttribute('d')!)})), [scene]);
// per frame: a cumulative-length cursor across `paths`, in reading order
```

Path counts measured: 1 per simple node (2 for a cylinder — body plus rim), 17 for a 6-node scene,
44 for a 25-element architecture diagram. Cheap.

**`revealFx` only ever holds `"fade" | "pop" | "sweep"`.** `with draw-on` in the DSL lowers to
`"sweep"`, which is a `clip-path` wipe — *not* a stroke draw-on. Read `state.revealFx[id]` and
implement the three yourself (opacity / scale / `clipPath` / dash sweep); do not rely on the CSS
classes, which `{static: true}` disables anyway.

### 5. Flowing arrows — CSS-animated arrows are forbidden and must be rebuilt

The `~>` glyph and `animate:` set `edge.style.animation`, and the renderer turns that into a
**CSS-keyframe overlay path**. Every one of `flow`, `dash-march`, `draw-on`, `comet`,
`gradient-flow`, `electric`, `pulse` is `animation-name` + `animation-duration` — **forbidden in
Remotion**, because a frame screenshot catches them mid-flight and Remotion does not advance CSS
clocks with the frame. `{static: true}` correctly emits **zero** `.edd-anim` elements, so you get a
static arrow and must rebuild the motion yourself.

Read each `[data-edge] path`'s `d` and march it from the frame:

```tsx
const L = getLength(d);
const march = (frame * speedPxPerFrame) % 18;   // 18 = the CSS keyframe's -18px cycle
<path d={d} stroke={c} strokeWidth={sw * 1.2} strokeDasharray="10 8"
      strokeDashoffset={-march} fill="none" />
```

- **comet**: `strokeDasharray={`${Math.max(24, L * 0.14)} ${L}`}` with `strokeDashoffset` running
  from `L` to `-0.14 * L`.
- **gradient-flow**: the same march over `stroke="url(#eddFlowGradient)"` — that gradient is already
  in the renderer's `<defs>`.

### 6. Roughness and zoom — edges must read smooth, or only slightly hand-touched

rough.js jitter is in **world units and independent of shape size**, and the camera is a `scale(zoom)`
on the world group, so **screen jitter = zoom × world jitter** — and SVG scales stroke width with the
CTM, so the stroke thickens too. Both magnify under a punch-in. Measured on a 320×140 rect:

| config | top-edge deviation | corner error | at zoom 4 |
|---|---|---|---|
| `classic` (roughness 1.15, bowing 1) | 1.21 px | **1.71 px** | **4.84 px** |
| `crayon` (2.2) | 2.31 px | 3.27 px | **9.24 px** |
| roughness 0 (`fine-line`, `mono-accent`, `colorful-lines`, `neutral-lines`, `earthy-gradient`) | 0.00 | 0.00 | 0.00 |
| roughness 0.35, bowing 0.35, `preserveVertices: true` | 0.38 px | **0.00 px** | 1.52 px |

On a 400 px line, `classic` is ±2.63 px in world units — **±10.5 px at 4× zoom**. That is the
"scratchy when zoomed" report, exactly.

**Rules:**

- **Pin roughness low, globally, in the source**, on `defaults` so it cascades to every node and edge:

```edd
defaults {
  node { roughness: 0.35, strokeWidth: medium, roundness: 12 }
  edge { roughness: 0.35 }
}
```

  The `roughness` keywords are `architect` (**0** — clean single-pass strokes), `artist` (1),
  `cartoonist` (2), or a raw number. **Use `architect` for anything that will be zoomed; 0.35–0.6 is
  the highest you should go if you want a whisper of hand-drawn character.** Edges must read smooth or
  only slightly hand-touched — never scratchy.
- The `defaults` cascade reaches classic nodes and edges but **does not reach `viz` templates**
  (they read `ctx.preset.roughness` directly), nor annotations, nor group frames. For a `viz` block
  the only lever is picking one of the five `roughness: 0` presets above.
- If you must zoom past ~2.5×, keep the effect's zoom band small, or accept the look — there is no
  zoom-compensated regeneration in the published version.

### 7. Determinism

rough.js is random by nature, but edododraw resolves a **`seed` per node** from `hashString(id)` and
reuses it, so re-renders do not re-jitter and two renders of the same frame match. Two consequences:
render once and reuse the DOM (as in §1); and never call `Math.random()` anywhere near a diagram —
use `random(seed)` from `remotion` if you need variation.

Light/dark: `compileEdd(src, {mode: 'light' | 'dark'})` forces the render mode, or a preset whose name
contains `dark`. Colours you set explicitly are always kept.

---

### Before you ship a diagram effect

- [ ] `SvgRenderer` constructed with `{static: true}`.
- [ ] `compileEdd` in `useMemo`, `render()` in a `useLayoutEffect` keyed on the scene — neither runs
      per frame.
- [ ] Per frame: style writes only. `applyVisibility` / `applyCamera` / `setRevealProgress` /
      `AnnotationLayer.render` are the four calls that qualify — or your own dash writes onto elements
      you measured at mount, which is the same discipline reached a different way.
- [ ] Whichever reveal you drive, it is written for **every** animatable element every frame,
      including the finished ones at `1` — no stale dashes when a frame is produced after a later one.
      Through the API that is `setRevealProgress` per id (or `setRevealProgressAll`, which is the safe
      one when frames arrive out of order); by hand it is the dash pair on every measured path.
- [ ] No `~>` / `animate:` arrow left relying on CSS; every flow is rebuilt from `frame`.
- [ ] `defaults { node { roughness: … } edge { roughness: … } }` set, and the rendered check frame
      inspected at the effect's maximum zoom, not at zoom 1.
- [ ] Fonts gated with `delayRender` — `whenFontsReady()` if the package's own helper is available,
      otherwise `document.fonts.load('32px Excalifont')`.
