Build a Remotion composition called **PauseAwareCaptions** (composition id `pause-aware-captions`):
documentary two-line subtitles over a talking head, paged by `@remotion/captions`, that break where the
speaker breathes.

**Setup**

```bash
npx remotion add @remotion/media @remotion/captions @remotion/google-fonts
```

**Three clocks, and you convert at the boundary or you lose**

Deepgram is **seconds** — noisy floats, `0.39999998`, never compared with `===`.
`@remotion/captions` is **milliseconds**. Remotion is **frames**. Convert once at each boundary and
stay converted.

```tsx
const captions: Caption[] = words.map((w) => ({
  text: ` ${w.w}`,                                   // ← the leading space is LOAD-BEARING
  startMs: Math.round(w.s * 1000),
  endMs: Math.round(w.e * 1000),
  timestampMs: Math.round(((w.s + w.e) / 2) * 1000),
  confidence: null,
}));
```

**`Caption.text` must start with a space.** `createTikTokStyleCaptions` begins a new page only when
`text.startsWith(' ')`, and it concatenates tokens with no separator. Feed it bare words and you get
one page containing the entire transcript, run together, with no error and no warning. Render tokens
with `whiteSpace: 'pre'` so the space you fed in survives.

**Paging, and the knob that matters**

```tsx
const {pages} = createTikTokStyleCaptions({
  captions,
  combineTokensWithinMilliseconds: 1600,
  breakOnSilenceAfterMilliseconds: 400,
});
```

`breakOnSilenceAfterMilliseconds` is the pause-aware knob: any gap at least this long forces a new
page, so a pause never has a half-full page hanging over it. **400 ms** for short form, **700** for a
documentary read. On the shipped clip the 480 ms gap after "time." breaks a page and the 320 ms one
after "responsibility," does not — that difference is the whole distance between captions that
punctuate a read and captions that ignore it.

**The gotcha that makes a caption sit over silence**

`TikTokPage.durationMs` runs to the **next page's start**, not to the page's own last word. Take it
literally and every page stays up through the silence that caused the break.

```tsx
const next = pages[i + 1];
const own  = toFrame(p.tokens.at(-1).toMs) + holdFrames;      // 12 frames of hold
const end  = next ? Math.min(own, toFrame(next.startMs)) : own;
```

The `Math.min` is not belt-and-braces. Without it the hold overlaps the following page and a `find()`
over the spans keeps returning the stale one — the caption freezes for twelve frames on every page
boundary. With it, the 480 ms pause gets a genuinely caption-free beat, which is the point.

Test the active page **half-open**: `frame >= start && frame < end`. A closed interval puts two pages
on screen for exactly one frame.

**Two lines, broken by the package**

```tsx
const {segments} = CaptionsInternals.ensureMaxCharactersPerLine({captions: tokens, maxCharsPerLine: 42});
return segments.slice(0, 2);
```

42 characters is the subtitle standard; two lines is the maximum, because a third makes it a paragraph.
`ensureMaxCharactersPerLine` is exported under `CaptionsInternals`, and it returns `Caption[][]` —
**lines**, not captions — which is also why it pairs with `serializeSrt` and a flat array does not.

**Legibility is structural, not measured**

You cannot compute a contrast ratio against a moving background, so guarantee it by construction. This
one uses the **blur-behind pill** — `backdropFilter: 'blur(18px) saturate(1.4)'` over
`rgba(8,9,14,0.42)` with a `1px solid rgba(255,255,255,0.14)` border and an 18px radius. It is the one
option on the list that holds over any footage without dimming the shot, and `backdrop-filter` runs in
Remotion's Chromium with no WebGL. A hard stroke is the alternative and belongs on short-form captions;
a drop shadow alone fails exactly when the footage gets busy.

**Unlike a karaoke caption, do not dim the unspoken words.** A subtitle is read slightly ahead of the
voice. Tint the currently-spoken word and leave the rest at full opacity.

**The look**

- 1920×1080, 30 fps, 400 frames. Ground `#04050a`. Inter at 500/600/700.
- `<Video>` full-bleed with `objectFit="cover"` as a **prop** — it decodes into a canvas, so CSS
  `object-fit` in `style` is silently ignored — and `trimBefore={Math.round(windowStart * fps)}`,
  a **frame count**, not seconds.
- Caption block at `bottom: 130`, centred, `gap: 12` between lines. Lines at 54px/600,
  `lineHeight: 1.24`, `letterSpacing: '-0.01em'`, `maxWidth: 1500`, `padding: '14px 34px'`. The
  spoken word in `#c6ff3d`, the rest in `#f6f5f2`.
- Pages fade and rise 10px over 5 frames — short, because a subtitle that animates draws attention to
  itself.
- Readout pill top-left at `84, 84` naming why the current page broke: `PAGE BROKEN ON SILENCE` in
  `#c6ff3d` when the preceding gap cleared the threshold, `PAGE BROKEN ON LENGTH` in `#8d93a5`
  otherwise, and `NO PAGE — THE HOLD HAS CLEARED` in the caption-free beat.
- A 26px strip at `bottom: 70` with every page as a block on the source clock, silence-broken pages in
  the accent. The holes between the blocks are the pauses, which is the clearest way to show that the
  pager respected them.

**Requirements**

- One self-contained `.tsx` file exporting `PauseAwareCaptions`.
- Props with these exact defaults: `src` `staticFile('footage/interview-raw.mp4')`, `words` (a real
  Deepgram response inlined, 41 words over 5.52–17.85 s, `{w, s, e}` in seconds), `windowStart` `5.32`,
  `breakOnSilenceMs` `400`, `combineWithinMs` `1600`, `maxCharsPerLine` `42`, `holdFrames` `12`,
  `showDebug` `true`, `color` `'#f6f5f2'`, `activeColor` `'#c6ff3d'`, `backgroundColor` `'#04050a'`.
- Do the page maths in a `useMemo` keyed on the inputs, not per frame — it is a pure function of the
  transcript, and recomputing it 400 times is 400 times too many.
- Leave the speaker's two `um`s in the transcript. Captions that silently delete disfluencies are
  lying about the audio, and the moment the viewer notices, every other caption is suspect.
