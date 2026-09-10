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

/**
 * The frame count, the frame rate and the frame size, as the BRIEF states them.
 *
 * A brief is written by hand and the composition is registered from `meta.ts`,
 * so the two drift silently and only a reader notices — after they have built
 * the wrong thing. `tiktok-captions` opened with "1080x1920 (vertical), 30fps,
 * 135 frames" for a 190-frame composition, and 135 frames cuts the last four
 * words off the transcript it ships with.
 *
 * ANCHORED TO THE FRAME RATE, and only there. Every brief declares its format on
 * one line, in one order — size, fps, length — so a line carrying an `fps` is a
 * declaration and every number on it is being declared. Read those numbers
 * anywhere else and the gate is wrong far more often than right: "344x706" is a
 * phone mock, "~32 frames" is how long a highlight takes, "staggered 14 frames
 * apart" is a stagger. The first version of this check reported all three and 29
 * more like them, which is how a gate teaches people to ignore it.
 *
 * The cost of the anchor is that a declaration wrapped across two lines is not
 * read. That is the right way to be wrong.
 */
const scanDimensions = (text, meta, where, report) => {
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const at = `${where}:${i + 1}`;

    // A line carrying BOTH a size and a frame rate is the declaration. One
    // carrying only a frame rate is prose — "slowing to 0.2x honestly requires
    // 150fps in the camera" is about a camera, not about this composition.
    const size = [...line.matchAll(/\b(\d{3,4})\s*[x\u00d7]\s*(\d{3,4})\b/g)];
    const fps = [...line.matchAll(/\b(\d{1,3})\s*fps\b/gi)];
    if (size.length > 0 && fps.length > 0) {
      for (const m of size) {
        const [w, h] = [Number(m[1]), Number(m[2])];
        if (w !== meta.width || h !== meta.height) {
          report(at, `says ${w}x${h}; the composition is ${meta.width}x${meta.height}`, line.trim());
        }
      }
      for (const m of fps) {
        if (Number(m[1]) !== meta.fps) {
          report(at, `says ${m[1]}fps; the composition is ${meta.fps}fps`, line.trim());
        }
      }
    }

    // The LENGTH only in the canonical run — "1080x1920, 30fps, 190 frames".
    // A declaration line may legitimately go on to count something else
    // ("30fps. Four shots of 52 / 52 / 52 / 60 frames"), so anything after the
    // clause that follows the frame rate is left alone.
    const decl = line.match(
      /\b\d{3,4}\s*[x\u00d7]\s*\d{3,4}\b[^.\n]{0,40}?\b\d{1,3}\s*fps\b\s*[,;]\s*\*{0,2}(\d{2,4})\s+frames\b/i,
    );
    if (decl && Number(decl[1]) !== meta.durationInFrames) {
      report(at, `says ${decl[1]} frames; the composition is ${meta.durationInFrames}`, line.trim());
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
  scanDimensions(brief, meta, rel(e.promptPath), (where, msg, detail) =>
    g.fail(where, `${meta.id}: the brief ${msg}`, detail),
  );

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

g.done(
  `${checked} briefs are self-contained; every staticFile() names a real file under public/, ` +
    `and every size, frame rate and length matches the composition.`,
);
