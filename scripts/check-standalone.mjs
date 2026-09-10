#!/usr/bin/env node
/**
 * Gate: a brief must stand on its own.
 *
 * The prompt is handed to an agent with an empty directory and no memory of this
 * conversation. A sentence that points at "this repo" or "the library", or a
 * `staticFile('plate-4.svg')` naming a file that agent will never have, is a
 * dead end — and 16% of the library used to be unbuildable for exactly that
 * second reason: 8 of 9 assets appeared in 0 of 88 prompts.
 */
import {readFileSync, existsSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {walkEffects, walkPublic, PROMPT_KIT_DIR} from './lib/fs.mjs';
import {readMeta} from './lib/meta.mjs';
import {gate, rel} from './lib/gate.mjs';

const g = gate('check:standalone');

/** Case-insensitive. Each of these means "you had to have been there". */
const FORBIDDEN = ['this repo', 'the library', 'as elsewhere', 'see also', 'as above in'];

const assets = new Set(walkPublic());
const assetBasenames = new Set([...assets].map((a) => a.slice(a.lastIndexOf('/') + 1)));

const scanPhrases = (text, where, report) => {
  const lines = text.split('\n');
  for (const phrase of FORBIDDEN) {
    lines.forEach((line, i) => {
      const at = line.toLowerCase().indexOf(phrase);
      if (at !== -1) report(`${where}:${i + 1}`, `contains "${phrase}"`, line.trim());
    });
  }
};

const scanStaticFiles = (text, where, report) => {
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/staticFile\(\s*['"`]([^'"`]+)['"`]\s*\)/g)) {
      const path = m[1].replace(/^\/+/, '');
      if (assets.has(path)) continue;
      // `staticFile('…')` in prose is a placeholder, not a reference. A real one
      // always carries a file extension.
      if (/[…]|\.\.\./.test(path) || !/\.[A-Za-z0-9]{2,5}$/.test(path)) continue;
      const hint = assetBasenames.has(path.slice(path.lastIndexOf('/') + 1))
        ? 'the file exists under public/ but at a different path — staticFile() needs the subdirectory'
        : 'no such file under public/';
      report(`${where}:${i + 1}`, `staticFile('${path}') — ${hint}`, line.trim());
    }
  });
};

let checked = 0;
for (const e of walkEffects()) {
  const meta = readMeta(e.metaPath);
  const brief = readFileSync(e.promptPath, 'utf8');
  const source = readFileSync(e.tsxPath, 'utf8');
  checked++;

  scanPhrases(brief, rel(e.promptPath), (where, msg, detail) => g.fail(where, `${meta.id}: ${msg}`, detail));
  scanStaticFiles(brief, rel(e.promptPath), (where, msg, detail) => g.fail(where, `${meta.id}: ${msg}`, detail));

  // The component is the other half: a default the brief cannot supply is the
  // same dead end, one indirection further away.
  scanStaticFiles(source, rel(e.tsxPath), (where, msg, detail) =>
    g.fail(where, `${meta.id}: component ${msg}`, detail),
  );
}

// The prompt-kit ships in every composed prompt, so a forbidden phrase there is
// 88 forbidden phrases. Reported, not gated — the kit is not a brief.
if (existsSync(PROMPT_KIT_DIR)) {
  for (const f of readdirSync(PROMPT_KIT_DIR).filter((x) => x.endsWith('.md'))) {
    scanPhrases(readFileSync(join(PROMPT_KIT_DIR, f), 'utf8'), `src/prompt-kit/${f}`, (where, msg) =>
      g.note(`${where} ${msg} — it reaches every composed prompt`),
    );
  }
}

g.done(`${checked} briefs are self-contained; every staticFile() names a real file under public/.`);
