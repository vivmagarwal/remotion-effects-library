Build a Remotion composition called **ClaudeFullUi** (composition id `claude-full-ui`): Claude's
interface typing a prompt, sending it, and streaming a reply.

**The palette is the brief**
Every other assistant UI is white-and-blue. Claude is **warm paper and clay**, and getting this right
matters more than any single element:

- page `#faf9f5`, sidebar `#f2efe6` with a `1px solid #e8e3d6` divider — a shade deeper than the page,
  not a different colour;
- text `#2b2924`, secondary `#6c675e`, tertiary `#9c968a`;
- one accent, clay `#d97757`, used on the mark, the caret, the avatar and the send button and
  **nowhere else**;
- the composer is the only pure white surface in the frame, which is what makes it read as the active
  input.

**The layout**
- 1920×1080, 30fps, 340 frames. Inter for UI, Playfair Display for the greeting.
- **Sidebar**, 268px with **34px horizontal padding**: the sunburst + `Claude` wordmark, a `New chat` row on `#e9e4d6` with radius 12, a
  `RECENTS` label at 15px with `letter-spacing: 0.06em`, and three truncated conversation titles.
- **Header**: the model name at 19px in `#6c675e` with a `⌄`, and a 42px circular clay avatar on the
  right.
- **Greeting state**: the sunburst at 62px above a Playfair Display line at 62px. The serif is the
  other half of the brand read — set it in the UI sans and it stops looking like Claude.
- **Composer**: white, `1px solid #e4dfd0`, radius 22, padding `22px 26px 16px`, shadow
  `0 1px 2px rgba(60,50,30,0.05), 0 14px 34px rgba(60,50,30,0.08)`. Bottom row: a `+` and the model
  name on the left; a **46px rounded-square** send button on the right (radius 12 — not a circle, which
  is what ChatGPT and Gemini both use).

**The sunburst**
Twelve rays. Draw **one** tapered rounded rect and rotate it twelve times about the centre:

```tsx
{new Array(12).fill(0).map((_, i) => (
  <rect key={i} x={22.6} y={3.5} width={2.8} height={17} rx={1.4} fill={accentColor}
        transform={`rotate(${i * 30} 24 24)`} />
))}
```

in a `viewBox="0 0 48 48"`. Placing twelve rays by hand never quite lands them evenly, and the
unevenness is visible at any size above about 40px.

**Motion that means something**
Spin the small sunburst **only while the answer is still streaming**:
`spin={streaming ? frame * 2.4 : 0}`. It becomes a status indicator rather than decoration — it starts
when the model starts and stops when it stops. The large greeting sunburst gets a slow rock instead
(`Math.sin((frame / fps) * 0.5) * 6`), never a spin.

**The handover — one value, two states**

```tsx
const handover = interpolate(frame, [sendAt, sendAt + 16], [0, 1], {/* ease-out, clamped */});

// greeting out
opacity: 1 - handover, scale: 1 - handover * 0.05, translate: `0px ${-handover * 36}px`,
// conversation in
opacity: handover,     translate: `0px ${(1 - handover) * 28}px`,
```

Two `<AbsoluteFill>`s in the same container, driven by the same progress — so retiming can never leave
a gap where neither is visible, or a moment where both are.

**The composer's states**
- Typing: `prompt.slice(0, Math.floor((frame - typeFrom) / fps * charsPerSecond))`, `charsPerSecond ≈ 18`,
  with a 2px clay caret.
- Send button: clay with a white arrow while there is a draft, `#e6e1d4` with a `#b3ada0` arrow
  otherwise.
- Placeholder cycles `How can I help you today?` → the draft → `Reply to Claude…` after sending, which
  is what the real composer does once a thread exists.
- The answer streams at `answerCharsPerSecond ≈ 40` — roughly double the typing speed, because a person
  types and a model streams.

**Programmable in and out**
`enterFrames` (20) and `exitFrames` (26, `0` to disable), plus a typing push (`zoomWhileTyping` 1.04)
cancelled by the handover — `zoom = 1 + (z - 1) * typingProgress * (1 - handover)` — so the frame
settles back once the answer arrives.

**Mind the crop.** Scaling the whole window pushes its edges outside the frame: a `1.03` push loses
about `1920 × 0.015 ≈ 29px` from each side. Anything nearer the edge than that gets clipped mid-shot —
which is why the sidebar carries 34px of padding rather than the 20px the layout would otherwise want.
Set the padding from the push, not the other way round.

**Requirements**
- One self-contained `.tsx` file exporting `ClaudeFullUi`.
- Props: `greeting`, `prompt`, `answer`, `model`, `charsPerSecond`, `answerCharsPerSecond`, `typeFrom`,
  `thinkFrames`, `enterFrames`, `exitFrames`, `zoomWhileTyping`, `accentColor`, `paperColor`.
- Load Inter and Playfair Display via `@remotion/google-fonts`.
- Everything derives from `useCurrentFrame()`; no timers, no CSS animation.
