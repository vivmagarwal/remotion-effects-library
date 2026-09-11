## Remotion core (read this before writing any code)

You are writing **Remotion** — React that renders to video, deterministically, one frame at a time.
Remotion is at version **4.0.522**. Everything below was checked against that install.

### The five rules that decide whether this renders at all

1. **Every moving value is a function of `useCurrentFrame()`.** No CSS `transition`/`animation`/
   `@keyframes`, no Tailwind `animate-*`, no `setTimeout`/`setInterval`/`requestAnimationFrame`, no
   `useFrame()` from react-three-fiber, no `performance.now()`, no `Date.now()`. The renderer
   screenshots frames out of order and in parallel; anything on a wall clock freezes, flickers, or
   differs between the Studio and the render. There is no supported way to run a CSS animation
   "paused and seeked" — port the `@keyframes` percentages to frame numbers and `interpolate()` them.
2. **Deterministic.** `random(seed)` from `remotion`, never `Math.random()`. No mutable module-scope
   state. No `fetch()` at render time.
3. **One file.** The whole effect is one self-contained `.tsx`: no shared helper module, no imports
   from other effects. Duplication between effects is deliberate and correct.
4. **Every prop has a default**, unless genuinely required. The props table in this prompt is the
   contract — its defaults must appear verbatim in your destructuring.
5. **When two instructions disagree:** the brief's explicit numbers win (it has seen the composition)
   → the house style above wins → this generic section wins. Deviate only by saying so in your final
   message; never silently "improve" the brief.

---

### 1. Where everything comes from

Snippets are shown **without import lines**. These are the only places anything comes from:

```tsx
import {
  AbsoluteFill, Sequence, Series, Loop, Freeze, Img, CanvasImage, AnimatedImage, Interactive, Solid,
  useCurrentFrame, useVideoConfig, interpolate, interpolateColors, spring, measureSpring,
  random, staticFile, Easing, useDelayRender, createEffect,
} from 'remotion';

import {Video, Audio} from '@remotion/media';           // NOT from 'remotion'
import {loadFont} from '@remotion/google-fonts/Inter';  // one module per typeface
```

`remotion` also exports `Video`, `Audio`, `OffthreadVideo`, `Html5Video`, `Html5Audio` — older
components kept for fallback behaviour. Use `@remotion/media`'s. Other packages are documented in the
modules that follow. **If a package is not in the install block near the top of this prompt, this
effect does not use it.**

### 2. `interpolate()` is the workhorse

```tsx
const frame = useCurrentFrame();      // 0, 1, 2, … within the enclosing <Sequence>
const {fps, width, height, durationInFrames} = useVideoConfig();

interpolate(frame, [0, 0.5 * fps], [0, 1], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp',   // ← almost always want both
  easing: SETTLE,
});
```

- Without `clamp`, values run past the range and things fly off screen. Clamp by default.
- **Both time conventions are allowed and neither is a "magic number".** `1.5 * fps` when the timing is
  conceptually a duration; a raw integer when the brief specifies an exact frame. What matters is that
  a reader can tell which one a number is.
- Multiple keyframes are fine: `interpolate(frame, [0, 30, 60, 90], [0, 1, 1, 0])`. For per-segment
  easing pass an array of `n - 1` easing functions.
- **Scale must pass `output: 'perceptual-scale'`** — linear scale appears to decelerate at large
  values. `'linear'` and `'perceptual-scale'` are the only legal values. `posterize: 3` samples every
  3rd frame, for a deliberate stop-motion look. `interpolateColors()` handles colour.

`spring()` is the physical alternative when you want real overshoot. **Always pass a `config` from the
house spring vocabulary above** — the default (`{damping: 10, mass: 1, stiffness: 100}`) overshoots
16 % over 24 frames and is the most recognisable tell of an unstyled Remotion video.
`measureSpring({fps, config})` gives the settle length.

### 3. Keep `interpolate()` inline, and use the CSS transform shorthands

Studio reads keyframes back out of your code and lets a user drag them — but only when the call sits
directly in the `style` prop and uses the individual transform properties.

```tsx
// 👍
style={{
  scale: interpolate(frame, [0, 30], [0.94, 1], {/* … */, output: 'perceptual-scale'}),
  translate: interpolate(frame, [0, 30], ['0px 40px', '0px 0px'], {/* … */}),
  rotate: interpolate(frame, [0, 30], ['-8deg', '0deg'], {/* … */}),
  opacity: interpolate(frame, [0, 10], [0, 1], {/* … */}),
}}

// 👎 — computed away from the style prop, and a transform string
const scale = interpolate(frame, [0, 30], [0.94, 1]);
style={{transform: `scale(${scale})`}}
```

`translate` and `rotate` take **strings with units**; `scale` and `opacity` take numbers. Fall back to
a `transform` string only for `skew()`, `perspective()`, or an order-sensitive chain.

### 4. Layout

`<AbsoluteFill>` is a `position: absolute; inset: 0` div — the base layer of nearly every scene; it
takes `style` and `name` (which labels it in the Studio timeline).

```tsx
<AbsoluteFill name="Scene" style={{backgroundColor, justifyContent: 'center', alignItems: 'center'}}>
```

`<Interactive.Div>` (also `.Span`, `.H1`, `.P`, `.Svg`, `.Path`, `.Rect`, `.Circle`, `.G`, `.Text`, …)
is a drop-in replacement that also registers the element in the Studio timeline so a user can select,
move and retime it — give each a `name`, and use it for anything a user would tweak. `<Solid>` is a
full-frame fill; `<CanvasImage>` draws a still (it decodes on a canvas, so it never races the
screenshot); `<AnimatedImage>` handles gif/webp/apng/avif.

### 5. Timing: `<Sequence>`, `<Series>`, `<Freeze>`, `<Loop>`

```tsx
<Sequence from={1 * fps} durationInFrames={2 * fps} layout="none" name="Title"><Title /></Sequence>

<Series>
  <Series.Sequence durationInFrames={45}><Intro /></Series.Sequence>
  <Series.Sequence durationInFrames={60} offset={-15}><Main /></Series.Sequence>
</Series>
```

- `useCurrentFrame()` is **local to the enclosing `<Sequence>`**. Inside `<Sequence from={60}>` it
  starts at 0 again — never subtract the offset yourself.
- `layout="none"` skips the absolute-fill wrapper; with it you may not pass `style`, and the crop props
  throw.
- `premountFor={n}` mounts the subtree `n` frames early and invisible so images, fonts and video decode
  before the cut. **Add it whenever the subtree loads media or a font**; it is noise on plain divs.
  `postmountFor` and `styleWhilePremounted` are the tail and the styling of those windows.
- `<Freeze frame={n}>` holds children at frame `n` (`active` may be a boolean or `(f) => boolean`).
  `<Loop durationInFrames={n} times={t}>` repeats; `Loop.useLoop()` gives the iteration.
- Most components accept `from`, `durationInFrames`, `trimBefore`, `freeze` and `hidden` directly —
  `<AbsoluteFill>`, `<Interactive.*>`, `<CanvasImage>`, `<Solid>`, `<Video>`/`<Audio>`. Wrap in a
  `<Sequence>` only when the component you want to delay does not.
- `<Sequence>` and `<Interactive.*>` also take `cropLeft`/`cropRight`/`cropTop`/`cropBottom` —
  **fractions 0…1**, compiled to `clipPath: inset(...)`. They mask; they do not scale the rest up.

### 6. Compositions

Register in `src/Root.tsx`. Keep `defaultProps` an **inline object literal** — Studio writes edits back
into it and cannot do that through a variable, a spread, or `satisfies`.

```tsx
<Composition
  id="my-effect"          // kebab-case, exactly the id in the Definition of done
  component={MyEffect}    // PascalCase component
  durationInFrames={90} fps={30} width={1920} height={1080}
  defaultProps={{title: 'Hello'}}
/>
```

Every CLI command in this prompt addresses the composition by its **kebab-case id**; an id like
`"MyEffect"` makes them all fail with "composition not found". Use `type` (not `interface`) for props
so `defaultProps` type-checks. If a composition's length must come from a real media file rather than a
constant, pass `calculateMetadata` — `width`, `height`, `fps` and `durationInFrames` then become
optional.

### 7. Assets

Put files in `public/` and reference them with `staticFile('footage/interview.mp4')` — **including the
subdirectory**. A bare `'/interview.mp4'` works in the Studio and breaks in a render. Remote URLs are
allowed and need no download.

**Never `fetch()` inside a component at render time** — a per-frame fetch is a fetch several hundred
times and any failure is a broken frame. Bundle the data (`import data from './data.json'`, needs
`resolveJsonModule`) or put it in `public/`. If something genuinely must load asynchronously:

```tsx
const {delayRender, continueRender, cancelRender} = useDelayRender();
const [handle] = useState(() => delayRender('loading captions'));
// … continueRender(handle) on success, cancelRender(err) on failure
```

### 8. Design for video, not for a web page

- 1920×1080 at 30 fps unless the brief says otherwise; 1080×1920 for vertical/social.
- **Safe area `SAFE = 84` at 1920×1080** (`SAFE_X 84`, `SAFE_TOP 240`, `SAFE_BOTTOM 380` vertical).
  Only full-bleed grounds, wipes and letterbox bars cross it.
- **Type sizes come from the house scale above**, quoted at 1920×1080 and scaled by `height / 1080`
  elsewhere. `SMALL` (34 px) is the absolute floor for text that carries the message.
- **Dense informational layers are exempt from that floor by rule, not by exception**: chart labels and
  axis ticks, HUD readouts, code and terminal output, recreated product UI, table cells, legends. They
  earn their size by being supported by shape, colour and position rather than read cold, and forcing
  them to 34 px destroys the layout. A 19 px axis label is correct.
- Video text is read at a glance from across a room, and the gallery renders each effect at about
  **0.17× on a card**. Decide the one thing the viewer should notice, build the frame around it, and
  check it reads at both scales.
- **A camera push crops the frame.** Scaling a full-bleed layer to `1.03` pushes ~1.5 % off each edge —
  about 29 px at 1920 wide. Set your safe padding from the push, not the other way round.

### 9. Fonts

```tsx
import {loadFont} from '@remotion/google-fonts/Inter';
// One weight, because this composition uses one weight.
const {fontFamily} = loadFont('normal', {weights: ['700'], subsets: ['latin']});
```

`@remotion/google-fonts` blocks the render until the font is ready. **List exactly the weights the
composition uses — no more, no less — and never copy a weight array from another effect.** The list is
per typeface and type-checked: Inter ships 100–900, Space Grotesk stops at 700, and asking for a weight
a font does not ship is a TypeScript error. Asking for one you never use is *not* an error — it
silently adds a download. Check `node_modules/@remotion/google-fonts/dist/cjs/<Font>.d.ts` if unsure.

`loadFont(...)` at module scope is correct and intended: it is idempotent and returns the same value
every time. That is not the same as constructing a *mutable* object at module scope, which is banned
(§11).

### 10. Installing, previewing, checking a frame

`npx remotion add <pkg>` picks the version matching your Remotion install (`@remotion/*`, `mediabunny`,
`@mediabunny/*`, `zod`); everything else is plain `npm i`. **The exact install command for this effect
is the fenced block near the top of this prompt** — run that one, do not re-derive it from the imports,
do not add packages it does not list.

```bash
npx remotion studio --no-open   # READ the URL it prints — if 3000 and 3001 are busy it takes 3002
npx remotion still <id> --frame=30 --scale=0.5 --output=out/check.png
npx remotion render <id> out/seq --sequence --image-format=png --scale=0.4   # to inspect motion
```

`--frame` is zero-based, so at 30 fps `--frame=30` is the one-second mark. Each `still` re-bundles the
project (~30 s), which is why a frame *sequence* is the cheaper way to look at motion. Render a video
only when asked. FFmpeg and FFprobe ship with Remotion: `npx remotion ffprobe <file>`.

**A rendered frame proves nothing until you open it and look at it.** Black, blank, or fully settled is
not evidence.

### 11. Driving a third-party library

Put anything with its own clock onto Remotion's: find its seek and feed it `frame / fps`
(`animation.seek((frame / fps) * 1000)` for Anime.js, `timeline.pause().seek(frame / fps)` for GSAP, a
`uTime` uniform for a shader). Two rules apply to all of them:

- **Construct *mutable* objects inside the render, not at module scope.** Frames render in parallel,
  and a shared mutable instance (a d3 projection, a force simulation, a loader cache) gives different
  results depending on which frame touched it first. Idempotent module-level setup that returns the
  same value every time — `loadFont(...)`, a frozen palette, a compiled regex, a data constant — is
  fine and belongs there. The test: *would calling this twice give two different answers, or leave
  something changed behind?*
- **A library that mounts into the DOM gets mounted once**: compile in `useMemo`, mount in a
  `useLayoutEffect` keyed on the source, and per frame mutate only what the frame changed.

### 12. Gotchas that will bite you

- **`translate` units must match per axis.** `['0px 110%', '0px 0px']` throws *"Cannot interpolate
  translate values with different units on axis 2"*. Write `['0px 110%', '0px 0%']`. `rotate` needs a
  unit on both ends: `['0deg', '360deg']`, not `[0, 360]`.
- An element you move with `translate` still occupies its original layout box — wrap it in an
  `overflow: hidden` parent for a masked reveal.
- A **centred** line with `letter-spacing` gets that spacing after its last glyph too, so it sits half a
  letter-space left of true centre. Cancel with a matching negative right margin
  (`letterSpacing: '0.28em'` → `marginRight: '-0.28em'`) — but **only** when centred; on a left-aligned
  element in a `space-between` row it drags the sibling instead.
- A fixed-width character slot must be sized to the **actual typeface**: `0.68em` lets `M` and `W`
  overflow in most display faces. Start near `0.92em` for a bold sans.
- `'\/'` in a JavaScript string is just `/` — the backslash is silently eaten. Write `'\\/'`.
- A hard ease-out like `Easing.bezier(0.16, 1, 0.3, 1)` covers **~91 % of the distance in the first
  third**, so "halfway through" is visually almost finished. Pick verification frames from the first
  quarter, not the middle.
- **An SVG `id` is global to the page.** A literal `id="clip"` referenced by `url(#clip)` resolves to
  whichever copy of the composition mounted first — so with two players on one page (a thumbnail and
  a detail view, or one video embedded twice) the second one's clip, mask or gradient follows the
  first one's frame. Derive every def id from `useId()`:
  `const svgId = useId().replace(/[^a-zA-Z0-9_-]/g, '')`, then `` id={`clip-${svgId}`} `` and
  `` clipPath={`url(#clip-${svgId})`} ``. The replace matters: React's ids contain characters that are
  not valid inside `url(#…)`.

---

### Before you report back — tick every line

- [ ] Every animated value traces to `useCurrentFrame()`. No CSS animation/transition/keyframes, no
      timers, no `requestAnimationFrame`, no wall clock, anywhere in the file.
- [ ] `random(seed)` from `remotion`, not `Math.random()`. No mutable module-scope state. No `fetch()`
      at render time.
- [ ] One self-contained `.tsx`. No imports from other effects, no shared helper module.
- [ ] `type Props`, every prop optional, with the **exact defaults from the props table** above.
- [ ] Every `interpolate()` driving a transform sits inline in the `style` prop and uses `scale` /
      `translate` / `rotate` / `opacity`; every scale passes `output: 'perceptual-scale'`; every call
      clamps both ends unless it deliberately extrapolates.
- [ ] No bare `spring({frame, fps})` — every spring names a config from the house vocabulary.
- [ ] Composition registered in `src/Root.tsx` with the **kebab-case id** from the Definition of done,
      at the exact width, height, fps and frame count it gives.
- [ ] Fonts loaded with exactly the weights used.
- [ ] Content inside `SAFE`; type on the house scale (dense data layers exempt); one accent.
- [ ] `npx remotion still <id> --frame=<checkFrame> …` rendered, **opened, and looked at** — it shows
      the effect mid-motion, not settled and not blank.
- [ ] Any deviation from the brief named explicitly in your final message.
