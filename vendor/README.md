# vendor/

## `edododraw-0.15.0.tgz`

`edododraw` is this project's own package (`../edodo-draw`), and 0.15.0 is **not on npm yet**. It
carries two fixes this library depends on and cannot work around:

1. **`sideEffects` in `package.json` now matches shipped JavaScript.** The globs used to point at
   `**/viz/generators/*.ts`, and the published build has only `.d.ts` files there — every line of real
   JS lives in `dist-lib/index.js` and `dist-lib/chunks/*.js`. So the declaration matched nothing, the
   package looked side-effect-free, and a production bundler legally removed the modules whose import
   side effect registers the visualization templates. An unregistered `viz` type **warns rather than
   errors**, so `viz clouds { … }` compiled to a scene with zero nodes and rendered a clean blank
   frame. Every gate was green, the dev server was fine, and only the production Vite build tree-shook.
   `npm run check:edd` now fails on both halves of that: a glob matching no `.js`, and a template
   compiling to an empty scene.

2. **`CLASSIC_PRESET` draws smooth strokes.** `roughness: 0.45`, `bowing: 0.4`,
   `maxRandomnessOffset: 1`, `preserveVertices: true`, `disableMultiStroke: true`. rough.js perturbs
   geometry in *world* units, so a camera `scale(zoom)` magnifies the jitter and the stroke width
   together and two rough edges next to each other read as a mistake at any size above about 1.5×. The
   old values are still available as `CLASSIC_ROUGH_PRESET`.

Until 0.15.0 is published, `package.json` installs from this file so a fresh clone works. **After
publishing, replace it with `"edododraw": "^0.15.0"` and delete this directory** — a vendored tarball
is a workaround with a shelf life, not a dependency strategy.
