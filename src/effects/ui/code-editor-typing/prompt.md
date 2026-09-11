Build a Remotion composition called **CodeEditorTyping** (composition id `code-editor-typing`): a code
editor typing a snippet out, syntax-highlighted, with line numbers and a caret.

**Highlight the visible slice, not the finished source**
This is the whole point. Run the tokenizer on `code.slice(0, typed)` **every frame**, not once on the
full source:

```tsx
const typed = Math.max(0, Math.floor((frame - typeFrom) / fps * charsPerSecond));   // cps ≈ 34
const shown = code.slice(0, Math.min(code.length, typed));
```

A half-typed `retur` is not a keyword yet, so it stays plain and turns red the moment the `n` lands —
which is exactly what a real editor does. Highlighting the whole file once and then revealing it
character by character colours `retur` red from the first keystroke, and that single detail is what
makes an animation read as a video of text rather than as someone typing.

**The tokenizer**
One regex, one pass, alternation ordered so comments and strings win before identifiers:

```tsx
const TOKEN = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g;
```

Order matters: match strings and comments **first**, or a `return` inside a comment gets coloured as a
keyword. Colour an identifier as a function when the next character is `(`.

**Reserve the height**
Give the code column `minHeight: totalLines * lineHeight` and render **all** the line numbers from
frame 0 (dimmed to `opacity: 0.35` for lines not yet reached). Without this the block grows as it types
and the centred editor visibly creeps up the frame the whole time.

**The look**
- 1920×1080, 30fps, 300 frames. Page `backgroundColor` = `theme.bgDeep` (`#04050a`) with
  `radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.055) 0%, rgba(0,0,0,0.42) 66%)`.
- Editor 1440px wide on `syntax.bg` = `theme.surface` (`#101218`), radius `radius` (`theme.radius`,
  18), `1px solid #232838`, `boxShadow: '0 40px 100px rgba(0,0,0,0.6)'`, `overflow: hidden`.
- Title bar: three 13px traffic lights and the filename at 20px in `#7a8299`, with a `1px solid #232838`
  bottom border.
- Gutter 88px wide, right-aligned, `#3a4055`. Code at 30px, `line-height: 1.6`, `whiteSpace: 'pre'`.
- Syntax palette (the `syntax` prop): text `#d6dae6`, keyword `#ff7b72`, string `#a5d6a3`, comment
  `#6b7285` italic, number `#f2cc7f`, function `#7fb5ff`.
- Caret: a 3px `inline-block` at `1.05em` in `#7fb5ff` on the last visible line, blinking with
  `Math.floor(frame / blinkFrames) % 2 === 0` **only once typing has finished** — a real caret goes
  solid under keystrokes.

**Programmable in and out**
`enterFrames` (20) and `exitFrames` (24, `0` to disable), multiplied into one transform:
`scale: (0.95 + enter * 0.05) * (1 - exit * 0.05)`, `opacity: enter * (1 - exit)`.

**Requirements**
- One self-contained `.tsx` file exporting `CodeEditorTyping`.
- Props: `code`, `filename`, `charsPerSecond`, `typeFrom`, `enterFrames`, `exitFrames`, `blinkFrames`,
  `syntax` (an object of eight colours: bg, gutter, text, keyword, string, comment, number, fn),
  `fontSize`, `backgroundColor`, `radius`, and the shared `theme`.
- Load JetBrains Mono via `@remotion/google-fonts/JetBrainsMono` — a monospace face is not optional
  here; a proportional font makes the gutter and the code disagree line by line.
- No timers and no CSS animation; everything derives from `useCurrentFrame()`.
