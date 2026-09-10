#!/usr/bin/env node
/**
 * Gate: the emitter and the gallery produce the SAME prompt, byte for byte.
 *
 * This is the gate the repo most needed. `scripts/emit-prompts.mjs` and
 * `src/gallery/sources.ts` used to be two independent composers, and the one the
 * "Copy prompt" button shipped was the weaker: no props table, no
 * `npm i -D @types/…`, no syncSetupBlock, and a check frame of
 * `round(durationInFrames * 0.6)` — the settled end state — instead of the
 * curated `meta.checkFrame`. `check:prompts` only ever validated the emitter's
 * output, so what users actually copied had never been through a gate.
 *
 * Two halves:
 *   1. structural — sources.ts must call the shared composer and must not
 *      re-implement any part of it;
 *   2. byte-identity — compose every effect twice from the ONE module, once with
 *      the kit keyed the way Node builds it and once keyed the way Vite's
 *      `import.meta.glob` builds it, then diff both against out/prompts/.
 */
import {readFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {composePrompt} from '../src/prompt-kit/compose.mjs';
import {ROOT, OUT_DIR, walkEffects} from './lib/fs.mjs';
import {readMeta} from './lib/meta.mjs';
import {kitFiles, loadKit} from './lib/kit.mjs';
import {gate, rel, lineOfMatch} from './lib/gate.mjs';

const g = gate('check:compose');
const SOURCES = join(ROOT, 'src', 'gallery', 'sources.ts');
const PROMPTS = join(OUT_DIR, 'prompts');

/* ---------------- 1. structural ---------------- */

if (!existsSync(SOURCES)) {
  g.fail(rel(SOURCES), 'src/gallery/sources.ts is missing — the gallery has no prompt path to check.');
} else {
  const src = readFileSync(SOURCES, 'utf8');
  const need = [
    ['prompt-kit/compose.mjs', 'must reference the shared composer at src/prompt-kit/compose.mjs'],
    ['prompt-kit/*.md', "must read the kit with import.meta.glob('../prompt-kit/*.md', {query: '?raw', eager: true})"],
    ['componentSource', 'must pass componentSource so the generated props table is in the copied prompt'],
  ];
  for (const [needle, why] of need) {
    if (!src.includes(needle)) g.fail(rel(SOURCES), why, `no occurrence of \`${needle}\``);
  }
  // The four historical forks, each a hard failure if it ever comes back.
  const banned = [
    [/const\s+installLine\s*[:=]/, 'defines its own installLine() — the @types line drifted away last time'],
    [/const\s+propsTable\s*[:=]/, 'defines its own propsTable() — the gallery shipped no props table at all last time'],
    [/const\s+syncSetupBlock\s*[:=]/, 'defines its own syncSetupBlock()'],
    [/Math\.round\(\s*meta\.durationInFrames\s*\*/, 'derives a check frame from durationInFrames — it must be meta.checkFrame'],
  ];
  for (const [re, why] of banned) {
    if (re.test(src)) g.fail(`${rel(SOURCES)}:${lineOfMatch(src, re)}`, why);
  }
}

/* ---------------- 2. byte-identity ---------------- */

const files = kitFiles();
const nodeKit = loadKit();

/**
 * The kit exactly as Vite hands it to the gallery: every .md keyed by basename,
 * the three always-on sections lifted out, core.md falling back to the pre-split
 * monolith. Same files, different keying — if the composer treated the two
 * differently the gallery would silently drop every module.
 */
const ALWAYS = ['core.md', 'house-style.md', 'theme.md', 'project-setup.md'];
const viteKit = {
  coreMd: files['core.md'] ?? files['remotion-essentials.md'] ?? '',
  houseStyleMd: files['house-style.md'] ?? '',
  themeMd: files['theme.md'] ?? '',
  projectSetupMd: files['project-setup.md'] ?? '',
  modules: Object.fromEntries(Object.entries(files).filter(([n]) => !ALWAYS.includes(n))),
};

if (!existsSync(PROMPTS)) {
  g.fail('out/prompts', 'not found — run `npm run prompts` before `npm run check:compose`.');
  g.done('');
}

let compared = 0;
for (const e of walkEffects()) {
  const meta = readMeta(e.metaPath);
  const input = {
    meta,
    brief: readFileSync(e.promptPath, 'utf8'),
    componentSource: readFileSync(e.tsxPath, 'utf8'),
  };

  const fromNode = composePrompt({...input, kit: nodeKit});
  const fromVite = composePrompt({...input, kit: viteKit});
  const onDisk = existsSync(join(PROMPTS, `${meta.id}.md`))
    ? readFileSync(join(PROMPTS, `${meta.id}.md`), 'utf8')
    : null;

  if (fromNode !== fromVite) {
    g.fail(`${e.file}`, `${meta.id}: the gallery's kit keying yields a different prompt from the emitter's`, firstDiff(fromNode, fromVite));
  }
  if (onDisk === null) {
    g.fail(`out/prompts/${meta.id}.md`, 'was never written by npm run prompts');
  } else if (onDisk !== fromNode) {
    g.fail(`out/prompts/${meta.id}.md`, `${meta.id}: the emitted file is not what the composer produces — re-run npm run prompts`, firstDiff(onDisk, fromNode));
  }
  compared++;
}

function firstDiff(a, b) {
  const la = a.split('\n');
  const lb = b.split('\n');
  for (let i = 0; i < Math.max(la.length, lb.length); i++) {
    if (la[i] !== lb[i]) {
      return [`first difference at line ${i + 1}:`, `  A: ${JSON.stringify(la[i] ?? '<eof>')}`, `  B: ${JSON.stringify(lb[i] ?? '<eof>')}`];
    }
  }
  return ['files differ only in trailing bytes'];
}

g.done(`${compared} prompts — emitter and gallery compose byte-identical output.`);
