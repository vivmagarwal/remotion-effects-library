Build a Remotion composition called **NotificationStack**: iOS-style notifications sliding in one
after another, each pushing the ones below it down.

**The look**
- 1920×1080, 30fps, 150 frames. Background `theme.bg` with
  `radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.055) 0%, rgba(0,0,0,0.42) 62%)`. Content
  centred, 130px top padding, a 900px-wide column.
- Each card: 168px tall, radius `theme.radius * 5/3` (30), `rgba(38,41,52,0.92)` fill,
  `1px solid rgba(255,255,255,0.09)` border, `boxShadow: '0 22px 60px rgba(0,0,0,0.45)'`, laid out as
  a flex row with 24px gaps. When `theme.scheme` is `light` the card is `rgba(255,255,255,0.94)` with
  a `rgba(0,0,0,0.08)` border and a lighter shadow — the card and its type must flip together.
- Inside: an 88px rounded-square app icon (radius `theme.radius * 11/9`, 22) in the app's tint colour
  holding an emoji, then a text column — app name at 24px weight 600 uppercase with
  `letter-spacing: 0.06em` in `theme.muted`, a right-aligned timestamp, a 34px weight 700 title, and a
  30px body line that truncates with `whiteSpace: nowrap` / `overflow: hidden` / `textOverflow: ellipsis`.
- Four notifications tinted `theme.series[1]`, `[2]`, `[4]` and `[0]` — Mail, Messages, GitHub,
  Calendar (`#4cc9f0`, `#c6ff3d`, `#c77dff`, `#ff5c39`).

**The stacking — this is the whole thing**
Give each card its own spring, staggered 14 frames apart:

```tsx
const progress = notes.map((_, i) =>
  spring({frame: frame - i * stagger, fps, config: {damping: 15, stiffness: 120, mass: 0.8}}),
);
```

Then position each card by **the accumulated arrival of everything above it**:

```tsx
const pushedBy = progress
  .slice(0, i)
  .reduce((sum, above) => sum + Math.min(1, above) * (CARD_HEIGHT + GAP), 0);

translate: `0px ${pushedBy - (1 - Math.min(1, p)) * 150}px`,
```

Weighting each contribution by that card's *own* progress is the point. While card two is still
springing in, card three is only partway pushed down — the column settles as one coupled system. If
you instead position cards at fixed `i * (height + gap)` offsets, each card animates in isolation and
the stack reads as four unrelated toasts.

Cards are absolutely positioned inside a `position: relative` column so `translate` is the only thing
placing them.

**Entrance**
Each card also rises 150px into place (folded into the same `translate`), scales
`0.9 + p * 0.1`, and fades in at `Math.min(1, p * 1.6)` — slightly ahead of the movement, so it does
not appear to slide in from nothing.

**Requirements**
- One self-contained `.tsx` file exporting `NotificationStack`.
- Props: `notes` (array of `{app, icon, tint, title, body, time}`), `stagger`, `backgroundColor`, and
  `transparent` — when true the background is `'transparent'` so this can be rendered as an alpha
  overlay (`--codec=prores --prores-profile=4444`) and composited over a screen recording. ProRes 4444
  is the alpha that survives an ffmpeg composite or a re-import into Remotion; VP8 WebM alpha comes back
  as a black box there, so keep `--codec=vp8` for web `<video>` playback only.
- Load Inter via `@remotion/google-fonts/Inter`.
- Clamp the spring with `Math.min(1, p)` where you need a 0–1 value; springs overshoot past 1 on
  purpose, which is good for scale but wrong for a layout sum.
