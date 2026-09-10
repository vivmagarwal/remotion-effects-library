## If you do not already have a Remotion project

```bash
npx create-video@latest --yes --blank --no-tailwind my-video
cd my-video
npm i
```

If a Remotion project already exists, work inside it and skip all of this.

Verified against `create-video@4.0.523` (the release that ships alongside Remotion 4.0.522) and the
`remotion-dev/template-empty` repository it clones:

- **`--yes` requires a template flag** (`--blank` here) or it exits with *"A template must be
  specified when using --yes"*. It also skips the "install agent skills?" prompt, which is what you
  want — this prompt is self-sufficient.
- **`--no-tailwind` is honoured, but only alongside `--yes`.** With `--yes` and no `--no-tailwind`,
  Tailwind is added on purpose (`shouldOverrideTailwind = !isNoTailwindFlagSelected()`): you get
  `@remotion/tailwind-v4` + `tailwindcss` in `package.json`, an `src/index.css`, and the bundler
  override in `remotion.config.ts`. Harmless, but unnecessary — and **never animate with Tailwind**
  either way; `animate-*` classes are wall-clock CSS and are forbidden.
- **The scaffold registers its composition in `src/Composition.tsx`, not in `src/Root.tsx`.**
  `src/index.ts` calls `registerRoot(RemotionRoot)`; `src/Root.tsx` exports `RemotionRoot`, which
  renders `<MyComposition />`; and `src/Composition.tsx` holds the actual
  `<Composition id="MyComp" … 1280×720, 60 frames, 30 fps>` plus a `calculateMetadata` stub. So when
  this prompt says "register it in `src/Root.tsx`", either add your `<Composition>` inside
  `RemotionRoot`'s fragment or replace the one in `Composition.tsx` — **look in both files** before
  concluding nothing is registered. The starter's `1280×720 / 60 frames` is not the size you want;
  set the dimensions the Definition of done gives.
- **`public/` is always created** by the scaffold, even for the blank template. Put assets there and
  reference them with `staticFile()`.
- **The generated `remotion.config.ts` does NOT set an OpenGL renderer.** It contains only
  `Config.setRspack(true)`, `Config.setVideoImageFormat('jpeg')` and `Config.setOverwriteOutput(true)`.
  If this effect uses `@remotion/effects`, `@remotion/three`, a shader-based `@remotion/transitions`
  presentation, or `<HtmlInCanvas>`, **add this line or you get blank frames with no error**:

  ```ts
  Config.setChromiumOpenGlRenderer('angle');
  ```

- The blank template's npm scripts are `dev` (`remotion studio`), `build` (`remotion bundle`),
  `upgrade` and `lint`. **There is no `start`.** Use `npx remotion studio --no-open` directly.
- If `npx create-video` fails with `Error: Cannot find module 'tar'`, the npx cache entry is corrupt.
  Delete the directory printed in the stack trace (under `~/.npm/_npx/`) and re-run.
- The **first** render or Studio launch downloads a ~93 MB Chrome Headless Shell. That is expected;
  give it a minute and do not kill it.
