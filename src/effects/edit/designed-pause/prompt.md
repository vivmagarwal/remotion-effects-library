Build a Remotion composition called **DesignedPause** (composition id `designed-pause`): a talking
head reaching a topic change, where the dead air is replaced by a *chosen* hold with something in it.

**Setup**

```bash
npx remotion add @remotion/media @remotion/google-fonts
```

**What this is, and what it is not**

Removing silence is mechanical. Deciding where a piece should *breathe* is the edit, and it is the
half that never gets built. The rule to encode is one sentence: **a pause is placed by
classification, sized by a budget, and filled by design.**

**1. Placed by classification**

Inter-word gaps are aligned to language, not to amplitude. A breath under room tone is invisible to an
RMS threshold and obvious as a 240 ms hole in a transcript. So classify every gap and act only on the
outliers:

| class | gap | what it is | what to do |
|---|---|---|---|
| `micro` | 0–120 ms | co-articulation | leave |
| `breath` | 120–300 ms | inhale between phrases | leave, or trim to 90 ms |
| `beat` | 300–700 ms | deliberate emphasis | keep, cap at 450 ms |
| `sentence` | 700–1500 ms | full stop | keep, cap at 700 ms |
| `scene` | > 1500 ms | topic change or dead air | **this one.** Design it. |

```tsx
const classify = (ms) =>
  ms < 120 ? 'micro' : ms < 300 ? 'breath' : ms < 700 ? 'beat' : ms < 1500 ? 'sentence' : 'scene';

const gaps = words.slice(0, -1).flatMap((a, i) => {
  const ms = Math.round((words[i + 1].s - a.e) * 1000);
  return ms <= 0 ? [] : [{index: i, startS: a.e, endS: words[i + 1].s, ms, kind: classify(ms)}];
});
```

The `ms <= 0` filter is not defensive coding — Deepgram emits touching words, and a zero-length gap
drawn on a timeline is an invisible div that still costs you a key warning.

Find the pause rather than hard-coding it. On the shipped clip there is exactly one `scene` gap, 3.36 s
between "hopeful" and "long before you find out", and a classifier that discovers it is a component;
one that is told is a hard-coded demo.

**2. Sized by a budget, not by a slider**

```tsx
const holdMs = clamp(scene.ms * holdRatio, minHoldMs, maxHoldMs);
```

- **`holdRatio` 0.5.** Keeping the whole gap is not design, it is inaction. Half of it lands the topic
  change without the audience wondering whether the video froze.
- **`minHoldMs` 1000.** Under a second reads as a glitch, not as a beat. Below this, cut instead.
- **`maxHoldMs` 5000.** Past five seconds you have not designed a pause, you have made a scene.

**3. Filled by design**

Past about **45 frames** an empty hold is dead air with better branding. Put something there: a
chapter card, a still, a breath of b-roll. And **push it slowly** — `scale` 1 → 1.04 across the whole
hold with `output: 'perceptual-scale'`. A static card for 50 frames reads as a freeze, which is the
exact impression a designed pause exists to avoid.

**The cut lands inside the gap, never on a word**

```tsx
const cutOutS = scene.startS + marginMs / 1000;   // 200ms after the last word ends
const cutInS  = scene.endS   - marginMs / 1000;   // 200ms before the next one starts
```

A word's `start` is where the vowel got loud enough to detect, not where the mouth began moving. Cut
exactly on it and you clip the consonant onset. 180–220 ms is the band.

**Clamp the keep-list against the source length.** ASR reports a last word at 53.18 s for a file that
is 1590 frames — 53.00 s — long. The overrun renders as a held final frame with no error, which is the
worst kind of bug: it looks like a directing choice.

```tsx
const outS = Math.min(words.at(-1).e + marginMs / 1000, (sourceDurationInFrames - 1) / fps);
```

**Playing it** — three `<Series.Sequence>`s: speech, hold, speech.

```tsx
<Video src={src} objectFit="cover" muted trimBefore={Math.round(inS * fps)}
       style={{width: '100%', height: '100%'}} />
```

`objectFit` is a **prop**, not a style — `<Video>` decodes into a canvas, so CSS `object-fit` is
silently ignored. `trimBefore` is a **frame count** into the source, not seconds: multiply by `fps`
exactly once, at the boundary, and round.

**The look**

- 1920×1080, 30 fps, 323 frames. Ground `#04050a`. Inter at 500/700/800.
- The chapter title (116px/800) in `theme.display` via a `displayFamily` prop; kicker, readout and
  strip labels in `theme.text`.
- Centre the chapter card with `padding: '80px 200px 180px'`. The readout pill grows a line in a wider
  typeface (five lines in a monospace theme) and must never reach the kicker. Keep `1–5s` unbreakable
  with U+2060 word joiners around the dash.
- Readout pill top-left at `84, 84`, `padding: 18px 28px`, radius `12 × theme.radius / 18` (12 at
  house), `rgba(10,11,16,0.72)`,
  `backdropFilter: 'blur(18px) saturate(1.3)'`, `1px solid rgba(255,255,255,0.14)`, `maxWidth: 900`.
  Three lines at 34px: `SCENE GAP · 3.36s` at 800 weight `letter-spacing: 0.16em` in `#ff5c39`, the
  budget sentence at 500 in `#eef1f7`, the classifier count at 500 in `#8d93a5`.
- A 460px gradient scrim along the bottom, `rgba(4,5,10,0.94)` → transparent, so the timelines read
  over any footage.
- **Two strips, and they are different clocks.** `SOURCE · every gap classified` at `bottom: 210`:
  a 46px track with radius `6 × theme.radius / 18`, every word as a pale block and every gap tinted by
  class — `micro` `#4a4e5a` (neutral), `breath` `theme.series[1]`, `beat` `theme.series[2]`,
  `sentence` `theme.series[3]` (house `#4cc9f0` / `#c6ff3d` / `#ffd166`), and `scene` in `accentColor`
  — the same colour as the hold on the OUTPUT strip, because it is the same pause. Only the scene gap
  gets full opacity; the rest sit at 0.34 so you can see it is the outlier rather than the pick. Two
  3px markers in `theme.paper` (`#f6f5f2`) at the cut points.
- `OUTPUT · A · designed hold · B` at `bottom: 92`: a 46px flex row with radius
  `6 × theme.radius / 18`, each section `flexGrow` by its own frame count, the hold in the accent with
  its length written in `theme.accentInk` (`#04050a`), A and B in `theme.body` (`#eef1f7`).
- **The playhead goes on the OUTPUT strip only**, 3px in `theme.paper` (`#f6f5f2`) like the markers.
  After a cut the two clocks disagree, and one playhead drawn across both is precisely what makes
  people mis-time a caption.
- Section labels at 26px/800, `letter-spacing: 0.18em`, `#8d93a5`.

**Requirements**

- One self-contained `.tsx` file exporting `DesignedPause`.
- Props with these exact defaults: `src` `staticFile('footage/interview-raw.mp4')`, `beatSrc`
  `staticFile('footage/broll-earth.mp4')`, `words` (a real Deepgram response inlined, 36 words over
  38.75–53.18 s, `{w, s, e}` in seconds), `sceneGapMs` `1500`, `holdRatio` `0.5`, `minHoldMs` `1000`,
  `maxHoldMs` `5000`, `marginMs` `200`, `sourceDurationInFrames` `1590`, `chapterKicker`
  `'THE PAUSE IS DESIGNED'`, `chapterTitle` `'On the mission'`, `showTimeline` `true`, `accentColor`
  `'#ff5c39'`, `backgroundColor` `'#04050a'`.
- The video is **muted**, and the pause is made visible on the timeline rather than audible. That is
  also the more useful way to read it while you are still deciding where it goes.
- Leave the ASR's mistakes in the inlined data. `How` spans 44.14 → 45.42 — a 1.28 s word, because
  Deepgram mis-attributed the tail of the answer. A classifier has to survive that, and a cleaned-up
  fixture proves nothing.
- Handle "no scene gap found": play the window straight rather than throwing. A component that only
  works on footage with a hole in it is a demo.
