Build a Remotion composition called **HypeCaptions** (composition id `hype-captions`): retention-style
captions stamped over footage, with one word per page blown up.

**The look**
- **1080×1920 (vertical)**, 30fps, 150 frames. Footage or a plate behind, with a bottom scrim
  `linear-gradient(transparent 40%, rgba(0,0,0,0.55) 100%)`. Captions anchored 420px from the bottom.
- Montserrat, weight 900, uppercase, line-height 1.06, letter-spacing `-0.02em`. Normal words 104px in
  white; the emphasis word 132px in `#ffe14d`.
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
  (`damping: 11, stiffness: 250`), clamped to `1 + Math.min(0.14, pop * 0.14)`. Clamp it — an
  unclamped spring overshoots well past 1 and the word visibly lurches.
- Give each page a **seeded tilt**, `(random(\`tilt-${page}\`) - 0.5) * 5` degrees. Consecutive pages
  landing at the same angle read as a template; a small varying tilt reads as stamped. Use `random()`
  from `remotion`, never `Math.random()`, or the tilt re-rolls on every rendered frame and the text
  vibrates.
- Words not yet spoken sit at `opacity: 0.3` so the viewer can read ahead.

**The outline**

```tsx
WebkitTextStroke: '11px #0a0a0c',
paintOrder: 'stroke fill',
textShadow: '0 9px 0 #0a0a0c',
```

`paintOrder: 'stroke fill'` draws the stroke **behind** the glyph, so an 11px stroke does not eat into
the letterforms. A blurred `text-shadow` disappears into busy footage exactly when legibility matters;
a hard stroke plus a hard offset drop survives anything. Give the emphasis word a slightly heavier
stroke (13px) so it stays proportional at its larger size.

**Requirements**
- One self-contained `.tsx` file exporting `HypeCaptions` and a `Word` type
  (`{text, start, end, hit?}`, times in **seconds** — the shape `@remotion/captions` produces).
- Props: `src`, `words`, `wordsPerPage`, `hitColor`, `color`, `strokeColor`, `transparent`.
- With `transparent`, the plate is omitted and the background is clear, so this renders as an alpha
  overlay (`--codec=vp8`, or `--codec=prores --prores-profile=4444`) to burn over a real edit.
- Give the plate a slow scale push so the frame behind the captions is never static.
- Load Montserrat via `@remotion/google-fonts/Montserrat`.
