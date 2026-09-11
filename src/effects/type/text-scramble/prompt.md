Build a Remotion composition called **TextScramble**: a headline whose letters churn through random
glyphs and lock into place one after another, left to right.

**The look**
- 1920×1080, 30fps, 105 frames. Near-black background (`theme.bgDeep`, house `#04050a`), centred content.
- Headline in Space Grotesk, 150px, weight 700, letter-spacing `0.02em`. Default word: `DECRYPTING`.
- A subtitle under it at 34px, weight 500, uppercase, letter-spacing `0.16em`, in `accentColor` =
  `theme.series[2]` (house lime `#c6ff3d`), 34px below. It fades in over ~0.6s once the last character
  has locked.

**The animation**
- Character `i` starts scrambling at frame `i * stagger` (stagger ≈ 3) and locks at
  `i * stagger + scrambleFrames` (scrambleFrames ≈ 18). Before its start it renders as a space; after
  it locks it renders its real character.
- While scrambling it shows a glyph picked from a pool of symbols and capitals
  (`!<>-_\/[]{}—=+*^?#` plus A–Z and 0–9), swapping to a new one every 2 frames.
- Scrambling characters are `accentColor` at `opacity: 0.72`; locked characters are `color` =
  `theme.body` (house `#eef1f7`) at full opacity. That colour change is what communicates "resolving".

**Two things that will otherwise ruin it**
- **Use `random(seed)` from `remotion`, never `Math.random()`.** Seed it on both the character index
  and the tick number, e.g. `random(\`scramble-${i}-${tick}\`)` where `tick = Math.floor((frame - start) / 2)`.
  Remotion renders frames out of order and re-renders them; `Math.random()` gives a different glyph
  every time a frame is drawn, so the text boils instead of scrambling.
- **Give every character a fixed-width slot sized to the FACE, not to the glyph:** `display: flex` on
  the row, and each slot `position: relative`, `min-width: 0.92em` (Space Grotesk 700's widest capital),
  `text-align: center`. Inside it put a `visibility: hidden` `W` — that is what sets the width, so a
  theme's wider face widens every slot equally instead of overflowing into the next — and the churning
  character absolutely positioned (`left: 0; right: 0; top: 0`) over it, so a wide glyph such as the em
  dash can never resize its own slot and reflow the line. Proportional glyphs are different widths, so
  without this the headline jitters horizontally as the glyphs swap.

**Requirements**
- One self-contained `.tsx` file exporting `TextScramble`.
- Props: `text`, `subtitle`, `scrambleFrames`, `stagger`, `backgroundColor`, `color`, `accentColor` —
  optional, with the defaults above.
- Load Space Grotesk via `@remotion/google-fonts/SpaceGrotesk`.
