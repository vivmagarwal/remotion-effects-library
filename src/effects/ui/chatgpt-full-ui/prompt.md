Build a Remotion composition called **ChatGptFullUi** (composition id `chatgpt-full-ui`): the whole
ChatGPT window — browser chrome, icon rail, thread and composer — playing a real multi-turn
conversation: a message types into the composer, gets sent, a reply arrives, then the next message is
typed.

**Derive the timeline from the script — do not hand-place frames**
This is the part that makes it maintainable. Walk the turns and compute each one's timing from its own
text length:

```tsx
let cursor = startAt;                                  // 24
const schedule = turns.map((t) => {
  const typeStart  = cursor;
  const typeEnd    = typeStart + Math.ceil((t.user.length / charsPerSecond) * fps);   // cps 20
  const sendAt     = typeEnd + 12;
  const replyStart = sendAt + thinkFrames;                                            // 26
  const replyEnd   = replyStart + Math.ceil((t.assistant.length / replyCharsPerSecond) * fps); // 42
  cursor = replyEnd + betweenTurns;                                                   // 34
  return {typeStart, typeEnd, sendAt, replyStart, replyEnd, turn: t};
});
```

Now editing a line of dialogue retimes the shot instead of desynchronising it, and the composition
duration is `cursor + hold + exitFrames`. Hard-coded frame numbers per turn look identical on the
first render and rot the moment anyone changes a word.

Note `replyCharsPerSecond` (42) is roughly double `charsPerSecond` (20): a person types, a model
streams. Running both at one speed is the single biggest tell in a mock like this.

**The window**
- 1920×1080, 30fps, ~520 frames for the default two-turn script. Inter throughout.
- **Browser chrome**, `#dfe6f6`: traffic lights, one white tab (radius `11px 11px 0 0`) with a dark
  circular favicon, title at 19px `#3c4043`, and a `✕`; then a white toolbar row with back / forward /
  reload icons and a `#f1f3f4` pill holding the URL at 19px.
- **Icon rail**, 88px wide with a `1px solid #ececec` right border, six 26px stroked SVG icons at 22px
  top padding, 26px apart.
- **Header**: `ChatGPT ⌄` at 26px weight 700 on the left; on the right a black `Log in` pill
  (`#0d0d0d`, white text, `12px 28px`, radius 999) and an outlined `Sign up for free` pill
  (`1px solid #d9d9d9`).
- **Composer** pinned at the bottom with 120px side padding: white, `1px solid #e3e3e3`, radius 28,
  the two-layer shadow `0 2px 8px rgba(0,0,0,0.04), 0 18px 44px rgba(0,0,0,0.08)`, a `+` on the left,
  and a mic plus a 50px circular send button on the right. Above it,
  `ChatGPT is AI and can make mistakes.` centred at 17px in `#8f8f8f`.

**The thread is bottom-anchored**
`display: flex; flex-direction: column; justify-content: flex-end; overflow: hidden` with `flex: 1` and
`min-height: 0`. New turns then push older ones off the top exactly like a real scrolled conversation —
no scroll position to compute, no measurement, no `useEffect`. **`min-height: 0` is required**: a flex
child defaults to `min-height: auto` and refuses to shrink below its content, so without it the thread
grows and shoves the composer off the bottom of the window.

**The turn**
- **Composer draft**: `turn.user.slice(0, Math.floor((frame - typeStart) / fps * charsPerSecond))`,
  with a 2px caret after it. The send button is `#d7d7d7` while the draft is empty and `#0d0d0d` as
  soon as there is text — that colour swap is what makes it feel like a live input.
- **Send press** at `sendAt`: `interpolate(frame - sendAt, [0, 3, 12], [0.9, 0.9, 1], …)`.
- **The bubble** appears at `sendAt`, right-aligned, `#ececec`, radius 26, `16px 26px`, max-width 72%.
  Give it **`transformOrigin: 'bottom right'`** and rise 30px as it scales 0.94→1, so it grows out of
  the composer's own corner. With the default centre origin it inflates in the middle of the thread and
  the connection to the send button is lost.
- **Thinking**, between `sendAt` and `replyStart`: a single 17px black dot breathing on
  `Math.sin((frame / fps) * 5)` in both scale and opacity. One dot, not three — that is ChatGPT's own
  state.
- **The reply** streams from `replyStart` at `replyCharsPerSecond`, with a 13px round black cursor
  trailing it while it is still incomplete.

**Programmable in and out**
`enterFrames` (22) and `exitFrames` (26, `0` to disable), plus a small camera push while typing tied to
typing progress. All three multiply into one transform on the window:

```tsx
scale: (0.97 + enter * 0.03) * zoom * (1 - exit * 0.04),
opacity: enter * (1 - exit),
```

Keep the push tiny here — `1.03`. This frame is dense with UI, and anything more makes the chrome
visibly swim.

**Requirements**
- One self-contained `.tsx` file exporting `ChatGptFullUi`.
- Props: `turns` (array of `{user, assistant}`), `url`, `tabTitle`, `charsPerSecond`,
  `replyCharsPerSecond`, `thinkFrames`, `betweenTurns`, `startAt`, `enterFrames`, `exitFrames`,
  `zoomWhileTyping`.
- Load Inter via `@remotion/google-fonts/Inter`.
- Draw every icon as inline SVG with `stroke-width` ~1.6 and round caps — icon fonts and emoji will not
  match the flat-stroke look of the real UI.
- Everything derives from `useCurrentFrame()`; no timers, no CSS animation.
