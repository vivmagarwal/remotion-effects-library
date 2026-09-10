Build a Remotion composition called **VhsVintage**: clean source graded into 1987 videotape using
`@remotion/effects`.

**Setup**
`@remotion/effects` runs on WebGL2. Without this it renders black:

```ts
// remotion.config.ts
import {Config} from '@remotion/cli/config';
Config.setChromiumOpenGlRenderer('angle');
```

(or pass `--gl=angle` on the CLI). Import each effect from its own subpath, e.g.
`@remotion/effects/scanlines`.

**The stack — order is the whole point**
Apply all of these in a single `effects` array on a `<CanvasImage>` (or a `<Video>` from
`@remotion/media` to grade footage):

1. `barrelDistortion({amount: 0.11})` — bends the picture like a CRT tube.
2. `chromaticAberration({amount: 2.6})` — colour channels misregistering.
3. `scanlines({amount: 0.3, spacing: 4, thickness: 1, offset: (frame * 0.55) % 4})` — the `offset`
   scrolls them slowly so the picture never sits perfectly still.
4. `noise({amount: 0.11, seed: frame})` — reseeding on the frame gives fresh grain each frame; a
   constant seed freezes the grain into a static texture, which instantly looks wrong.
5. `vignette({amount: 0.62, radius: 0.72, feather: 0.55})` — tube falloff.

**The barrel must come first.** Effects apply in array order, so putting it first means the scanlines
and grain are laid over an already-curved picture and stay straight — which is what a real tube does.
Put the barrel last and it bends the scanlines too, and the illusion collapses.

**Bad frames**
Every ~7 frames, roll `random(\`bad-${Math.floor(frame / 7)}\`) > 0.86`. On a bad frame, raise the
aberration to 7 and shift the whole image sideways by `(random(\`wob-${frame}\`) - 0.5) * 12` px via
`translate`. Seeding on `Math.floor(frame / 7)` holds a bad patch for several frames instead of
strobing every frame — a single-frame glitch is invisible at 30fps.

**Furniture**
- A head-switching band: a 26px full-width strip with
  `linear-gradient(rgba(255,255,255,0) 0%, rgba(255,255,255,0.22) 40%, rgba(255,255,255,0.05) 100%)`,
  `mixBlendMode: 'screen'`, whose `top` is `(100 - ((frame * 1.6) % 130)) - 8` in percent, so it
  drifts up the frame and wraps.
- On-screen display in VT323 (`@remotion/google-fonts/VT323`), pale green `#eafff2` with
  `textShadow: '0 0 14px rgba(160,255,200,0.7)'`: `▶ PLAY` top-left, blinking via
  `Math.floor(frame / 12) % 4 === 3 ? 0.35 : 1`, and a running timecode bottom-right derived from
  `Math.floor(frame / fps)`.

**Requirements**
- One self-contained `.tsx` file exporting `VhsVintage`.
- Props: `src` (defaults to a `staticFile()` placeholder), `timecode`, `label`, `intensity` — where
  `intensity` scales every effect amount at once.
- Effects can be applied to `<Video>`, `<CanvasImage>`, `<Solid>` and `<HtmlInCanvas>` — anything
  canvas-backed. They cannot be applied to a plain `<div>`.
