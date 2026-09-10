#!/usr/bin/env node
/**
 * Gate: props that only work as props on `@remotion/media`'s `<Video>`/`<Audio>`.
 *
 * `<Video>` decodes into a canvas. CSS that acts on a replaced element — first
 * and foremost `object-fit` — therefore has nothing to act on, and putting it in
 * `style` does nothing. The package logs a warning at verbose level and is
 * otherwise silent.
 *
 * This shipped in 8 places. It was invisible in 7 of them because the source and
 * the composition shared an aspect ratio, so `cover` and `contain` and no crop
 * at all are the same picture. The eighth was 16:9 footage in a 9:16 caption
 * frame, where it rendered as a letterboxed strip floating in black — and a
 * human had to notice.
 *
 * `objectPosition` is worse: there is no prop form at all, so it is not a
 * misplaced style, it is a style that cannot work. Bias a crop with
 * `cropLeft`/`cropRight`/`cropTop`/`cropBottom`, which take fractions.
 *
 * Run: node scripts/check-media-props.mjs
 */
import {readFileSync} from 'node:fs';
import {walkEffects, PROMPT_KIT_DIR} from './lib/fs.mjs';
import {gate, rel} from './lib/gate.mjs';

const g = gate('check:media-props');

/** style key → what to do instead. */
const MISPLACED = {
  objectFit: 'move it to the `objectFit` prop: <Video objectFit="cover" style={{…}} />',
  objectPosition:
    'there is no prop form — `cover` centres; bias the crop with cropLeft/cropRight/cropTop/cropBottom (fractions)',
};

/** End index of a JSX opening tag that starts at `from`, brace-aware. */
const openingTagEnd = (src, from) => {
  let depth = 0;
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '>' && depth === 0) return i;
  }
  return src.length;
};

let elements = 0;
for (const e of walkEffects()) {
  const src = readFileSync(e.tsxPath, 'utf8');
  const imp = src.match(/import\s*\{([^}]*)\}\s*from '@remotion\/media'/);
  if (!imp) continue;
  const tags = imp[1]
    .split(',')
    .map((n) => n.trim().split(/\s+as\s+/).pop())
    .filter(Boolean);
  if (tags.length === 0) continue;

  for (const m of src.matchAll(new RegExp(`<(${tags.join('|')})\\b`, 'g'))) {
    elements++;
    const el = src.slice(m.index, openingTagEnd(src, m.index + m[0].length));
    const styleAt = el.search(/style=\{/);
    if (styleAt === -1) continue;
    const style = el.slice(styleAt);
    for (const [key, advice] of Object.entries(MISPLACED)) {
      if (!new RegExp(`\\b${key}\\s*:`).test(style)) continue;
      const line = src.slice(0, m.index).split('\n').length;
      g.fail(`${rel(e.tsxPath)}:${line}`, `<${m[1]}> sets \`${key}\` inside \`style\`, where it does nothing`, [
        advice,
        '<Video> draws to a canvas, so CSS for replaced elements is inert. This is silent whenever',
        'the source and the composition share an aspect ratio, which is most of the time.',
      ]);
    }
  }
}

// A brief teaches by example, so a code fence with the bug in it is the bug.
for (const e of walkEffects()) {
  const brief = readFileSync(e.promptPath, 'utf8');
  brief.split('\n').forEach((line, i) => {
    if (!/<(?:Video|Audio)\b/.test(line) && !/^\s*(?:style=)?\{\{/.test(line)) return;
    for (const key of Object.keys(MISPLACED)) {
      if (!new RegExp(`style=\\{\\{[^}]*\\b${key}\\s*:`).test(line)) continue;
      g.fail(`${rel(e.promptPath)}:${i + 1}`, `the brief shows \`${key}\` inside a <Video> style`, [
        line.trim(),
        MISPLACED[key],
        'An agent building from this brief will copy the line, and the bug ships again.',
      ]);
    }
  });
}

// The rule is only useful if the brief that teaches it says so too.
const kit = readFileSync(`${PROMPT_KIT_DIR}/video.md`, 'utf8');
if (!/objectFit`? is a (?:\*\*)?PROP/i.test(kit)) {
  g.fail('src/prompt-kit/video.md', 'the video kit does not state that `objectFit` is a prop, not a style', [
    'Every prompt that ships <Video> inherits this file. If it is not here, the next',
    'agent to write a video effect will put objectFit in style, exactly as this library did.',
  ]);
}

g.done(`${elements} @remotion/media element(s) — every canvas-only prop is passed as a prop.`);
