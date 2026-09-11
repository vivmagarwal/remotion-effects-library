Build a Remotion composition called **VizGallery** (composition id `viz-gallery`): one hand-drawn
diagram template drawn on stroke by stroke, from `edododraw` source, driven entirely by the frame.

**Setup**

```bash
npm i edododraw@^0.16.2
npx remotion add @remotion/google-fonts
```

**What edododraw is.** A text DSL that compiles to a hand-drawn-style SVG diagram — `viz flowchart
"Content Publishing" { item "Draft" { icon: doc } … }`. It ships 87 visualization templates and a
curated runnable demo for each, exported as `VIZ_DEMOS` from `edododraw/demos`.

**The frame-driven contract — get this wrong and nothing else matters**

This composition measures every stroked path once at mount and writes
`strokeDasharray`/`strokeDashoffset` itself. Where the general edododraw guidance below describes
`setRevealProgress`, `setRevealProgressAll` and `AnnotationLayer`, this file deliberately uses none of
them: the reveal has to be per GROUP rather than per id (see below), the paths are measured once
instead of re-measured every frame, and there are no annotations in a `viz` template — `SvgRenderer`
paints `scene.annotations` itself. **Where the two disagree, this section wins.**

Remotion renders frames **out of order and in parallel**. So:

```tsx
// ONCE. compileEdd is pure, synchronous and DOM-free — 8-18ms for a dozen nodes.
// It always returns a DiagnosticBag, so `items` is always an array. Errors are
// RENDERED rather than thrown — see Requirements.
const compiled = useMemo(() => compileEdd(edd), [edd]);
const {scene} = compiled;
const problems = compiled.diagnostics.items.filter((d) => d.severity === 'error');

// ONCE. render() is 8-30ms and touches the DOM.
useLayoutEffect(() => {
  const renderer = new SvgRenderer(host, {static: true, nonScalingStroke: true, strokeScale});
  renderer.mount();
  renderer.render(scene);

  // render() ends by painting the host with the DIAGRAM's paper
  // (`scene.meta.background || scene.theme.background` — #fbfaf7 for hand-clean).
  // Hand the ground back to the composition, or the band is a different shade
  // from the frame around it.
  host.style.backgroundColor = 'transparent';

  // Fit the diagram to the frame. Do NOT call renderer.measure(): it sizes the
  // camera viewport from the host's clientWidth/clientHeight, and Remotion mounts
  // a composition inside a 0x0 off-screen wrapper during the layout pass, so a
  // useLayoutEffect reads 0x0, the viewport clamps to 1x1 and the camera
  // degenerates. Pass the size you already know instead.
  const viewport = {w: width, h: height - TOP - BOTTOM};
  renderer.setViewport(viewport);
  renderer.applyCamera(cameraForBBox(sceneBBox(scene), viewport, {padding}));

  // …measure every stroked path here, not per frame…
  whenFontsReady().then(() => continueRender(handle)).catch(cancelRender);
  return () => renderer.destroy();
}, [scene, handle, width, height, padding]);

// PER FRAME. A handful of style writes on elements measured at mount, nothing else.
useLayoutEffect(() => {
  const reached = drawn * totalLen.current;
  for (const unit of units.current) {
    const into = reached - unit.from;
    const p = Math.min(1, Math.max(0, into / unit.len));          // this unit's progress
    for (const part of unit.parts) {
      const q = part.len > 0 ? Math.min(1, Math.max(0, (into - part.from) / part.len)) : 0;
      part.g.style.opacity = String((part.text ? (p >= 0.7 ? 1 : 0) : q > 0 ? 1 : 0) * part.opacity);
      const tint = part.paths.length > 0 ? Math.min(1, Math.max(0, (q - 0.25) / 0.5)) : q;
      for (const f of part.fills) f.el.style.opacity = String(tint * f.opacity);
      if (!part.text) for (const t of part.g.querySelectorAll('text')) t.style.opacity = String(q >= 0.7 ? 1 : 0);
      let within = into - part.from;                               // its outline draws
      for (const x of part.paths) {
        const r = Math.min(1, Math.max(0, within / x.len));
        within -= x.len;
        if (r >= 1) {                                              // finished: no dash at all
          x.el.style.strokeDasharray = '';
          x.el.style.strokeDashoffset = '';
          continue;
        }
        x.el.style.strokeDasharray = `${x.len} ${x.len}`;
        x.el.style.strokeDashoffset = `${x.len * (1 - r)}`;
      }
    }
  }
}, [drawn]);
```

Six rules, each of which is a bug someone has already shipped:

1. **`static: true` is not optional.** Without it the renderer emits CSS transitions and an
   animated-arrow keyframe overlay, and a captured frame can land mid-transition — so two renders of
   the same frame disagree.
2. **Write EVERY path every frame, including the finished ones.** Skip the ones already at progress 1
   and a frame drawn after a later frame keeps a stale dash. This is the single most common way a
   frame-driven diagram breaks, and it only shows up in a parallel render.
3. **Never call `render()` per frame**, and never touch `CameraController` or the timeline player —
   both are `requestAnimationFrame` plus `performance.now()`.
4. **`whenFontsReady()` wired to `delayRender`.** The hand-drawn face is injected as a base64
   `@font-face` fire-and-forget; screenshot before it decodes and every text metric shifts.
5. **Frame the diagram with `setViewport` + `applyCamera`, never with the SVG's own `viewBox`.** Every
   template lays out at whatever size its content needs, so an unfitted four-item flowchart sits small
   in a corner while a 25-element diagram runs off the edge. `cameraForBBox(sceneBBox(scene), viewport,
   {padding})` is the fit. The tempting shortcut — set a `viewBox` from `world.getBBox()` — is wrong in
   a way that hides: a `viewBox` lives in the space the world group's transform maps INTO and
   `getBBox()` reports the space it maps FROM, so the two agree only while the camera is identity. It
   *is* identity in `renderStill`, because the host measures 0x0 there. Stills come out perfect and
   every real browser puts the diagram outside its own viewBox.
6. **Measure a dash in the units the dash is laid out in.** `nonScalingStroke` stamps
   `vector-effect="non-scaling-stroke"` on every drawable, and a non-scaling stroke is stroked in the
   SVG viewport's pixels — dash pattern included. `getTotalLength()` answers in the path's own user
   units. Under a camera that fits the diagram at 2x, a dash of `getTotalLength()` covers half the
   path on screen, the gap covers the other half, and the pattern repeats: every circle closes
   halfway round, every underline shows as `—— label ——`, every connector breaks into pieces. On the
   FINISHED frame, not just mid-draw, and in `renderStill` too — this shipped on all 82 cards. Scale
   by the element's CTM, which is exactly the transform the non-scaling stroke undoes, and clear the
   dash entirely once a stroke is complete so the finished frame never depends on the measurement:

   ```tsx
   const dashLength = (el: SVGGeometryElement) => {
     const len = el.getTotalLength();
     if (el.getAttribute('vector-effect') !== 'non-scaling-stroke') return len;
     const m = el.getCTM();                       // measure AFTER applyCamera()
     return m ? len * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) : len;
   };
   ```

**Draw by ITEM, in the order the template emitted it — this is what makes it read as drawing.**

edododraw renders by z-layer: every shape and connector, then every label, then every icon, then the
block title. Sweep the elements in document order and the whole skeleton draws empty, every word pops in
at the end and the title arrives last — at 60% of the sweep there is no text on screen at all. Instead:

- **The unit is the data item.** Each rendered element (`[data-node]`, `[data-edge]`) carries
  `data-viz-item` when the template emitted it for an item, and `data-viz-role` (`shape`, `line`,
  `icon`, `label`, `detail`, `title`, …). Gather an item's elements into one unit, so its label arrives
  with its own box. An element that belongs to no item is a unit of its own.
- **Units go in emission order.** `scene.nodes` is the order the template emitted, which is reading
  order for every template (root before branches, spine before bones). Rank a unit by its earliest
  element's index there. The title (`data-viz-role="title"`) frames the diagram, so it goes FIRST. An
  edge ranks just before the node it points at, so an arrow reaches out and its box lands at the tip.
- **One shared 0→1 cursor** across all units, each taking a share equal to its stroke length — one
  cursor is what makes it look drawn by one hand rather than by forty at once.

```tsx
const index = new Map<string, number>();
scene.nodes.forEach((n, i) => index.set(`node:${n.id}`, i));
scene.edges.forEach((e, i) => {
  const to = e.to.node ? index.get(`node:${e.to.node}`) : undefined;
  index.set(`edge:${e.id}`, to === undefined ? scene.nodes.length + i : to - 0.5);
});
// key = 'title' | data-viz-item | own:<id>; rank = -1 for the title, else the min index of its parts
```

Within a unit, each element (a PART) draws over its own share, in emission order:

- **Outline at full strength, fill behind it.** A filled shape's fill is a separate, unstroked path.
  Fade the whole element in with its outline and a tinted shape arrives as a pale disc ahead of its line.
  Keep the element visible from its first pixel and fade only its fill-only paths, from 25% to 75% of the
  way round its own outline.
- **Labels wait.** A text-only part appears when its unit is 70% drawn; `<text>` inside a stroked part
  appears when that part's outline is 70% drawn. A label that arrives with the first pixel of its box
  reads as a screenshot.
- **Multiply, never overwrite, opacity.** edododraw writes an element's AUTHORED opacity onto its group
  and some fills — a heatmap cell's intensity, a radar series at 60%, a faint wash. Read it at mount and
  multiply the reveal into it. Overwrite it and the heatmap renders one flat colour and the radar's top
  series hides the one under it — on the finished frame.
- **A stroke with its own dash pattern fades in instead.** A dotted leader or a dashed orbit already
  carries `stroke-dasharray`; the reveal's dash would replace it with one solid line that snaps back to
  dotted on the last frame. Give it its share of the sweep and ramp its opacity.
- A unit of text alone (the title) takes a nominal share of `120`, about the perimeter of a small box,
  so it is written rather than stamped. A fill-only part takes `60`.

**Split every stroke-only path into one element per subpath, at mount.** rough.js writes each side of
a box and each curve of a path as its own `M … C` subpath inside one `<path>`, and a dash pattern
RESTARTS at every subpath: dash that element and all four sides of a box grow at once from all four
corners, and a curved outline appears as a dozen scattered ticks. The subpaths were separate strokes
already, so splitting changes nothing on the finished frame. Leave fills whole — their subpaths define
one region together.

```tsx
for (const el of host.querySelectorAll<SVGPathElement>('path')) {
  if ((el.getAttribute('stroke') ?? 'none') === 'none' || (el.getAttribute('fill') ?? 'none') !== 'none') continue;
  const pieces = (el.getAttribute('d') ?? '').split(/(?=M)/).filter((x) => x.trim());
  if (pieces.length < 2) continue;
  for (const d of pieces) { const p = el.cloneNode(false) as SVGPathElement; p.setAttribute('d', d); el.before(p); }
  el.remove();
}
```

**Stroke quality — the reason `hand-clean` and `nonScalingStroke` are here**

rough.js perturbs geometry by absolute **world** units, and a camera is a `scale(zoom)` on the world
group, so screen jitter is `zoom × world jitter` and the stroke width scales too. Measured on a
320×140 box: 1.71px of corner error at 1× becomes **4.84px at 4×**. Use the `hand-clean` preset
(`roughness 0.35`, `preserveVertices`, `disableMultiStroke`), turn on `nonScalingStroke`, and if the
camera pushes in, call `setRoughnessScale(1/zoom)` quantised to octaves so it regenerates a handful of
times rather than every frame.

This composition's camera never moves, but it is still a zoom: the FIT is a `scale(zoom)`, and a
four-item list fits at about 2.5x — so its jitter lands on screen 2.5x larger than the roughness asked
for, which shows as a notch where every circle closes and a wobble on every box. Compute the fit
BEFORE constructing the renderer and pass the scale to the **constructor**, capped at 1 so a large
diagram fitted down reads calmer rather than rougher:

```tsx
const camera = cameraForBBox(sceneBBox(scene), viewport, {padding});
const renderer = new SvgRenderer(host, {
  static: true, nonScalingStroke: true, strokeScale,
  roughnessScale: Math.min(1, 1 / camera.zoom),
});
```

Never call `setRoughnessScale()` after `render()` here: it repaints the whole scene, which replaces
every element you measured and leaves the per-frame loop writing to detached nodes.

Declare the preset in the source rather than as a renderer option, so there is one input:

```tsx
const edd = /\bmeta\s*\{/.test(source) ? source : `meta { style: ${style} }\n${source}`;
```

**The theme reaches the diagram through a preset built from it.** The viz generators colour every
item from the style preset's palette and letter it in the preset's fonts — nothing in the source does
that — so a theme that only restyles the chrome leaves all 82 diagrams looking identical under every
theme. Copy the base preset, fold the theme into it, and register it under a name derived from the
values, so the compile stays a pure function of one string:

```tsx
import {getStylePreset, registerStylePreset} from 'edododraw';

const themedPreset = (base: string, t: Theme, roughness: number): string => {
  const src = getStylePreset(base);
  if (!src) return base;
  const look = {
    palette: [...t.paperSeries], ink: t.paperInk, mutedInk: t.paperMuted, edge: t.paperMuted,
    background: t.paper, emphasis: t.accentOnPaper,
    fonts: {...src.fonts, body: t.hand, heading: t.hand, title: t.hand},
    // scale against the HOUSE radius (18), so the house theme reproduces the base exactly
    cornerRadius: src.cornerRadius === null ? null : Math.round(((src.cornerRadius * t.radius) / 18) * 10) / 10,
    roughness,
  };
  let h = 5381;                                   // djb2: one name per distinct look
  for (const ch of JSON.stringify(look)) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0;
  const name = `${src.name}-t${h.toString(36)}`;
  if (!getStylePreset(name)) registerStylePreset({...src, ...look, name, aliases: []});
  return name;
};
```

The preset keeps its GRAMMAR — pale fills or solid, an outline in the hue or in the ink — so `preset`
still chooses how a diagram is drawn; the theme chooses what it is drawn in. `aliases: []` matters: a
copy that inherits the base's aliases re-points them at the themed copy. A source that declares its
own `meta` keeps its own style — like any explicit prop, it wins over the theme.

`paperSeries` is the palette, not `series`: the house `series` is built to glow on a dark ground, and
its lime and amber are near-invisible as a stroke or a label on paper. The house `paperSeries` is
hand-clean's own palette with its three light hues — rust, amber, teal — taken down to the lightest
shade that holds 4.5:1 on paper, because the templates letter every item's heading in its colour and
hand-clean's amber measured 2.97:1. Every entry is `['#2f5eb8', '#b1572a', '#2e7d63', '#7a4fb5',
'#8f6822', '#1e7991', '#b0405c', '#5c7a2e']`.

**Line weight comes from `theme.stroke`.** With `nonScalingStroke` every `stroke-width` is a SCREEN
width, so the preset's ~1.8px reads as a hairline on a 1920×1080 frame. `strokeScale` (edododraw
0.16+) multiplies every drawn stroke — outlines, connectors, arrowheads, hachure, icons — which is the
point: the templates set their own widths for spines, ticks and icons, so raising only the preset's
width would leave the connectors as hairlines beside heavy boxes:

```tsx
const renderer = new SvgRenderer(host, {
  static: true,
  nonScalingStroke: true,
  strokeScale: (theme.stroke / 2) * (height / 1080),   // edododraw's main lines are ~2
});
```

**Character figures are fine; one template is not.** edododraw's `character` nodes used to be
excluded here as broken, and are not any more: `personas`, `vision`, `hole` and `quote` (whose
`pose: none` hides its figure as documented) are all in the gallery. `tug-of-war` is the one template
left out — it exists to show two teams pulling one rope, and the figures' hands do not reach the rope.

**The look**
- 1920×1080, 30fps, 130 frames. Ground `#f6f5f2` — light by nature, because a hand-drawn diagram
  belongs on paper. Most motion graphics want a dark studio ground; this one does not.
- The diagram fills `left: 0, top: 88, right: 0, bottom: 96`.
- Eyebrow top-left at `84, 60`: the catalogue category, 28px/700, `letter-spacing: 0.24em`, uppercase,
  in `#c2410c`.
- Top-right at `84, 54`: `viz ${vizType}` — e.g. "viz flowchart" — at 34px/500 in `#4a4e5a`.
- A 5px draw-on progress bar at `left/right: 84, bottom: 56`, track `rgba(29,27,23,0.12)`, fill
  `#c2410c`. Both chrome layers fade in over frames 0–14.
- Draw-on runs frames 10→86 on `Easing.inOut(Easing.cubic)`, leaving a ~44-frame hold so a poster frame
  catches the finished diagram. This is a sweep across a whole diagram, not one element's entrance,
  which is why it takes the one curve the house easing vocabulary otherwise rules out: a hand does not
  start at full speed (so not linear), and an ease-out draws 91% of it in the first third and then
  crawls. The progress bar reads the same eased value, so the bar and the drawing never disagree.
- The two chrome layers fade in over frames 0–14 on `Easing.out(Easing.exp)`.

**Requirements**
- One self-contained `.tsx` file exporting `VizGallery`.
- The props table below is the complete list. The ones whose values are worth stating here: `vizType`,
  `vizCategory` and `source` all default to the first entry of the variant list, `drawFrames` `76`,
  `startAt` `10`, `preset` `'hand-clean'`, `backgroundColor` `'#f6f5f2'`, `accentColor` `'#c2410c'`,
  `padding` `96`.
- `meta.variants` carries one entry per template, shaped
  `{id, name, tagline, props: {vizType, vizCategory, source}}` — `id` is the template name, `tagline`
  the one-line description the package ships for it.
- Build that list from `VIZ_DEMOS`, do not write it out. The catalogue lives upstream, and a template
  added in a later release should appear here without anyone editing anything. Deriving it at module
  scope keeps the component one file; generating it into a sibling `variants.generated.ts` is equally
  fine, because a variant list is metadata rather than part of the component. What is not fine is 82
  hand-typed entries.
- On a compile error, RENDER the diagnostics instead of throwing — a bordered panel below the eyebrow,
  with an `accentColor` border and heading on a `${accentColor}0f` wash, radius
  `14 * theme.radius / 18`, border `2 * theme.stroke / 3` px, heading at 700, each message at
  34px/500 — and still call `continueRender`, or one uncompilable source hangs the render forever. A
  throw would take all 82 down to report one.
- Load Inter at weights 500 and 700 only: 500 for the readout and the diagnostics, 700 for the eyebrow
  and the panel heading.
- `checkFrame` 52 is mid-draw; `posterFrame` 108 is the finished diagram.