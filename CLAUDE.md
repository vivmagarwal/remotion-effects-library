# CLAUDE.md

Remotion Effects Library — 96 self-contained Remotion effects (185 compositions), a Vite gallery
published to GitHub Pages, and a composed, gated AI prompt for every effect.

## Rules that are not negotiable

- **One file per effect.** A component in `src/effects/**` may not import another effect, a shared
  helper, or `src/theme.ts`. Duplication is deliberate — the file is what users copy.
- **Frame-driven.** Every moving value derives from `useCurrentFrame()`. No CSS animation, timers,
  `Date.now()` or `Math.random()` (use `random(seed)`).
- **Theme is a prop with an inline house default**, `theme = THEME` first in the destructure.
- **Generated files are committed and never hand-edited:** `src/registry.generated.ts`
  (`npm run registry`), `src/effects/diagrams/viz-gallery/variants.generated.ts` (`npm run viz:variants`).
- **Run `npm run gate:fast` before committing.** Render the frame and look at it; for diagrams and
  anything player-related, look at the built gallery in a browser — `renderStill` is not the viewer's
  path.
- Every `check:*` npm script must have a row in the README gate table (`check:taxonomy` enforces it).

## Documentation Pointers

| Doc | Read it for |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | What the project is, the module map, how an effect reaches each surface, core decisions |
| [docs/DEVELOPMENT_STANDARDS.md](docs/DEVELOPMENT_STANDARDS.md) | Setup, commands, code standards, how to add an effect/variant/category/theme/gate, troubleshooting |
| [docs/EFFECT_AUTHORING_GUIDE.md](docs/EFFECT_AUTHORING_GUIDE.md) | The effect contract: component rules, every `meta.ts` field, briefs, variants, vocabularies |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Theme tokens, the five themes, `themeFor()`, the house style (type scale, easing, springs, safe areas) |
| [docs/PROMPT_KIT_GUIDE.md](docs/PROMPT_KIT_GUIDE.md) | How a prompt is composed, module selection, the composer API, validation |
| [docs/GALLERY_GUIDE.md](docs/GALLERY_GUIDE.md) | The Vite app: routes, smoke harnesses, facets, detail sheet, base path |
| [docs/QUALITY_GATES_GUIDE.md](docs/QUALITY_GATES_GUIDE.md) | Every gate, its failure conditions and thresholds, CI wiring |
| [docs/MEDIA_ASSETS_GUIDE.md](docs/MEDIA_ASSETS_GUIDE.md) | `public/`, the provenance manifest, regenerating footage/audio/plates/transcripts |
| [docs/DIAGRAMS_VIZ_GUIDE.md](docs/DIAGRAMS_VIZ_GUIDE.md) | edododraw, the viz-gallery renderer, generated variants, verifying a diagram change |
| [docs/VIDEO_EDITING_GUIDE.md](docs/VIDEO_EDITING_GUIDE.md) | The edit/grade/captions/sound categories, media API pitfalls, the transcript-driven workflow |
| [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) | GitHub Pages pipeline, environment variables, CI jobs, rollback |
