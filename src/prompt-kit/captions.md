## Captions from a real transcript

### The three that break captions silently

1. **Three units live in this pipeline.** Deepgram is **seconds** (floats). `@remotion/captions` is
   **milliseconds**. Remotion is **frames**. Convert once, at the boundary, and stay converted.
2. **`Caption.text` must carry a leading space.** `createTikTokStyleCaptions` only starts a new page
   when `text.startsWith(' ')` (verified in
   `node_modules/@remotion/captions/dist/create-tiktok-style-captions.js`), and it concatenates tokens
   with no separator. Feed it bare words and you get one page containing the entire transcript, run
   together with no spaces, with no error.
3. **The active-word test must be half-open**: `frame >= startFrame && frame < endFrame`. A closed
   interval makes two words active on the shared boundary frame and the caption flickers.

---

### 1. The Deepgram response, as actually shipped

`public/transcripts/interview.deepgram.json` (17 words, 6.192 s) and
`public/transcripts/interview-raw.deepgram.json` (119 words, 39.096 s, with real `um`s and pauses)
are unmodified nova-3 responses. Shape, verbatim:

```jsonc
{
  "metadata": {
    "request_id": "01a08a25-…", "sha256": "…", "created": "2026-09-10T07:08:58.507Z",
    "duration": 6.192, "channels": 1, "models": ["…"],
    "model_info": {"…": {"name": "general-nova-3", "version": "2025-07-31.0", "arch": "nova-3"}}
  },
  "results": {
    "channels": [{
      "alternatives": [{
        "transcript": "You can really see how people become so natural up in space after about a month and",
        "confidence": 1,
        "words": [
          {"word": "you", "start": 0, "end": 0.16, "confidence": 0.9951172, "punctuated_word": "You"},
          {"word": "can", "start": 0.16, "end": 0.39999998, "confidence": 0.9589844, "punctuated_word": "can"}
        ],
        "paragraphs": {
          "transcript": "\nYou can really see…",
          "paragraphs": [{"sentences": [{"text": "…", "start": 0, "end": 6.16}],
                          "num_words": 17, "start": 0, "end": 6.16}]
        }
      }]
    }],
    "utterances": [
      {"start": 0, "end": 3.7599998, "confidence": 0.9947917, "channel": 0,
       "transcript": "You can really see how people become so natural", "words": [ /* same shape */ ]}
    ]
  }
}
```

Facts to pin:

- `start` / `end` are **seconds, floats, and noisy** (`0.39999998`). Never compare with `===`; always
  go through `Math.round(t * fps)`. Use `round`, not `floor` — `floor` systematically lags one frame.
- `punctuated_word` exists only when the request used `smart_format` or `punctuate`. Render
  `punctuated_word ?? word`.
- `confidence` is 0–1 per word. Below 0.6, do not place a hard cut on that word's boundary.
- `results.utterances[]` is a **top-level sibling of `channels`**, not nested inside it. Utterances are
  the natural cut list; `paragraphs.paragraphs[].sentences[]` is the natural caption-page list.
- Deepgram's SDK types omit `punctuated_word` from the channel-alternative word type even though the
  API returns it. Declare your own local word type — which is also what the one-file rule wants:

```tsx
type DeepgramWord = {
  word: string; start: number; end: number; confidence: number; punctuated_word?: string;
};
```

### 2. Converting once, at the boundary

`@remotion/captions` (`npx remotion add @remotion/captions`) — verbatim types from
`node_modules/@remotion/captions/dist/`:

```ts
export type Caption = {
  text: string;
  startMs: number;
  endMs: number;
  timestampMs: number | null;
  confidence: number | null;
  pageBreakAfter?: boolean;
};

export type TikTokToken = {text: string; fromMs: number; toMs: number; pageBreakAfter?: boolean};
export type TikTokPage  = {text: string; startMs: number; tokens: TikTokToken[]; durationMs: number};

export type CreateTikTokStyleCaptionsInput = {
  captions: Caption[];
  combineTokensWithinMilliseconds: number;
  breakOnSilenceAfterMilliseconds?: number;
};
export declare const createTikTokStyleCaptions:
  (i: CreateTikTokStyleCaptionsInput) => {pages: TikTokPage[]};

export declare const parseSrt: ({input}: {input: string}) => {captions: Caption[]};
export declare const serializeSrt: ({lines}: {lines: Caption[][]}) => string;
// exported as CaptionsInternals.ensureMaxCharactersPerLine
export declare const ensureMaxCharactersPerLine:
  (i: {captions: Caption[]; maxCharsPerLine: number}) => {segments: Caption[][]};
```

Note `serializeSrt` takes `Caption[][]` — **lines**, not captions — so it pairs with
`ensureMaxCharactersPerLine`, not with a flat array.

The adapter, once, in a `useMemo` or at module scope over a bundled constant:

```tsx
const toCaptions = (words: readonly DeepgramWord[]): Caption[] =>
  words.map((w) => ({
    text: ` ${w.punctuated_word ?? w.word}`,   // ← the leading space is load-bearing
    startMs: Math.round(w.start * 1000),
    endMs: Math.round(w.end * 1000),
    timestampMs: Math.round(((w.start + w.end) / 2) * 1000),
    confidence: w.confidence ?? null,
  }));
```

Then to frames, in one direction only:

```tsx
const startFrame = Math.round(c.startMs / 1000 * fps);
const endFrame   = Math.round(c.endMs   / 1000 * fps);
const isActive   = frame >= startFrame && frame < endFrame;   // half-open
```

For a per-word animation, key the spring to the word's own start:
`spring({frame: frame - startFrame, fps, config: MICRO})`.

If the clip is trimmed, word times are still relative to the **source file** — subtract the trim:
`Math.round(w.start * fps) - trimBeforeFrames`. If you re-cut the footage at all, every caption
timestamp must be re-mapped through the same keep-list, once, before rendering, or captions drift.

### 3. Paging

```tsx
const {pages} = createTikTokStyleCaptions({
  captions,
  combineTokensWithinMilliseconds: 1200,
  breakOnSilenceAfterMilliseconds: 400,
});
```

- `combineTokensWithinMilliseconds` is the page's target span.
- **`breakOnSilenceAfterMilliseconds` is the pause-aware knob**: any gap at least this long forces a
  new page, so a pause never has a half-full page hanging over it. **400** for hype/short-form, **700**
  for a documentary read.
- `pageBreakAfter: true` on a `Caption` forces a break regardless — set it on sentence-final words
  (match `/[.!?]$/` on `punctuated_word`, or use the ends from `paragraphs.paragraphs[].sentences[]`)
  so pages break on meaning rather than on a character count.
- `TikTokToken.text` is whitespace-sensitive: keep the leading space on each token and render with
  `whiteSpace: 'pre'`, or the words run together.
- **Page by word count, not by a fixed time window**, unless the brief says otherwise — a fixed window
  gives you one word during a pause and nine during a fast run.

If the effect authors its own word list (a standalone default so the file runs with no assets), keep
it in the seconds-based `{text, start, end}` shape and say so — that is Deepgram's shape, not
`@remotion/captions`'.

### 4. Gaps: silence, fillers, and where a cut may go

You do not need audio analysis. Inter-word gaps are aligned to language rather than to amplitude — a
breath under room tone is invisible to an RMS threshold and obvious as a 240 ms gap.

| class | gap | what it is | default action |
|---|---|---|---|
| `micro` | 0–120 ms | co-articulation | leave |
| `breath` | 120–300 ms | inhale between phrases | cut to 90 ms |
| `beat` | 300–700 ms | deliberate emphasis | keep, cap at 450 ms |
| `sentence` | 700–1500 ms | full stop | keep, cap at 700 ms; force a caption page break |
| `scene` | > 1500 ms | topic change or dead air | cut, then insert a chosen hold of 1000–5000 ms |

```tsx
const gaps = captions.slice(0, -1).map((a, i) => {
  const durationMs = captions[i + 1].startMs - a.endMs;
  return {
    index: i, startMs: a.endMs, endMs: captions[i + 1].startMs, durationMs,
    endsSentence: /[.!?]$/.test(a.text.trim()),
    kind: durationMs < 120 ? 'micro' : durationMs < 300 ? 'breath'
        : durationMs < 700 ? 'beat'  : durationMs < 1500 ? 'sentence' : 'scene',
  };
}).filter((g) => g.durationMs > 0);      // Deepgram can emit touching words
```

**Thresholds when you are cutting rather than classifying** (these are the numbers, not a starting
point): silence threshold **4 % of peak RMS over a 20 ms window**; minimum silence to cut **350 ms**;
keep margin **180–220 ms each side** so the cut never clips a consonant onset; minimum kept segment
**250 ms**; after removing **disfluencies** (`um, uh, umm, uhh, uhm, hmm, er, ah` — `interview-raw`
contains five real `um`s), merge adjacent kept ranges whose gap is now **< 120 ms**. Discourse markers
— `like, you know, so, basically, actually, I mean, right` — change the meaning of a sentence when
they go, so they are **review-only**: list them, never auto-cut them.

A filler is cut as its **own interval, ±50 ms**, independent of the silence gate. Dropping it from the
word list alone is not a cut: whenever its neighbours sit closer than the silence threshold the run is
kept whole and the "um" stays in the picture, which is exactly what three of the five in
`interview-raw` did until this was measured.

**Two gap regimes.** The table above is the **short-form** regime — every gap tightened, ~40 % of a
talking head removed. Long-form conversation and reflective teaching use the **conservative** one the
studio validated on an 88-minute cut: only gaps **> 0.9 s** are touched, and only down to **0.8 s**;
thinking pauses under 1.1 s are left alone. Pick by format, and say which in the brief.

Two rules that override the table: **never cut a sentence-final gap below 250 ms** (it makes the read
sound panicked), and **never cut the gap immediately before an emphasis word** — that pause *is* the
emphasis. And never cut *on* a word: a cut frame must land inside a gap, and if the gap is under
6 frames, move to the next one that is not.

### 5. How captions behave around a pause

- The last spoken word's page stays on screen for **12 frames** after the word ends, then clears. A
  static caption sitting through a two-second silence is the caption equivalent of dead air.
- A **karaoke or word-highlight page** appears exactly on the frame its first word starts, and each
  word lights on its own onset — never earlier. A highlighted word that precedes its audio is read as a
  spoiler.
- A **subtitle line or designed on-screen text** may **lead** its audio by **0.2–0.5 s** (subtitle-band
  enters 0.25 s early for exactly this reason) and must never arrive late. The two rules are not in
  tension: the highlight is the sync signal, the line is the context.
- If the hold is longer than ~45 frames, put something designed there — a chapter card, a still, a
  breath of b-roll — not an empty caption slot.

### 6. Legibility over moving footage

You cannot compute one contrast ratio against a moving background, so guarantee it structurally.
Target **≥ 4.5:1 against the worst pixel the text overlaps across the whole shot**, not the average
and not frame 0. In order of preference:

1. **Gradient scrim** — `linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 28%,
   transparent 60%)` over the lower ~40 % of frame. Invisible as a device, universally legible.
2. **Blur-behind pill** — `backdropFilter: 'blur(18px) saturate(1.4)'` + `rgba(0,0,0,0.35)` +
   `1px solid rgba(255,255,255,0.14)` + `borderRadius: 999`. `backdrop-filter` works in Remotion's
   Chromium and needs no WebGL.
3. **Hard stroke** — `WebkitTextStroke: '<N>px #0B0D12'` with `paintOrder: 'stroke fill'`, where N is
   **14–16 % of the font size**. A hard stroke survives any footage; it is the only one of these that
   works with no plate at all.
4. **Drop shadow alone — insufficient.** A blurred shadow fails exactly when the footage is busy. Use
   it only as a supplement.

`backgroundClip: 'text'` + `WebkitTextFillColor: 'transparent'` **cancels `WebkitTextStroke`**. For a
gradient fill *and* a stroke, render two absolutely-positioned copies at identical metrics: the lower
one carries the stroke, the upper one the gradient.

Reading speed: cap a page at **17 characters per second** (`charCount / (durationMs / 1000) <= 17`)
and split it if it fails; minimum page duration **833 ms**, maximum **7 s**; **42 characters per line,
2 lines maximum** for a subtitle-style caption. Break *after* punctuation and *before* conjunctions
and prepositions; never leave one or two words alone on the top line; never split an article from its
noun or a first name from a last name.

**Where the emphasis comes from is what separates a premium caption from a cliché one.** Author the
emphasised words as data (a `hit` flag on the word) rather than deriving them from word length or
position — derived emphasis lands on "the".

### 7. Safe areas for 9:16 (1080×1920), exact pixel insets

| platform | top | bottom | left | right |
|---|---|---|---|---|
| TikTok | 130 | 484 | 44 | 140 |
| Instagram Reels | 210 | 310 | 42 | 84 |
| YouTube Shorts | 120 | 300 | 48 | 96 |
| **Universal (clears all three)** | **260** | **484** | **48** | **140** |

The universal row is at least the per-column maximum of the three above it — an earlier version said 260 at the
bottom and 90 on the right, which cleared none of its own table. For captions specifically,
**bottom-anchor between 520 and 620 px** on a 1080×1920 frame: that clears TikTok's caption stack and
the Reels action rail at once. TikTok's figure is a floor, not a guarantee — it grows with the length
of the poster's own caption.

**4:5 delivery.** Shorts ship twice: 1080×1920 for Shorts, Reels and TikTok, and 1080×1350 for the
LinkedIn and Instagram feeds, the tallest frame the feed does not clip. The 4:5 is a centre crop of the
9:16 master that drops **285 px top and bottom**, so anything that has to survive both — title, face,
captions — stays inside **y 300–1440**: the crop band intersected with the platform insets above. A
caption anchored at 560 from the bottom lands at y 1360 and survives; one at 380 does not.

**16:9.** YouTube's control bar owns the bottom ~9 % of a landscape frame, so a burned caption sits at
**≥ 108 px** from the bottom of 1920×1080, and a drawing that will carry captions keeps its lowest
label out of the bottom 20 %.

At 1080×1920 the house `SAFE_TOP` is 240 and `SAFE_BOTTOM` is 380; the numbers above are the
platform-specific tightening of that, and a caption effect should use them.
