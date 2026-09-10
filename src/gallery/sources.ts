/**
 * Pulls the *actual* file contents of every effect at build time, so the code
 * shown in the gallery can never drift from the code that produced the preview.
 * Vite-only (import.meta.glob) — which is fine, the gallery is the only Vite entry.
 *
 * This file used to carry its OWN `composePrompt`/`installLine`, forked from
 * `scripts/emit-prompts.mjs` and strictly worse than it: no generated props
 * table, no `npm i -D @types/…` line, no synced Setup block, and a check frame
 * of `round(durationInFrames * 0.6)` instead of the curated `meta.checkFrame`.
 * The gallery's "Copy prompt" button therefore shipped a DIFFERENT prompt from
 * the one `npm run check:prompts` gates. Both callers now go through the single
 * composer in `src/prompt-kit/compose.mjs`, and `npm run check:compose` proves
 * they agree byte for byte.
 */
import type {EffectMeta} from '../types';

const componentSources = import.meta.glob('../effects/**/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const promptSources = import.meta.glob('../effects/**/prompt.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/**
 * Every prompt-kit module, by filename. A glob rather than named imports so a
 * new `src/prompt-kit/<module>.md` is picked up with no change here — the
 * composer's own KIT_FILES table decides which of them an effect needs.
 */
const kitFiles = import.meta.glob('../prompt-kit/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const baseName = (path: string) => path.slice(path.lastIndexOf('/') + 1);

/** `{filename: contents}` — exactly the shape `buildKit()` takes on the Node side. */
const kitByName: Record<string, string> = Object.fromEntries(
  Object.entries(kitFiles).map(([path, text]) => [baseName(path), text]),
);

/** `file` is the registry's path relative to src/effects. */
export const sourceOf = (file: string): string =>
  componentSources[`../effects/${file}`] ?? '// source not found';

export const briefOf = (file: string): string => {
  const dir = file.split('/').slice(0, -1).join('/');
  return promptSources[`../effects/${dir}/prompt.md`] ?? '';
};

type PromptKit = {
  coreMd?: string;
  houseStyleMd?: string;
  projectSetupMd?: string;
  modules?: Record<string, string | undefined>;
};

type ComposeModule = {
  composePrompt?: (input: {
    meta: EffectMeta;
    brief: string;
    componentSource: string;
    kit: PromptKit;
  }) => string;
  buildKit?: (files: Record<string, string>) => PromptKit;
};

/**
 * The shared composer, resolved through a glob rather than a static import.
 * `compose.mjs` is untyped ESM, so a static `import … from` would need
 * `allowJs` and would be a hard build error on any day the module is mid-write;
 * the glob degrades to an empty record instead.
 */
const composeModules = import.meta.glob('../prompt-kit/compose.mjs', {
  eager: true,
}) as Record<string, ComposeModule>;

const composer = composeModules['../prompt-kit/compose.mjs'];

/** True when the shared composer is wired up. The UI says so when it is not. */
export const promptComposerReady = Boolean(composer?.composePrompt);

const kit: PromptKit = composer?.buildKit ? composer.buildKit(kitByName) : {};

/**
 * The full, self-sufficient prompt: everything an agent with no Remotion skills
 * installed and no memory of this conversation needs to rebuild the effect.
 *
 * There is deliberately NO local fallback composition. A second implementation
 * here is precisely the bug that was just removed — it would silently ship a
 * prompt no gate has ever seen.
 */
export const promptFor = (meta: EffectMeta, file: string): string => {
  const compose = composer?.composePrompt;
  if (!compose) {
    return [
      `# ${meta.name} — prompt unavailable`,
      '',
      'The shared prompt composer (`src/prompt-kit/compose.mjs`) is missing from this',
      'build, so the gallery has nothing to compose from. It deliberately does not fall',
      'back to a copy of its own: a forked composer is what made this button ship a',
      'different prompt from the gated one.',
      '',
      `Run \`npm run prompts\` and read \`out/prompts/${meta.id}.md\` instead.`,
    ].join('\n');
  }
  return compose({
    meta,
    brief: briefOf(file),
    componentSource: sourceOf(file),
    kit,
  });
};
