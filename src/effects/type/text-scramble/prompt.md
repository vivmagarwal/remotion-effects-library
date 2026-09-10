Build a Remotion composition called **TextScramble**: a headline whose letters churn through random
glyphs and lock into place one after another, left to right.

**The look**
- 1920×1080, 30fps, 105 frames. Near-black background (`#050608`), centred content.
- Headline in Space Grotesk, 150px, weight 700, letter-spacing `0.02em`. Default word: `DECRYPTING`.
- A subtitle under it at 34px, weight 500, uppercase, letter-spacing `0.16em`, in the accent green
  (`#4ade80`), 34px below. It fades in over ~0.6s once the last character has locked.

**The animation**
- Character `i` starts scrambling at frame `i * stagger` (stagger ≈ 3) and locks at
  `i * stagger + scrambleFrames` (scrambleFrames ≈ 18). Before its start it renders as a space; after
  it locks it renders its real character.
- While scrambling it shows a glyph picked from a pool of symbols and capitals
  (`!<>-_\/[]{}—=+*^?#` plus A–Z and 0–9), swapping to a new one every 2 frames.
- Scrambling characters are accent green at `opacity: 0.72`; locked characters are off-white
  (`#eef2f7`) at full opacity. That colour change is what communicates "resolving".

**Two things that will otherwise ruin it**
- **Use `random(seed)` from `remotion`, never `Math.random()`.** Seed it on both the character index
  and the tick number, e.g. `random(\`scramble-${i}-${tick}\`)` where `tick = Math.floor((frame - start) / 2)`.
  Remotion renders frames out of order and re-renders them; `Math.random()` gives a different glyph
  every time a frame is drawn, so the text boils instead of scrambling.
- **Give every character a fixed-width slot** (`display: flex` on the row, `width: 0.68em` and
  `text-align: center` per character). Proportional glyphs are different widths, so without this the
  headline jitters horizontally as the glyphs swap.

**Requirements**
- One self-contained `.tsx` file exporting `TextScramble`.
- Props: `text`, `subtitle`, `scrambleFrames`, `stagger`, `backgroundColor`, `color`, `accentColor` —
  optional, with the defaults above.
- Load Space Grotesk via `@remotion/google-fonts/SpaceGrotesk`.
