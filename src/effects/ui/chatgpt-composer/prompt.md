Build a Remotion composition called **ChatGptComposer** (composition id `chatgpt-composer`): a
pixel-faithful ChatGPT prompt box that types itself out and sends.

**The box**
- 1920×1080, 30fps, 330 frames. White page, everything centred, Inter throughout.
- A 1300px-wide column. Above the box, `ChatGPT is AI and can make mistakes.` at 21px in `#8f8f8f`,
  26px of clearance below it.
- The box: white, `1px solid #e3e3e3`, `border-radius: 30`, padding `30px 32px 22px`, and a
  **two-layer shadow** — `0 2px 8px rgba(0,0,0,0.04), 0 24px 60px rgba(0,0,0,0.09)`. The tight layer
  gives the edge definition and the wide soft layer gives it lift; one shadow alone reads as either
  flat or as a floating card.
- Text at 30px, line-height 1.55, `#0d0d0d` — or `#9b9b9b` for the `Ask anything` placeholder while
  empty.
- Bottom row, 26px below the text, `justify-content: space-between`: a thin `+` on the left; on the
  right a microphone icon and a 58px circular send button, 26px apart. Draw all three as inline SVG
  with `stroke-width` ~1.6–2.2 and round caps.

**The send button is the state indicator**
`backgroundColor: hasText ? '#0d0d0d' : '#d7d7d7'`. Grey and dead while the box is empty, black the
instant the first character lands. That single colour swap is what makes the mock feel like a real
input rather than a picture of one.

**The typing**
- Drive it from a character budget: `Math.floor((frame - typeFrom) / fps * charsPerSecond)`, with
  `charsPerSecond ≈ 22` and `typeFrom = 18`. Do **not** use `setInterval` — Remotion renders frames out
  of order, so a timer-driven typewriter freezes or strobes in the output.
- The caret is a 2px `inline-block` the height of a line (`1.05em`), `vertical-align: -0.18em`, placed
  after the last character so it flows and wraps with the text. It blinks with
  `Math.floor(frame / blinkFrames) % 2 === 0` **only once typing has finished** — a caret that blinks
  while you are typing is wrong; real ones go solid under keystrokes.
- Spell-check squiggles: mark words in the source string with `*asterisks*`, strip them for display,
  and render those words with `textDecoration: 'underline'`, `textDecorationStyle: 'wavy'`,
  `textDecorationColor: '#e5484d'`, `textDecorationThickness: 1.5`, `textUnderlineOffset: 4`.
  **Only squiggle a word once it is fully typed** — a half-typed word has not been spell-checked yet,
  and squiggling it as it appears is an immediate tell.

**The box grows, it does not resize**
Give the box `height: auto` inside a centred column. As the text wraps to more lines the box grows and
the column keeps it centred — which is what the real composer looks like. Setting an explicit height
and animating it means fighting the text layout, and the line breaks will not agree with the box.

**The camera push — tie it to typing, not to time**

```tsx
const progress = shown / plain.length;                 // characters typed, 0→1
const zoom = interpolate(progress, [0, 1], [1, zoomWhileTyping], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  easing: Easing.bezier(0.4, 0, 0.3, 1),
  output: 'perceptual-scale',
});
```

Driving the push from typing **progress** rather than from `frame` means changing `charsPerSecond`
retimes the push automatically. Keep it small — `1.07` is a push; anything past `1.15` reads as a zoom
and fights the text.

**The send press**
Ten frames after the last character, squash the send button:
`interpolate(frame - pressAt, [0, 3, 12], [0.9, 0.9, 1], …)` — held briefly at 0.9, then recovering.

**Programmable in and out**
Two explicit props, `enterFrames` (default 20) and `exitFrames` (default 24, `0` to disable):

```tsx
const enter = interpolate(frame, [0, enterFrames], [0, 1], {/* ease-out */});
const exit  = interpolate(frame, [durationInFrames - exitFrames, durationInFrames], [0, 1], {/* ease-in */});

scale: (0.94 + enter * 0.06) * zoom * (1 - exit * 0.06),
translate: `0px ${(1 - enter) * 26 + exit * 30}px`,
opacity: enter * (1 - exit),
```

Multiplying entrance, push and exit into one transform — rather than nesting three wrappers — keeps
them composable and means they can overlap without fighting.

**Requirements**
- One self-contained `.tsx` file exporting `ChatGptComposer`.
- Props: `text`, `placeholder`, `charsPerSecond`, `typeFrom`, `enterFrames`, `exitFrames`,
  `zoomWhileTyping`, `blinkFrames`, `caption`, `width`, `backgroundColor`, `transparent`.
- With `transparent`, render as an alpha overlay (`--codec=vp8`, or
  `--codec=prores --prores-profile=4444`) to composite over a screen recording.
- Load Inter via `@remotion/google-fonts/Inter`.
