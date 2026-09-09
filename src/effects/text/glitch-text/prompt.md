Build a Remotion composition called **GlitchText**: a word whose colour channels tear apart and whose
horizontal slices displace, in short repeating bursts.

**The look**
- 1920×1080, 30fps, 120 frames. Near-black `#08080c`, centred. Word in Anton, 260px,
  letter-spacing `0.02em`, inside a `position: relative` box 1300×300.
- A monospace subtitle below in cyan, 28px, uppercase, letter-spacing `0.28em`.
- A permanent scanline overlay on top of everything:
  `repeating-linear-gradient(to bottom, rgba(255,255,255,0.045) 0 2px, transparent 2px 5px)` in an
  `<AbsoluteFill>` with `pointerEvents: 'none'`.

**The glitch**
- Stack **three absolutely positioned copies** of the same word, each `inset: 0` and flex-centred:
  cyan `#00e5ff`, magenta `#ff2d6f` (both `mixBlendMode: 'screen'`), and white on top in `normal`.
- Burst timing: `cycle = Math.floor(frame / cycleFrames)`, `withinCycle = frame % cycleFrames`,
  `bursting = withinCycle < burstFrames`, with `cycleFrames = 26` and `burstFrames = 7`.
- **Between bursts every layer must sit at exactly zero offset**, in perfect register. This is what
  makes it read as a glitch — a permanently split word just looks like a badly-made logo.
- During a burst, offset each coloured layer by a seeded jitter,
  `(random(\`${key}-${frame}\`) - 0.5) * 2 * amount`, plus a constant ±6px pull in opposite directions
  for the cyan and magenta copies.
- Slice displacement: during a burst, render three more copies of the word, each cut to a horizontal
  band with `clipPath: \`inset(${top} 0 calc(100% - ${top} - ${height}) 0)\`` and shifted sideways by up
  to ±45px. Seed the band positions on the **cycle** (not the frame) so a band holds still for the
  length of a burst instead of flickering every frame.

**Use `random(seed)` from `remotion`, not `Math.random()`.** Remotion renders frames out of order and
re-renders them; `Math.random()` produces a different offset each time a frame is drawn, so the glitch
never reproduces and looks like noise rather than a designed effect.

**Requirements**
- One self-contained `.tsx` file exporting `GlitchText`.
- Props: `text`, `subtitle`, `cycleFrames`, `burstFrames`, `intensity`, `backgroundColor`, `color` —
  optional, with the defaults above.
- Load Anton via `@remotion/google-fonts/Anton`.
- `translate` needs units on both values: `` `${dx}px ${dy}px` ``.
