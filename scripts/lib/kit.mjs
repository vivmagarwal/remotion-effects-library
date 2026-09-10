/**
 * Loads src/prompt-kit/*.md off disk and hands it to the shared composer.
 *
 * The gallery does exactly this with `import.meta.glob('../prompt-kit/*.md',
 * {query: '?raw', eager: true})` and the SAME `buildKit()` — same record shape,
 * same fallbacks — which is what makes `npm run check:compose` able to prove the
 * two produce byte-identical prompts.
 */
import {readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {PROMPT_KIT_DIR} from './fs.mjs';
import {buildKit, KIT_FILES, MODULE_KEYS} from '../../src/prompt-kit/compose.mjs';

/** `{'core.md': '…', 'house-style.md': '…'}` — every .md in src/prompt-kit. */
export const kitFiles = () => {
  const files = {};
  for (const f of readdirSync(PROMPT_KIT_DIR).sort()) {
    if (f.endsWith('.md')) files[f] = readFileSync(join(PROMPT_KIT_DIR, f), 'utf8');
  }
  return files;
};

export const loadKit = () => buildKit(kitFiles());

/** Which kit files the composer looked for and did not find. */
export const missingKitFiles = () => {
  const files = kitFiles();
  const missing = [];
  for (const [key, names] of Object.entries(KIT_FILES)) {
    if (!names.some((n) => typeof files[n] === 'string' && files[n].trim())) {
      missing.push({key, names, optional: MODULE_KEYS.includes(key)});
    }
  }
  return missing;
};
