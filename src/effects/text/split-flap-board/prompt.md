Build a Remotion composition called **SplitFlapBoard**: an airport departure board whose tiles clatter
through the alphabet until each lands on its letter.

**The look**
- 1920×1080, 30fps, 150 frames. Very dark background `#0a0c10`, everything centred, DM Mono throughout.
- A title `DEPARTURES` at 42px with `letter-spacing: 0.5em` in muted `#5a6172`, 46px above the board.
- Three rows. Each row is a time label (62px, `#5a6172`, fixed 220px width) followed by one tile per
  character of the word.
- A tile is a 88×118 inline-flex box, radius 7, fill `#181c25`, 8px right margin, character at 70px.
  Unsettled tiles are pale grey `#cfd3dc`; a settled tile turns amber `#ffd166`.
- Each tile carries a hairline across its middle —
  `linear-gradient(#0000 calc(50% - 1px), #00000090 50%, #0000 calc(50% + 1px))` — plus
  `inset 0 1px 0 rgba(255,255,255,0.07)`. That seam is what makes it read as a flap rather than a box.
- A footer line fades in at the 3-second mark.

**The flip mechanic — the clever bit**
- Define an ordered alphabet: `' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:-/'`.
- For a tile, `target = ALPHABET.indexOf(char.toUpperCase())`. With `elapsed = frame - delay`, the
  currently shown index is `Math.min(target, Math.floor(elapsed / flipFrames))` — clamped, so the tile
  stops when it arrives.
- Because the alphabet is ordered, **the number of flips a tile needs is its target's index**. Tiles
  landing on `Z` keep going long after tiles landing on `B` have stopped, and that uneven settling is
  what a real board does. Do not randomise it.
- Squash the tile during each flip: `withinFlip = (elapsed % flipFrames) / flipFrames`, then
  `squash = 0.55 + 0.45 * Math.abs(Math.cos(withinFlip * Math.PI))`, applied as `scale: \`1 ${squash}\``
  (x unchanged, y compressed). Settled tiles sit at `scale: '1 1'`.
- `delay = row * 6 + column * columnStagger` (columnStagger ≈ 4) so columns cascade left to right.
- `flipFrames` ≈ 3 — fast enough to blur into a clatter at 30fps.

**Requirements**
- One self-contained `.tsx` file exporting `SplitFlapBoard`.
- Props: `rows` (array of `{label, value}`), `title`, `flipFrames`, `columnStagger`,
  `backgroundColor`, `tileColor`, `accentColor` — optional, with the defaults above.
- Load DM Mono via `@remotion/google-fonts/DMMono`.
- Everything derives from `useCurrentFrame()`; no timers, no CSS animation.
