Build a Remotion composition called **ImessageThread** (composition id `imessage-thread`): an
iMessage-style thread that types itself out.

**The look**
- **1080×1920 (vertical)**, 30fps, 200 frames. Background `backgroundColor` (`theme.surface`,
  `#101218`), a 980px column, Inter throughout.
  Centre the column **vertically**, not top-aligned: the thread then re-centres as it grows, which keeps
  the frame balanced instead of leaving the bottom half of a tall composition empty.
- A centred contact name at 34px weight 600 in `theme.muted` (`#8d93a5`), with a `1px solid #23262f`
  rule under it.
- Bubbles in a 20px-gap column. Incoming: `#2a2d38` with `#e7e9ef` text, `align-self: flex-start`.
  Outgoing: `#2f6bff` with white text, `align-self: flex-end`. Both 38px, line-height 1.35, padding
  `24px 32px`, `maxWidth: 76%`.
- **Asymmetric corner radius**: `26px 26px 8px 26px` for outgoing, `26px 26px 26px 8px` for incoming —
  the corner nearest its own side of the thread stays tight. This is what makes it read as a chat app
  rather than as rounded rectangles.

**The typing indicator — the thing that sells it**
Each message carries `at` (the frame it lands) and an optional `typing` (frames of indicator before
that). Between `at - typing` and `at`, render the **same bubble** containing three dots instead of the
text; at `at`, swap the content in place.

```tsx
translate: `0px ${Math.sin(frame / 3.2 - i * 0.9) * 7}px`,
opacity: 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(frame / 3.2 - i * 0.9)),
```

Three dots on **one sine, phase-shifted by index** — that is the classic travelling bounce. Animating
each dot independently, or on a CSS animation, gives you either a jitter or nothing at all in the
render. Reusing the same bubble element (rather than mounting a separate indicator and then a separate
message) means the bubble grows once and its content changes, which is exactly what a real client does.

**The entrance**

```tsx
const pop = spring({frame: frame - start, fps, config: {damping: 14, stiffness: 180, mass: 0.6}});
scale: 0.7 + Math.min(1, pop) * 0.3,
transformOrigin: mine ? 'bottom right' : 'bottom left',
opacity: Math.min(1, pop * 2),
```

**`transformOrigin` set to the bubble's own corner is the single most valuable line here.** With the
default centre origin the bubble inflates symmetrically and reads as a card appearing; anchored to the
sender's corner it grows *out of* their side of the thread.

Return `null` for any message whose typing has not started — an unmounted future message must not
occupy layout space, or the thread jumps as each one arrives.

**Requirements**
- One self-contained `.tsx` file exporting `ImessageThread`.
- Props: `title`, `messages` (array of `{from: 'them' | 'me', text, at, typing?}`), `themColor`,
  `meColor`, `backgroundColor`.
- Load Inter via `@remotion/google-fonts/Inter`.
- Clamp springs with `Math.min(1, pop)` where you need a 0–1 factor — they overshoot past 1 on purpose.
