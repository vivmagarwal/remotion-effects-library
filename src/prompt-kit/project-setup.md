## If you do not already have a Remotion project

```bash
npx create-video@latest --yes --blank my-video
cd my-video
npm i
```

Notes on the scaffold, verified against 4.0.522:

- It gives you `src/index.ts` (the entry point, calls `registerRoot`), `src/Root.tsx`, and `public/`
  for static assets — but the starter's `<Composition>` is registered inside **`src/Composition.tsx`**,
  which `Root.tsx` merely renders. Look there, not only in `Root.tsx`, before concluding nothing is
  registered.
- `--no-tailwind` is currently **ignored**: the template ships `@remotion/tailwind-v4`, an
  `src/index.css` with `@import "tailwindcss";`, and `Config.overrideBundlerConfig(enableTailwind)` in
  `remotion.config.ts`. Harmless — but do not rely on Tailwind for animation either way (see below).
- If `npx create-video` fails with `Error: Cannot find module 'tar'`, the npx cache entry is corrupt.
  Delete the offending directory printed in the stack trace (under `~/.npm/_npx/`) and re-run.
- The **first** render or Studio launch downloads a ~93 MB Chrome Headless Shell. That is expected;
  give it a minute and do not kill it.

If a Remotion project already exists, work inside it and skip all of this.
