#!/usr/bin/env node
/**
 * Gate: a hex literal in a component is one of the house colours (CONTRACT §2).
 *
 * The palette is what makes 180 separately-authored effects look like one
 * library. It is advisory INSIDE a component — there is no shared module to
 * import, every effect inlines its own values — so it can only be enforced from
 * outside, here.
 *
 * Three legitimate escapes:
 *   - the colour comes from a prop (no literal at all — nothing to check);
 *   - the effect recreates someone else's brand, marked `// palette: brand-mimicry <name>`;
 *   - the colour belongs to the SUBJECT rather than to this library's identity, marked
 *     `// palette: data <reason>`. Mercury is not EMBER, a syntax highlighter's keyword colour is
 *     not SKY, a depth-ramped mountain palette IS the effect, and two cards either side of a
 *     transition have to contrast with each other rather than agree with the house. Forcing these
 *     onto six accents would not make the library more coherent, only less able to show anything;
 *   - it is one of the palette's own values, in any case, with or without alpha.
 *
 * ALLOWED is a flat const on purpose: extending the palette is one line here.
 */
import {readFileSync} from 'node:fs';
import {walkEffects} from './lib/fs.mjs';
import {gate, rel} from './lib/gate.mjs';

/** CONTRACT §2 — grounds, accents, neutrals. Extend here. */
const ALLOWED = {
  '#0a0b10': 'INK (default ground)',
  '#04050a': 'INK_DEEP (space / 3D)',
  '#f6f5f2': 'PAPER (light ground)',
  '#ff5c39': 'EMBER (house accent, on dark)',
  '#c2410c': 'EMBER_INK (house accent, on light)',
  '#c6ff3d': 'LIME',
  '#4cc9f0': 'SKY',
  '#ffd166': 'AMBER',
  '#c77dff': 'VIOLET',
  '#ffffff': 'display neutral on INK',
  '#eef1f7': 'body neutral on INK',
  '#8d93a5': 'secondary neutral on INK',
  '#1d1b17': 'display neutral on PAPER',
  '#4a4e5a': 'secondary neutral on PAPER',
};

/**
 * The two escape hatches. Both take a free-text reason after the marker.
 *
 * A marker is per-LINE by default, because a subscribe button that borrows YouTube's red still has
 * to use house colours for everything else. But per-line alone is not enough: a depth-ramped
 * mountain palette is one declaration of five colours, and five identical comments on it is worse
 * code than no comment. So a marker covers:
 *
 *   - the line it sits on, when it is a trailing comment; or
 *   - the whole declaration that follows, when it sits on its own line directly above one — from the
 *     next line until bracket depth returns to where it started.
 *
 *       // palette: data — a depth ramp; these five tints ARE the parallax
 *       const LAYERS = [
 *         {depth: 0.12, color: '#4a5a7e'},
 *         …
 *       ];
 */
const MARKERS = ['// palette: brand-mimicry', '// palette: data'];
const hasMarker = (line) => MARKERS.some((m) => line.includes(m));

/**
 * The third form: a WHOLE-FILE exemption, which needs the literal word `whole-file` so it cannot be
 * reached for lazily.
 *
 *     // palette: brand-mimicry whole-file — ChatGPT's product UI; every colour on screen is theirs
 *
 * This exists because the rule "a brand recreation still uses house colours for its own furniture"
 * is true of a subscribe button and false of `chatgpt-full-ui`: there IS no furniture of ours in a
 * full-window recreation, and 27 identical trailing comments would be worse code than one honest
 * declaration at the top. It must appear in the first 40 lines, so it reads as a property of the
 * component rather than as an excuse buried next to an offending line.
 */
const FILE_MARKER = /^\s*(?:\*\s*)?\/\/ palette: (?:brand-mimicry|data) whole-file\b.*\S/;
const wholeFileExempt = (lines) => lines.slice(0, 40).some((l) => FILE_MARKER.test(l));
/** True when the marker is alone on its line — i.e. it introduces the block below it. */
const isBlockMarker = (line) => hasMarker(line) && /^\s*\/\/ palette: (brand-mimicry|data)\b/.test(line);

/**
 * Every 1-based line number a marker covers. A trailing marker covers only its own line; a block
 * marker covers the declaration beneath it, tracked by bracket depth so a nested object or array
 * cannot end the block early.
 */
const exemptLines = (lines) => {
  const out = new Set();
  lines.forEach((line, i) => {
    if (!hasMarker(line)) return;
    out.add(i + 1);
    if (!isBlockMarker(line)) return;
    let depth = 0;
    let started = false;
    for (let j = i + 1; j < lines.length; j++) {
      out.add(j + 1);
      for (const ch of lines[j]) {
        if ('([{'.includes(ch)) {
          depth++;
          started = true;
        } else if (')]}'.includes(ch)) depth--;
      }
      // one-liner declaration, or the block closed
      if (started && depth <= 0) break;
      if (!started && /;\s*$/.test(lines[j])) break;
    }
  });
  return out;
};

/** #abc → #aabbcc · #rrggbbaa → #rrggbb (alpha is a value, not a colour). */
const normalise = (hex) => {
  const h = hex.slice(1).toLowerCase();
  if (h.length === 3) return '#' + [...h].map((c) => c + c).join('');
  if (h.length === 4) return '#' + [...h.slice(0, 3)].map((c) => c + c).join('');
  if (h.length === 8) return '#' + h.slice(0, 6);
  return '#' + h;
};

const g = gate('check:palette');

let scanned = 0;
let exemptFiles = 0;
let wholeFileFiles = 0;
const offenders = new Map(); // colour → count, for the summary

for (const e of walkEffects()) {
  const src = readFileSync(e.tsxPath, 'utf8');
  const lines = src.split('\n');
  scanned++;
  if (MARKERS.some((m) => src.includes(m))) exemptFiles++;
  if (wholeFileExempt(lines)) {
    wholeFileFiles++;
    continue;
  }
  const exempt = exemptLines(lines);

  const bad = [];
  lines.forEach((line, i) => {
    // a line of someone else's brand, or a colour that belongs to the subject
    if (exempt.has(i + 1)) return;
    for (const m of line.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
      const raw = m[0];
      if (![4, 5, 7, 9].includes(raw.length)) continue; // not a colour literal
      const hex = normalise(raw);
      if (ALLOWED[hex]) continue;
      bad.push({line: i + 1, raw, hex, text: line.trim()});
      offenders.set(hex, (offenders.get(hex) ?? 0) + 1);
    }
  });

  if (bad.length) {
    const shown = bad.slice(0, 6);
    g.fail(
      `${rel(e.tsxPath)}:${bad[0].line}`,
      `${e.id}: ${bad.length} hex literal(s) outside the house palette`,
      [
        ...shown.map((b) => `line ${b.line}: ${b.raw}   ${b.text.slice(0, 90)}`),
        ...(bad.length > shown.length ? [`… and ${bad.length - shown.length} more in this file`] : []),
        'fix: use a house colour, derive it from a prop, or mark the line `// palette: brand-mimicry <name>`\n        or `// palette: data <reason>` when the colour belongs to the subject rather than to the house',
      ],
    );
  }
}

if (offenders.size) {
  const top = [...offenders.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  g.note(`most common off-palette colours: ${top.map(([h, n]) => `${h}×${n}`).join(' ')}`);
}
if (exemptFiles) g.note(`${exemptFiles} component(s) carry a documented palette exemption` +
  (wholeFileFiles ? `, ${wholeFileFiles} of them whole-file.` : '.'));

g.done(`${scanned} components — every hex literal is a house colour.`);
