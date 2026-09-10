Build a Remotion composition called **TiktokCaptions**: word-level karaoke captions where the word
currently being spoken pops and changes colour.

**The look**
- **1080×1920 (vertical), 30fps, 135 frames.** Background `#111318`; captions anchored to the bottom
  with 200px of padding.
- Montserrat at 130px, weight 900, uppercase, line-height 1.12, letter-spacing `-0.02em`. Inactive
  words white, the active word `#c6ff3d`.
- Words laid out in a centred flex row with `flexWrap: 'wrap'` and `gap: '0 26px'`, max-width 1400.

**The data shape**
Take an array of `{text, start, end}` with times in **seconds** — this is exactly what
`@remotion/captions` produces from a transcription, so real captions can be dropped straight in.
Convert to frames only where you need to: `frame - Math.round(w.start * fps)`.

**Page by word count, not by time**

```tsx
const activeIndex = words.findIndex((w) => time >= w.start && time < w.end);
const page = Math.floor(index / wordsPerPage);              // wordsPerPage = 3
const pageWords = words.slice(page * wordsPerPage, (page + 1) * wordsPerPage);
```

Chunking by a fixed word count guarantees a readable line however fast the speaker goes. Chunking by
a time window instead gives you one word during a pause and nine during a fast run — which is the
single most common way these captions go wrong.

**The outline — do not use a text-shadow**

```tsx
WebkitTextStroke: '10px #0b0d12',
paintOrder: 'stroke fill',
```

`paintOrder: 'stroke fill'` draws the stroke *behind* the glyph, so a 10px stroke does not eat into
the letterforms. A soft `text-shadow` blurs into busy footage and the caption becomes unreadable
exactly when it matters; a hard stroke survives anything. Add
`textShadow: '0 8px 0 rgba(11,13,18,0.55)'` as a hard drop for depth — offset, not blurred.

**The animation**
- Active word: its own spring keyed to its start —
  `spring({frame: frame - Math.round(w.start * fps), fps, config: {damping: 12, stiffness: 220, mass: 0.5}})`,
  applied as `scale: 1 + Math.min(0.16, pop * 0.16)`. Clamp it: an unclamped spring overshoots well
  past 1 and the word visibly lurches.
- Words not yet spoken sit at `opacity: 0.42`, so the viewer can read ahead — this is what makes it
  feel like karaoke rather than words appearing from nothing.
- The whole page pops when it changes, on a spring keyed to the page's first word's start:
  `scale: 0.88 + pageIn * 0.12`.

**Requirements**
- One self-contained `.tsx` file exporting `TiktokCaptions`, and an exported `Word` type.
- Props: `words`, `wordsPerPage`, `color`, `activeColor`, `backgroundColor`, `transparent` — when
  `transparent` is true the background is `'transparent'`, so this can be rendered as an alpha overlay
  (`--codec=vp8`, or `--codec=prores --prores-profile=4444`) and composited over footage.
- Load Montserrat via `@remotion/google-fonts/Montserrat`.
- To generate real timings, `@remotion/captions` provides `parseSrt()` and works with Whisper output;
  `createTikTokStyleCaptions()` in that package does this pagination for you if you would rather not
  hand-roll it.
