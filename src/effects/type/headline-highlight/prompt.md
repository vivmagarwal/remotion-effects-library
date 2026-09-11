Build a Remotion composition called **HeadlineHighlight**: a news article page where a yellow marker
sweeps across the important phrases in the headline, one after another.

**The look**
- 1920×1080, 30fps, 150 frames. Paper background `backgroundColor` = `theme.paper` (house `#f6f5f2`), 150px side padding, content vertically centred and left-aligned in a column.
- Kicker (`Technology`) — Inter, 30px, `theme.paperMuted` (house `#4a4e5a`), underlined with a 6px underline offset.
- Headline — Playfair Display, 92px, weight 700, line-height 1.24, `theme.paperInk` (house `#1d1b17`), max-width
  1450px, 26px below the kicker.
- Byline — Inter, 28px, `theme.accentOnPaper` (house `#c2410c`), underlined, 44px below the headline.
- Timestamp line — Inter, 25px, `theme.paperMuted`, 14px below the byline.
- A bordered "source" chip below that: Inter 24px weight 600, 1px border `rgba(29,27,23,0.16)`,
  radius `theme.radius * 8 / 18` (8 at house), `10px 18px` padding, `align-self: flex-start`. It fades
  in at the 3-second mark.
- Kicker, headline, byline and timestamp each fade in on a short overlapping stagger over the first
  ~32 frames.

**The highlight — the part to get right**
- The headline is an array of spans, some flagged as highlighted. Render a plain `<span>` for the rest.
- For a highlighted span, wrap it in a `position: relative; display: inline-block` element containing
  two children: an absolutely positioned stroke (`left: -0.03em`, `top: 0.12em`, `bottom: 0.08em`,
  `background: highlightColor`, `zIndex: 0`) whose `width` interpolates from `'0%'` to `'106%'`, and the
  text itself at `position: relative; zIndex: 1`. `highlightColor` is `theme.series[3]` (house
  `#ffd166`), at 40% alpha (`${theme.series[3]}66`) when `theme.scheme === 'light'`, because a light
  theme's palette is dark ink and a solid bar of it hides the type it marks.
- **The stroke must sit behind the text, not on it.** A background colour applied to the text element
  tints the glyphs and reads as a coloured label; a separate layer behind them keeps the letters solid
  black and reads as a real highlighter passing over the page.
- Strokes fire in sequence: highlight `n` starts at `startAt + n * (strokeFrames + 6)` with
  `startAt = 24` and `strokeFrames = 20`, easing `Easing.bezier(0.32, 0.72, 0.3, 1)` — quick at first,
  settling at the end, like a real marker stroke.
- Both ends of a width interpolation need the same unit: `['0%', '106%']`, not `[0, '106%']`.

**Requirements**
- One self-contained `.tsx` file exporting `HeadlineHighlight`.
- Props: `kicker`, `headline` (array of `{text, highlight?}`), `byline`, `meta`, `backgroundColor`,
  `highlightColor`, `startAt`, `strokeFrames` — optional, with the defaults above.
- Load both fonts via `@remotion/google-fonts/PlayfairDisplay` and `@remotion/google-fonts/Inter`.
