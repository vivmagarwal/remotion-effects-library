Build a Remotion composition called **HypeCaptions** (composition id `hype-captions`): retention-style
captions stamped over footage, with one word per page blown up.

**The look**
- **1080×1920 (vertical)**, 30fps, 150 frames. Footage or a plate behind, with a bottom scrim
  `linear-gradient(transparent 40%, rgba(0,0,0,0.55) 100%)`. Captions anchored 420px from the bottom.
- Montserrat, weight 900, uppercase, line-height 1.06, letter-spacing `-0.02em`. Normal words 104px in
  `color` (`theme.ink`); the emphasis word 150px in `hitColor` (`theme.series[3]`, house `#ffd166`) —
  it pops UP TO that size, see below.
- Pages of three words, `flex-wrap`, `align-items: baseline`, `gap: '0 24px'`, max-width 940.

**Author the emphasis — do not compute it**
Put a `hit` flag on the word in the script:

```tsx
{text: 'SECONDS', start: 1.72, end: 2.26, hit: true}
```

It is tempting to pick the emphasis at runtime — the longest word, or the last one on the page. Both
land on `THE` and `AND` regularly, and that is precisely what makes auto-captioned video feel
machine-made. The emphasis is an editorial decision; it belongs in the data.

**The stamp**
- Each page arrives on a spring keyed to its first word:
  `spring({frame: frame - Math.round(pageStart * fps), fps, config: {damping: 13, stiffness: 210, mass: 0.55}})`,
  applied as `scale: 0.82 + Math.min(1, stamp) * 0.18`.
- The emphasis word gets its **own** spring on its own start, a little tighter
  (`damping: 11, stiffness: 250`), clamped and scaled `0.88 + Math.min(0.12, pop * 0.12)`, so it grows
  132 → 150 inside a box already sized for its resting state; a scale above 1 spills into the next
  word whenever a narrower typeface packs two words onto one line. Clamp it — an unclamped spring
  overshoots well past its target and the word visibly lurches.
- Give each page a **seeded tilt**, `(random(\`tilt-${page}\`) - 0.5) * 5` degrees. Consecutive pages
  landing at the same angle read as a template; a small varying tilt reads as stamped. Use `random()`
  from `remotion`, never `Math.random()`, or the tilt re-rolls on every rendered frame and the text
  vibrates.
- Words not yet spoken sit at `opacity: 0.3` so the viewer can read ahead.

**The outline**

```tsx
WebkitTextStroke: `11px ${strokeColor}`,          // theme.bgDeep, #04050a
paintOrder: 'stroke fill',
textShadow: `0 ${w.hit ? 10 : 9}px 0 ${strokeColor}`,
```

`paintOrder: 'stroke fill'` draws the stroke **behind** the glyph, so an 11px stroke does not eat into
the letterforms. A blurred `text-shadow` disappears into busy footage exactly when legibility matters;
a hard stroke plus a hard offset drop survives anything. Give the emphasis word a slightly heavier
stroke (15px) so it stays proportional at its larger size.

**Requirements**
- One self-contained `.tsx` file exporting `HypeCaptions` and a `Word` type
  (`{text, start, end, hit?}`, times in **seconds** — the shape `@remotion/captions` produces).
- Props: `src`, `words`, `wordsPerPage`, `hitColor`, `color`, `strokeColor`, `transparent`.
- With `transparent`, the plate is omitted and the background is clear, so this renders as an alpha
  overlay (`--codec=prores --prores-profile=4444`) to burn over a real edit. ProRes 4444 survives the
  composite; VP8 WebM alpha comes back as a black box, so keep `--codec=vp8` for web playback only.
- Give the plate a slow scale push so the frame behind the captions is never static.
- Load Montserrat via `@remotion/google-fonts/Montserrat`.
