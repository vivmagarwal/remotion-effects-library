Build a Remotion composition called **HeroHandoverUi** (composition id `hero-handover-ui`): Google's Gemini
landing state — sparkle, hero line, pill composer — typing a prompt, sending it, and handing over to a
streamed answer.

**The look**
- 1920×1080, 30fps, 340 frames. Inter throughout.
- **Page wash** — Gemini's signature: `linear-gradient(#ffffff 0%, #ffffff 34%, #e8f0fe 78%, #cfe0fb 100%)`.
  White at the top falling to a pale blue floor. This one gradient is most of the brand read.
- **URL bar**: white row, back / forward / reload strokes, then a pill with a **2px `#1a73e8` border**
  (focused state) containing the URL on an `#accef7` selection highlight — as if it was just clicked.
- **Header**: hamburger, `Gemini` at 25px `#1f1f1f`, the model name in `#9aa0a6`, and a `Sign in` pill
  in `#d3e3fd` with `#0b57d0` text.
- **Composer**: a white **fully-round pill** (`border-radius: 999`), padding `22px 32px`, with
  `boxShadow: '0 1px 3px rgba(60,64,67,0.12), 0 10px 30px rgba(60,64,67,0.14)'`, a `+` on the left and
  a mic on the right. Below it, the Terms/Privacy line at 17px `#5f6368` with underlined link spans.
- Gemini's composer is a **pill**, not a rounded box — that alone distinguishes it from ChatGPT's at a
  glance, so do not round the corners halfway.

**The sparkle**
A four-point star with concave sides, as one SVG path, filled with a diagonal gradient through
Google's palette:

```tsx
<linearGradient id="gem-spark" x1="0.34" y1="0" x2="0.66" y2="1">
  <stop offset="0%" stopColor="#4285f4" /><stop offset="30%" stopColor="#7b6ef0" />
  <stop offset="55%" stopColor="#ea4335" /><stop offset="78%" stopColor="#fbbc05" />
  <stop offset="100%" stopColor="#34a853" />
</linearGradient>

<path d="M12 1.6C12 7 17 12 22.4 12 17 12 12 17 12 22.4 12 17 7 12 1.6 12 7 12 12 7 12 1.6Z"
      fill="url(#gem-spark)" />
```

The `C` curves are what make the arms concave; straight lines give you a diamond, not a sparkle.

Two things to get right:
- **Run the gradient top-to-bottom** (`x1="0.34" y1="0"` → `x2="0.66" y2="1"`), not corner-to-corner.
  The star's points sit at 12 and 6 o'clock, so a diagonal gradient lands purple on the top point and
  the blue never appears at all.
- **Rock it, do not spin it.** `rotate: \`${Math.sin((frame / fps) * 0.55) * 7}deg\`` — the mark reads as
  upright in the real product, and a continuous rotation immediately looks like a loading spinner.

**The handover — one value, two states**
When the prompt is sent, the hero has to leave and the answer has to arrive. Drive **both from the same
progress**:

```tsx
const handover = interpolate(frame, [sendAt, sendAt + 16], [0, 1],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});

// hero out
opacity: 1 - handover, scale: 1 - handover * 0.06, translate: `0px ${-handover * 40}px`,
// answer in
opacity: handover,      translate: `0px ${(1 - handover) * 30}px`,
```

Stack them as two `<AbsoluteFill>`s in the same container. Animating them on separate interpolations
means that any retiming leaves either a gap where neither is visible or a moment where both are —
tying them to one value makes that impossible by construction.

**The composer's states**
- Typing: `prompt.slice(0, Math.floor((frame - typeFrom) / fps * charsPerSecond))` with a 2px `#1a73e8`
  caret. `charsPerSecond ≈ 19`.
- The right-hand control **swaps**: mic while empty, a 50px `#0b57d0` circular send button as soon as
  there is a draft, then back to the mic once sent and the field is cleared. A real UI swaps this
  control; fading between two overlapping icons is the giveaway.
- Send press at `sendAt`: `interpolate(frame - sendAt, [0, 3, 12], [0.88, 0.88, 1], …)`.
- The answer streams from `sendAt + thinkFrames` at `answerCharsPerSecond ≈ 44` — roughly double the
  typing speed, because a person types and a model streams. It carries a small round `#1a73e8` cursor
  while incomplete, and is laid out beside a 34px sparkle.

**Programmable in and out**
`enterFrames` (20) and `exitFrames` (26, `0` to disable), plus a small typing push
(`zoomWhileTyping` 1.03) that is **cancelled by the handover** — `zoom = 1 + (z - 1) * typingProgress *
(1 - handover)` — so the frame settles back once the answer arrives rather than staying pushed in.

**Requirements**
- One self-contained `.tsx` file exporting `HeroHandoverUi`.
- Props: `prompt`, `answer`, `hero`, `url`, `model`, `charsPerSecond`, `answerCharsPerSecond`,
  `typeFrom`, `thinkFrames`, `enterFrames`, `exitFrames`, `zoomWhileTyping`.
- Load Inter via `@remotion/google-fonts/Inter`.
- Everything derives from `useCurrentFrame()`; no timers, no CSS animation.
