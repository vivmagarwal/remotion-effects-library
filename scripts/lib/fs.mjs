/**
 * The filesystem walk every script needs, once.
 *
 * Seven verbatim copies of `dirs()` used to live in build-registry, emit-prompts,
 * check-dead-frames, check-font-weights, check-prompt-defaults, update-readme and
 * verify — each with its own `for (cat) for (id)` loop around it.
 */
import {readdirSync, statSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

/** Repo root, resolved from this file rather than from process.cwd(). */
export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
export const SRC = join(ROOT, 'src');
export const EFFECTS_DIR = join(SRC, 'effects');
export const PUBLIC_DIR = join(ROOT, 'public');
export const PROMPT_KIT_DIR = join(SRC, 'prompt-kit');
export const OUT_DIR = join(ROOT, 'out');

/** Immediate subdirectories of `p`, unsorted (callers sort). */
export const dirs = (p) => readdirSync(p).filter((d) => statSync(join(p, d)).isDirectory());

/**
 * Every effect on disk, sorted by category then id.
 * Yields the paths so no caller ever re-derives them.
 *
 * @returns {{category: string, id: string, dir: string, tsx: string, tsxPath: string,
 *            componentName: string, metaPath: string, promptPath: string,
 *            file: string}[]}
 */
export const walkEffects = () => {
  const out = [];
  for (const category of dirs(EFFECTS_DIR).sort()) {
    for (const id of dirs(join(EFFECTS_DIR, category)).sort()) {
      const dir = join(EFFECTS_DIR, category, id);
      const tsxFiles = readdirSync(dir).filter((f) => f.endsWith('.tsx'));
      if (tsxFiles.length !== 1) {
        throw new Error(`${category}/${id}: expected exactly one .tsx file, found ${tsxFiles.length}`);
      }
      const tsx = tsxFiles[0];
      out.push({
        category,
        id,
        dir,
        tsx,
        tsxPath: join(dir, tsx),
        componentName: tsx.replace(/\.tsx$/, ''),
        metaPath: join(dir, 'meta.ts'),
        promptPath: join(dir, 'prompt.md'),
        file: `${category}/${id}/${tsx}`,
      });
    }
  }
  return out;
};

/**
 * Every file under public/, as the slash-joined path staticFile() is called
 * with. Recursive: assets live in public/footage, public/audio, public/sfx and
 * so on, and a flat readdir would list the *directories* instead — which
 * silently leaves every real asset out of the subpath remap in
 * src/gallery/main.tsx and 404s the whole media kit on GitHub Pages.
 */
export const walkPublic = (dir = '.', prefix = '') =>
  readdirSync(join(PUBLIC_DIR, dir))
    .filter((f) => !f.startsWith('.'))
    .flatMap((f) => {
      const rel = prefix ? `${prefix}/${f}` : f;
      return statSync(join(PUBLIC_DIR, dir, f)).isDirectory() ? walkPublic(join(dir, f), rel) : [rel];
    });

export {existsSync};
