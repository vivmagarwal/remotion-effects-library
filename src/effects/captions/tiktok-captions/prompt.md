Build a Remotion composition called **TiktokCaptions**: word-level karaoke captions over the clip they
were transcribed from, where the word currently being spoken pops and changes colour.

**The look**
- **1080×1920 (vertical), 30fps, 190 frames.** Ground `#0a0b10`, though it is only visible where the
  footage is not: the clip fills the frame.
- Montserrat at **118px**, weight 900, uppercase, line-height 1.12, letter-spacing `-0.02em`.
- Three colour states, and they are the point: a word not yet reached is `#ffffff` at `opacity: 0.55`,
  the word being spoken is `#c6ff3d`, and an **authored** emphasis word is `#ffd166` whether or not it
  is the active one.
- Captions sit `560` from the bottom — that clears TikTok's own caption stack (484) and the Reels
  action rail at the same time. A gradient scrim rises `bottomInset + 420` behind them.
- A source label top-left at `90, 260`, 34px/800, in the theme's `ink` at 0.62, fading in over frames
  0–12 and out over 48–62.

**The data shape**
An array of Deepgram `words[]` entries, pasted in unmodified:

```tsx
export type DeepgramWord = {
  readonly word: string;
  readonly start: number;          // SECONDS, and noisy: 0.39999998
  readonly end: number;
  readonly confidence?: number;
  readonly punctuated_word?: string;   // only with smart_format / punctuate
};
```

Render `punctuated_word ?? word`. Times are seconds and are noisy floats, so **only ever compare them
after `Math.round(t * fps)`** — a comparison in seconds puts a word boundary between two frames and
the caption flickers for one of them.

**Page by word count, not by time**

```tsx
const f = (t: number) => Math.round(t * fps);

// Half-open. A CLOSED interval makes two words active on the shared boundary
// frame, and the caption flickers for exactly one frame — which reads as a glitch.
const activeIndex = words.findIndex((w) => frame >= f(w.start) && frame < f(w.end));

// Between two words there is no active word, and findIndex returns -1. Falling
// back to 0 would throw the page back to the start in every gap between words,
// so fall back to the last word that has STARTED.
let lastStarted = 0;
for (let i = 0; i < words.length; i++) if (frame >= f(words[i].start)) lastStarted = i;
const index = activeIndex !== -1 ? activeIndex : lastStarted;

const page = Math.floor(index / wordsPerPage);                    // wordsPerPage = 3
const pageWords = words.slice(page * wordsPerPage, (page + 1) * wordsPerPage);
```

Chunking by a fixed word count guarantees a readable line however fast the speaker goes. Chunking by
a time window instead gives you one word during a pause and nine during a fast run — which is the
single most common way these captions go wrong. Three is the readable maximum on a 9:16 frame.

The page clears 12 frames after the last word ends (`frame >= f(words.at(-1).end) + 12`). A caption
sitting through a silence is the caption equivalent of dead air.

**The outline — do not use a text-shadow**

```tsx
const FONT_SIZE = 118;
const STROKE = Math.round(FONT_SIZE * 0.15);   // 18 — 14-16% is where a stroke reads as an outline
// …on each word:
WebkitTextStroke: `${STROKE}px #04050a`,
paintOrder: 'stroke fill',
textShadow: '0 8px 0 rgba(11,13,18,0.55)',     // a hard drop for depth: offset, never blurred
```

You cannot compute a contrast ratio against moving footage, so legibility has to be structural. A
soft `text-shadow` blurs into a busy shot and fails exactly when it matters; `paintOrder: 'stroke
fill'` keeps the stroke outside the glyph, so the letterform stays its full weight.

**The gap has to clear two strokes, not one**

```tsx
gap: `12px ${STROKE * 2 + 26}px`,               // 62px, not 26px
```

Each word's outline extends `STROKE` outward, so a 26px column gap between two 18px strokes leaves
the words touching, and the active word's `scale` closes what is left. This is the bug that renders
"IN SPACE" as "INSPACE", and it only shows up on short words.

**The animation**
- Active word: its own spring keyed to its start —
  `spring({frame: frame - f(w.start), fps, config: {damping: 12, stiffness: 220, mass: 0.5}})`,
  applied as `scale: 1 + Math.min(0.16, pop * 0.16)`. Clamp it: an unclamped spring overshoots well
  past 1 and the word visibly lurches.
- Words not yet spoken sit at `opacity: 0.55`, so the viewer can read ahead — this is what makes it
  feel like karaoke rather than words appearing from nothing. 0.55 is the floor at which the stroke
  still reads over footage.
- The whole page pops when it changes, on a spring keyed to the page's first word's start
  (`config: {damping: 16, stiffness: 160, mass: 0.6}`): `scale: 0.88 + Math.min(1, pageIn) * 0.12`,
  `opacity: Math.min(1, pageIn * 2)`. The page appears exactly on the frame its first word starts,
  never earlier — a caption that precedes its audio reads as a spoiler.

**The footage**

```tsx
<AbsoluteFill>
  <Video objectFit="cover" src={src} muted style={{width: '100%', height: '100%'}} />
</AbsoluteFill>
```

Two silent traps, both here. `objectFit` is a **prop** on `@remotion/media`'s `<Video>`, not a style:
the component draws into a canvas, so CSS `object-fit` has nothing to act on, and a 16:9 source sits
letterboxed in the middle of a 9:16 frame. There is no `objectPosition` — `cover` centres, and you
bias the crop with the `cropLeft`/`cropRight`/`cropTop`/`cropBottom` props, which take fractions. And
the wrapping `AbsoluteFill` is the other half: `AbsoluteFill` is a column flex container, so a bare
`<Video>` inside it is a flex item at its intrinsic aspect, and `cover` needs a definite 100%×100%
box to crop against.

**Emphasis is authored, not derived**
`hits` is a list of lower-cased words matched against `word`. Deriving emphasis from word length or
position lands it on "the".

**Requirements**
- One self-contained `.tsx` file exporting `TiktokCaptions`, and an exported `DeepgramWord` type.
- The props table below is the complete list. `src` defaults to the clip the transcript came from;
  set it to `null` to render as a transparent overlay (`--codec=prores --prores-profile=4444`) and
  composite over your own footage — ProRes 4444 survives the composite; VP8 WebM alpha comes back as a
  black box, so keep `--codec=vp8` for web playback only.
- Inline the default `words` array so the file renders with no assets at all.
- Load Montserrat via `@remotion/google-fonts/Montserrat` at weights 800 and 900.
- `checkFrame` 115: the page is "UP IN SPACE", "up" is the active word, "space" is an authored hit
  and has not been reached — the one frame that shows all three colour states at once.
