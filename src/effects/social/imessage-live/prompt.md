Build a Remotion composition called **ImessageLive** (composition id `imessage-live`): a message
thread where you watch each outgoing message get typed into the composer, sent, and answered — then
the next one typed.

**Derive every frame number from the script**
One pass over the turns produces the whole timeline, so editing a line of dialogue retimes everything
after it:

```tsx
let cursor = startAt;                                    // 16
const schedule = turns.map((t) => {
  const typeStart     = cursor;
  const sendAt        = typeStart + Math.ceil((t.send.length / charsPerSecond) * fps) + 10;  // cps 15
  const theirTypingAt = t.reply ? sendAt + 14 : null;
  const replyAt       = t.reply ? sendAt + 14 + theirTypingFrames : null;                    // 30
  cursor = (replyAt ?? sendAt) + betweenTurns;                                               // 26
  return {typeStart, sendAt, theirTypingAt, replyAt, turn: t};
});
```

A turn with no `reply` simply skips the indicator and the answer — which is how you end a thread on an
unanswered message. Hard-coding frames per bubble works once and rots the moment anyone edits the text.

**The look**
- **1080×1920 (vertical)**, 30fps, ~440 frames. Background `#101218`, a 980px column, Inter.
- Contact name centred at 34px weight 600 in `#8d93a5` with a `1px solid #23262f` rule under it.
- Bubbles at 38px, line-height 1.35, padding `24px 32px`, max-width 78%. Outgoing: accent `#2f6bff`,
  white text, radius `26px 26px 8px 26px`, right-aligned. Incoming: `#2a2d38`, `#e7e9ef`, radius
  `26px 26px 26px 8px`, left-aligned. **The asymmetric corner is what makes it read as a chat app.**
- Composer pinned at the bottom: a flexible pill (`#1b1e28`, `1px solid #2b2f3b`, radius 42, min-height
  84) holding the draft text or a `Message` placeholder, and an 84px circular send button beside it.

**The send button is the state indicator**
`backgroundColor: hasDraft ? accentColor : '#242833'`, with the arrow stroke going grey → white to
match. Dead while the box is empty, live the instant a character lands.

**The thread is bottom-anchored**
`flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: flex-end; overflow: hidden`.
New messages push older ones off the top like a real scroll — no scroll position, no measuring.
**`min-height: 0` is not optional**: a flex child defaults to `min-height: auto` and refuses to shrink
below its content, so without it the thread grows and shoves the composer off the bottom of the frame.

**The details that sell it**
- **`transformOrigin`** on each bubble — `'bottom right'` for outgoing, `'bottom left'` for incoming —
  so a bubble grows out of its own side of the thread. With the default centre origin it inflates in
  the middle and the link to the send button is lost. This one line does more than the spring does.
- Bubbles enter on `spring({frame: frame - at, fps, config: {damping: 14, stiffness: 180, mass: 0.6}})`,
  applied as `scale: 0.7 + Math.min(1, pop) * 0.3`. Clamp it — a spring overshoots past 1 on purpose,
  which is right for scale but wrong anywhere you need a 0–1 factor.
- **Typing indicator**: three 17px dots in a bubble-shaped container, all on **one** phase-shifted sine —
  `Math.sin(frame / 3.2 - i * 0.9)` driving both `translate` y and opacity. Animating them
  independently gives you a jitter; a CSS animation gives you nothing at all in the render.
- Send press: `interpolate(frame - sendAt, [0, 3, 12], [0.86, 0.86, 1], …)`.
- The caret in the composer is a 2px `inline-block` at `1.05em` in the accent colour.

**Programmable in and out**
`enterFrames` (18) and `exitFrames` (24, `0` to disable), multiplied into one transform on the column:
`scale: 0.96 + enter * 0.04 - exit * 0.04`, `opacity: enter * (1 - exit)`.

**Requirements**
- One self-contained `.tsx` file exporting `ImessageLive`.
- Props: `contact`, `turns` (array of `{send, reply?}`), `charsPerSecond`, `theirTypingFrames`,
  `betweenTurns`, `startAt`, `enterFrames`, `exitFrames`, `accentColor`, `backgroundColor`,
  `transparent`.
- Load Inter via `@remotion/google-fonts/Inter`.
- Everything derives from `useCurrentFrame()` — no timers, no CSS animation.
