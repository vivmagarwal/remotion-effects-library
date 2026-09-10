Build a Remotion composition called **SubtitleBand** (composition id `subtitle-band`): broadcast-style
subtitles in a lower band, where the words fill in as they are spoken.

**The look**
- 1920×1080, 30fps, 180 frames. Background `#171a24`, band anchored to the bottom with 110px padding.
- The band: `rgba(10,12,18,0.86)`, radius 18, padding `28px 52px`, and a `7px solid #4cc9f0` left
  border — the accent bar is what makes it read as a broadcast lower third rather than a subtitle.
- Text at 62px weight 700, `whiteSpace: 'nowrap'`, letter-spacing `-0.01em`. Unspoken `#8e94a6`,
  spoken white.
- The band rises 26px and fades in just before each line starts.

**The fill — draw the line twice**

```tsx
{/* base: whole line, dim */}
<div style={{fontSize: 62, fontWeight: 700, color: baseColor, whiteSpace: 'nowrap'}}>{text}</div>

{/* fill: identical line, bright, clipped */}
<div style={{position: 'absolute', left: 52, top: 28, /* same font settings */,
             color: fillColor, overflow: 'hidden', width: `${progress * 100}%`}}>
  {text}
</div>
```

Two copies of the **same string at the same metrics**, the top one clipped by `overflow: hidden` and a
percentage width. Because the glyphs are identical and identically positioned, the wipe edge travels
through the real letterforms — you get a half-filled letter, exactly like broadcast karaoke. Colouring
individual `<span>`s per word instead can only switch a whole word at a time, and any attempt to
measure and approximate the position drifts as soon as the font or size changes.

The absolute `left`/`top` on the fill layer must match the band's padding exactly, or the two copies
sit a pixel or two apart and the effect turns into a blurry double image.

**Progress that respects word boundaries**

```tsx
const spokenCount  = line.filter((w) => time >= w.end).length;
const active       = line.find((w) => time >= w.start && time < w.end);
const withinActive = active ? (time - active.start) / (active.end - active.start) : 0;
const progress     = Math.min(1, (spokenCount + (active ? withinActive : 0)) / line.length);
```

Counting completed words and adding the fraction through the current one means the fill **pauses
between words** and moves during them — which is how a real read sounds. Interpolating linearly from
the line's start time to its end time slides at a constant rate and immediately looks wrong against
speech.

**Line selection**
The last line that has started. Write it as a `reduce` rather than `findLastIndex()` — the latter needs
`lib: ["ES2023"]` in `tsconfig.json`, which the Remotion starter does not set, so it is a type error out
of the box:

```tsx
const lineIndex = lines.reduce((best, l, i) => (time >= (l[0]?.start ?? 0) ? i : best), 0);
```

Starting the accumulator at 0 means the first line is showing before anything has been spoken.

**Requirements**
- One self-contained `.tsx` file exporting `SubtitleBand` and a `Word` type
  (`{text, start, end}`, times in **seconds** — the shape `@remotion/captions` produces).
- Props: `lines` (array of arrays of `Word`), `baseColor`, `fillColor`, `bandColor`,
  `backgroundColor`, `transparent` — when transparent, render as an alpha overlay with
  `--codec=vp8` or `--codec=prores --prores-profile=4444`.
- Load Inter via `@remotion/google-fonts/Inter`.
