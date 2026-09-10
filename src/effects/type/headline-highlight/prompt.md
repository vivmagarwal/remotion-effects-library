Build a Remotion composition called **HeadlineHighlight**: a news article page where a yellow marker
sweeps across the important phrases in the headline, one after another.

**The look**
- 1920×1080, 30fps, 150 frames. Warm paper background `#f4f4f2`, 150px side padding, content vertically centred and left-aligned in a column.
- Kicker (`Technology`) — Inter, 30px, grey `#7a7a74`, underlined with a 6px underline offset.
- Headline — Playfair Display, 92px, weight 700, line-height 1.24, near-black `#141414`, max-width
  1450px, 26px below the kicker.
- Byline — Inter, 28px, dark red `#8a2f2f`, underlined, 44px below the headline.
- Timestamp line — Inter, 25px, grey `#8b8b85`, 14px below the byline.
- A bordered "source" chip below that: Inter 24px weight 600, 1px border `#d3d3cd`, radius 8,
  `10px 18px` padding, `align-self: flex-start`. It fades in at the 3-second mark.
- Kicker, headline, byline and timestamp each fade in on a short overlapping stagger over the first
  ~32 frames.

**The highlight — the part to get right**
- The headline is an array of spans, some flagged as highlighted. Render a plain `<span>` for the rest.
- For a highlighted span, wrap it in a `position: relative; display: inline-block` element containing
  two children: an absolutely positioned stroke (`left: -0.03em`, `top: 0.12em`, `bottom: 0.08em`,
  `background: #ffe14d`, `zIndex: 0`) whose `width` interpolates from `'0%'` to `'106%'`, and the text
  itself at `position: relative; zIndex: 1`.
- **The stroke must sit behind the text, not on it.** A background colour applied to the text element
  tints the glyphs and reads as a coloured label; a separate layer behind them keeps the letters solid
  black and reads as a real highlighter passing over the page.
- Strokes fire in sequence: highlight `n` starts at `startAt + n * (strokeFrames + 6)` with
  `startAt = 24` and `strokeFrames = 20`, easing `Easing.bezier(0.32, 0.72, 0.3, 1)` — quick at first,
  settling at the end, like a real marker stroke.
- Both ends of a width interpolation need the same unit: `['0%', '106%']`, not `[0, '106%']`.

**Requirements**
- One self-contained `.tsx` file exporting `HeadlineHighlight`.
- Props: `kicker`, `headline` (array of `{text, highlight?}`), `byline`, `meta`, `highlightColor`,
  `startAt`, `strokeFrames` — optional, with the defaults above.
- Load both fonts via `@remotion/google-fonts/PlayfairDisplay` and `@remotion/google-fonts/Inter`.
