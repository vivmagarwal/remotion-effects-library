## GPU effects, custom shaders, and the `--gl=angle` requirement

### The rule that decides whether anything on this page appears at all

**Everything in `@remotion/effects`, every shader-based `@remotion/transitions` presentation, and
every `createEffect` with a `webgl2` or `webgpu` backend needs WebGL2.** Without it they render
**blank, with no error** — the frames either side of a transition look perfect, so a spot check that
misses the middle proves nothing.

```ts
// remotion.config.ts
Config.setChromiumOpenGlRenderer('angle');
```

or `--gl=angle` on the CLI. The legal values are `swangle | angle | egl | swiftshader | vulkan |
angle-egl`; **`--gl=swiftshader` throws "Failed to create WebGL2 context"**. Always render a
**mid-effect** frame with `--gl=angle` and look at it.

---

### 1. `@remotion/effects` — how it attaches

`npx remotion add @remotion/effects`. One subpath per effect (the package has ~70). They go in an
`effects` array on a `<Video>`, `<Img>`, `<CanvasImage>`, `<AbsoluteFill>` or an `<Interactive.*>`,
and they run on the decoded texture — not as a CSS filter.

```tsx
import {colorCorrection} from '@remotion/effects/color-correction';
import {glow} from '@remotion/effects/glow';

<Video src={SRC} effects={[colorCorrection({temperature: -0.18, saturation: 1.12}),
                           glow({threshold: 0.75, radius: 30, intensity: 0.6, color: '#FFB27A'})]} />
```

Order matters: the array is a chain, applied first to last.

### 2. The ranges are NOT uniform, and out-of-range values throw at runtime

This is the single most common `@remotion/effects` bug. `brightness()` takes a **signed offset in
−1…1**, so `brightness({amount: 1.06})` throws — you want `0.06`. But `contrast()` and `saturation()`
are **multipliers where 1 is neutral**, so `1.5` is valid and `0.06` is nearly a flat grey. There is
no single convention across the package. **Read the subpath's own `.d.ts`.** The doc comment on each
param states its range and default.

Verified catalogue of the ones worth reaching for (parameter — range — default):

| subpath | parameters |
|---|---|
| `brightness` | `amount` **−1…1 signed offset**, d 0 |
| `contrast` | `amount` **multiplier**, 1 = neutral, d 1 |
| `saturation` | `amount` **multiplier**, 1 = neutral, 0 = grey, d 1 |
| `exposure` | `stops` −5…5, d 0 |
| `color-correction` | `exposure` −5…5 · `contrast` mult, d 1 · `pivot` 0…1, d 0.5 · `shadows`/`highlights`/`whites`/`blacks` −1…1 · `temperature`/`tint` −1…1 · `saturation` mult, d 1 · `vibrance` −1…1 |
| `levels` | `blackPoint` 0…1 d 0 · `whitePoint` 0…1 d 1 · `gamma` 0.01…10 d 1 |
| `white-balance` | `temperature` −1…1 · `tint` −1…1 |
| `shadows-highlights` | `shadows` −1…1 · `highlights` −1…1 |
| `vibrance` | `amount` −1…1 |
| `hue` | `degrees` (any), d 0 |
| `grayscale` / `invert` | `amount` mix 0…1, d 1 |
| `tint` | `color` **required** · `amount` 0…1, d 0.5 |
| `duotone` | `darkColor` d `#000000` · `lightColor` d `#ffffff` · `threshold` 0…1, d 0.5 |
| `color-key` | `keyColor` d `#00ff00` · `similarity` 0…1 d 0.18 · `smoothness` 0…1 d 0.08 · `spillSuppression` 0…1 d 0.25 |
| `blur` | `radius` **required** px · `horizontal` d true · `vertical` d true |
| `region-blur` | `topLeft` and `bottomRight` **required** UV pairs · `blurRadius` 0…200 px d 40 · `feather` 0…200 px d 0 · `roundness` 0…1 d 0 |
| `vignette` | `amount` 0…1 d 0.5 · `radius` 0…1 d 0.65 · `feather` 0…1 d 0.35 · `roundness` 0…1 d 1 · `color` d `#000000` · `mode` `'color'`\|`'alpha'` · `center` UV d `[0.5, 0.5]` |
| `glow` | `radius` px d 20 · `intensity` mult d 1 · `threshold` 0…1 d 0 · `color` d white |
| `drop-shadow` | `radius` px d 12 · `offsetX` d 8 · `offsetY` d 8 · `opacity` 0…1 d 0.5 · `color` d black |
| `outline` | `width` 0…100 d 8 · `edgeSimplification` 0…100 d 0 · `color` d `#ffffff` · `opacity` 0…1 |
| `light-trail` | `direction` deg d 180 · `distance` px d 80 · `intensity` d 1 · `decay` d 0.9 · `threshold` 0…1 d 0 · `samples` d 32 · `color` d white |
| `shine` | `progress` 0…1 d 0.5 · `angle` deg d 30 · `haloSigma` px d 200 · `coreSigma` px d 65 · `haloIntensity` 0…1 d 0.3 · `coreIntensity` 0…1 d 0.4 |
| `chromatic-aberration` | `amount` px d 8 · `angle` deg d 0 |
| `white-noise` | `amount` 0…1 d 1 · `seed` d 0 |
| `scanlines` | `amount` 0…1 d 0.15 · `spacing` px d 4 · `thickness` px d 1 · `offset` px d 0 · `premultiply` d false |
| `light-leak` | `seed` d 0 · `hueShift` 0…360 d 0 · `progress` 0…1 d 0.5 |
| `pixelate` | `blockSize` |
| `pixel-dissolve` | `progress` · `columns` · `rows` · `seed` · `feather` |
| `halftone` | `dotSize` 1…200 d 20 · `dotSpacing` 1…200 d 20 · `rotation` deg d 0 · shape `'circle'\|'square'\|'line'` · sampling `'bilinear'\|'nearest'` · colorMode `'solid'\|'source'` |
| `evolve` | `progress` 0…1 · `direction` `'left'\|'right'\|'top'\|'bottom'` · `feather` |
| `corner-pin` | `topLeft`/`topRight`/`bottomRight`/`bottomLeft` UV pairs — a homography, i.e. screen replacement |
| `roughen-edges` | `amount` 0…1 d 1 · `border` px d 26.5 · `scale` 0.01…4 d 0.07 · `seed` 0…1000 d 231.2 |

Two that need a frame-driven parameter rather than a constant: **`white-noise`** — drive `seed` from
`frame` for live film grain; a fixed seed gives frozen "dirty sensor" grain, which is a different
(also useful) look. **`scanlines`** — animate `offset` to scroll them.

### 3. `createEffect` — writing your own

`createEffect` **is** exported from `remotion` (verified: it is on `Object.keys(require('remotion'))`).
It is the supported way to ship a custom 2D-canvas, WebGL2 or WebGPU pass that also shows up in the
Studio properties panel. The definition, verbatim from
`node_modules/remotion/dist/cjs/effects/effect-types.d.ts`:

```ts
export declare const createEffect: <P, S>(definition: EffectDefinition<P, S>) => EffectFactory<P>;

export type EffectDefinition<P, S = unknown> = {
  readonly type: string;
  readonly label: string;
  readonly documentationLink: string | null;
  readonly backend: '2d' | 'webgl2' | 'webgpu';
  /** Two descriptors with the same definition and the same calculateKey(params) are
   *  treated as equivalent for memoization. */
  readonly calculateKey: (params: P) => string;
  readonly setup: (target: HTMLCanvasElement) => S;
  readonly apply: (params: EffectApplyParams<P, S>) => void;
  readonly cleanup: (state: S) => void;
  readonly schema: InteractivitySchema;
  /** Throws when mandatory params are missing or invalid. Called before returning a descriptor. */
  readonly validateParams: (params: P) => void;
};

export type EffectApplyParams<P, S> = {
  readonly source: CanvasImageSource;
  readonly target: HTMLCanvasElement;
  readonly state: S;
  readonly params: P;
  readonly width: number;
  readonly height: number;
  readonly gpuDevice: unknown | null;
  /** When true, WebGL texImage2D uploads use UNPACK_FLIP_Y_WEBGL. */
  readonly flipSourceY: boolean;
};
```

Four things that decide whether it works:

- **`setup` runs once per target canvas; `apply` runs per frame.** Compile the program, allocate the
  buffers and look up the uniform locations in `setup`, stash them in `S`, and in `apply` only bind,
  upload and draw. Compiling a shader per frame is the usual cause of a render that takes hours.
- **`calculateKey(params)` must be a stable string over the params that matter.** Return the same
  string for two equivalent params objects or the effect is torn down and rebuilt every render.
- **`apply` must be pure with respect to `params`** — no counters, no `Math.random()`, no time read
  from anywhere but `params`. Pass `frame / fps` in as a param.
- **`flipSourceY` is not decorative.** Honour it when you `texImage2D` from `source`, or your effect
  renders upside down for DOM sources and right-way-up for WebGL ones (or the reverse).
- `cleanup(state)` must free every GL object it allocated.

`backend: '2d'` gets a plain `CanvasRenderingContext2D` and needs no `--gl` flag. `'webgl2'` and
`'webgpu'` do.

### 4. `@remotion/transitions` — which half draws through WebGL

Verified by checking whether each presentation's `.d.ts` also exports a `…Shader`:

**DOM, always works:** `fade`, `slide`, `wipe`, `clockWipe`, `iris`, `flip`, `pushCut`, `none`.

**Shader, needs WebGL2:** `bookFlip`, `crossZoom`, `crosswarp`, `dissolve`, `dreamyZoom`, `filmBurn`,
`linearBlur`, `ripple`, `swap`, `zoomBlur`, `zoomInOut`.

The shader half draws through `<HtmlInCanvas>` + WebGL2, and on an environment without it they render
**a blank white frame with no error**. Tell them apart by whether the presentation's module also
exports a `…Shader`. If a brief calls for one, either set `--gl=angle` and verify a mid-transition
frame, or use a DOM presentation.

`makeHtmlInCanvasPresentation<T>(shader)` on the package root is the documented way to author your own
GLSL transition; `TransitionSeries.Overlay` puts an element **across** a cut without shortening the
timeline, which is what you want for a flash, a light leak or a whoosh over a cut list derived from
timestamps.

---

### Before you ship a GPU effect

- [ ] `Config.setChromiumOpenGlRenderer('angle')` is in `remotion.config.ts`, or every command in your
      report passes `--gl=angle`.
- [ ] Every parameter was read off its own `.d.ts` — you did not assume the range from a neighbour.
- [ ] The check frame is **mid-effect**, rendered with angle, and you opened it. A blank white frame
      is this module's default failure, not a rare one.
- [ ] Any `createEffect` compiles its program in `setup`, returns a stable `calculateKey`, honours
      `flipSourceY`, and frees everything in `cleanup`.
