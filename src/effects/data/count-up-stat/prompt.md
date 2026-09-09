Build a Remotion composition called **CountUpStat**: one large statistic that counts up from zero and
lands with a small punch.

**The look**
- 1920×1080, 30fps, 120 frames. Background `#0b0b10` with a warm glow behind the number:
  `radial-gradient(ellipse at 50% 42%, #ff8a3d26 0%, transparent 58%)`. Everything centred, Inter.
- The number at 300px, weight 800, line-height 1, letter-spacing `-0.045em`, white. Default value
  `11772`, `prefix` `''`, `suffix` `'+'`, `decimals` `0`. The **suffix** takes the accent orange
  `#ff8a3d`; the prefix stays in the main colour.
- Label 6px below at 46px weight 500 in `#9aa0b0` (fixed — it is not a prop). Default:
  `'Happy customers'`.
- A small uppercase caption 30px below that, at 26px, `letter-spacing: 0.28em`, in the accent colour.
  Default: `'and counting'`. It fades in over 16 frames starting at `settleAt`.
- The glow behind the number is derived from `accentColor`, not hardcoded:
  `` `radial-gradient(ellipse at 50% 42%, ${accentColor}26 0%, transparent 58%)` `` — so re-theming the
  accent moves the glow with it. (That only works for hex colours; an `rgb()` value would need an
  alpha-aware form.)
- With `decimals > 0` the counter ticks through fractional digits mid-flight, not just at rest.

**The count**
- `interpolate(frame, [8, 8 + countSeconds * fps], [0, value], {...})` with `countSeconds` ≈ 1.8,
  clamped on both sides.
- Ease with **`Easing.bezier(0.1, 0.9, 0.2, 1)`** — a hard deceleration. Most of the distance is
  covered in the first third and the last few units crawl in. A linear count looks like a spreadsheet
  recalculating; the deceleration is what makes the final number feel arrived-at.
- Format with `toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals})`
  so thousands separators appear while counting.

**The detail that matters most**
- Set **`fontVariantNumeric: 'tabular-nums'`** on the number. Proportional digits are different
  widths — a `1` is much narrower than a `0` — so without this the number visibly jitters and reflows
  on every single tick. This one line is the difference between a polished counter and an amateur one.

**The landing**
- At `settleAt = 8 + countSeconds * fps`, pulse the scale
  `[settleAt, settleAt + 8, settleAt + 22] → [1, 1.045, 1]` with `Easing.bezier(0.16, 1, 0.3, 1)` and
  `output: 'perceptual-scale'`. Keep it small — 4.5% is a punctuation mark, 20% is a cartoon.
- The label rises `'0px 18px'` → `'0px 0px'` and fades in over frames 12–34; the caption fades in over
  `settleAt → settleAt + 16`.

**One more typographic detail**
A centred line with `letter-spacing` gets that spacing appended **after its last glyph too**, so the
text sits half a letter-space left of true centre. Cancel it with a negative margin equal to the
tracking — `marginRight: '-0.28em'` for a `0.28em` caption. It is a few pixels, and it is the
difference between "centred" and "nearly centred".

**Requirements**
- One self-contained `.tsx` file exporting `CountUpStat`.
- Props: `value`, `prefix`, `suffix`, `label`, `caption`, `decimals`, `countSeconds`,
  `backgroundColor`, `color`, `accentColor` — optional, with the defaults above.
- Load Inter via `@remotion/google-fonts/Inter`.
- Both ends of the `translate` interpolation need the same units (`'0px 18px'` → `'0px 0px'`).
