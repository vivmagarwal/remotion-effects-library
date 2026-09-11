Build a Remotion composition called **TypewriterTerminal**: a terminal window in which shell commands
type themselves out, with a block cursor that blinks.

**The look**
- 1920×1080, 30fps, 180 frames. Page background `backgroundColor` = `theme.bg` (house `#0a0b10`).
- A rounded terminal window (radius `theme.radius * 16 / 18`, 16 at house) centred with 96px page
  padding, fill `#12141b`, 1px border
  `#232733`, and a large soft drop shadow. It springs in over the first ~18 frames: scale 0.94→1
  (with `output: 'perceptual-scale'`) and opacity 0→1.
- A title bar with the three traffic-light dots (`#ff5f57`, `#febc2e`, `#28c840`, 14px circles) and the
  label `zsh` in muted grey, separated from the body by a 1px rule.
- Four lines of JetBrains Mono at 40px, line-height 1.65. Two are commands prefixed with an accent
  `$` (`#ff5c39`); two are output — one muted grey, one green (`#3ddc97`) for the success line.

**The animation — this is the part that matters**
- Typing: compute a single running character budget from the frame,
  `typedTotal = Math.floor(frame / fps * charsPerSecond)` with `charsPerSecond` ≈ 26. Walk the lines in
  order, giving each line up to its own length from the budget and subtracting a few extra characters'
  worth as a pause before the next line starts. Each line renders `text.slice(0, taken)`.
- Cursor: a solid accent-coloured block (`0.58em` × `1.05em`, `display:inline-block`) at the end of the
  line currently being typed. It blinks with `Math.floor(frame / blinkFrames) % 2 === 0`, ~15 frames on,
  15 off.
- **Do not use `setInterval`, `setTimeout` or a CSS animation for the blink.** They are not
  frame-deterministic: the renderer screenshots frames out of order, so a timer-driven cursor freezes
  or strobes randomly in the output. Everything must be a pure function of `useCurrentFrame()`.

**Requirements**
- One self-contained `.tsx` file exporting `TypewriterTerminal`.
- Props: `lines` (array of `{text, prompt?, color?}`), `charsPerSecond`, `blinkFrames`,
  `backgroundColor`, `color`, `accentColor`, `radius` — all optional with the defaults above.
- Load JetBrains Mono via `@remotion/google-fonts/JetBrainsMono` so the render does not fall back to a
  system font. Use `white-space: pre` so leading spaces survive.
