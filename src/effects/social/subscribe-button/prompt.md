Build a Remotion composition called **SubscribeButton**: a channel card where a cursor flies in,
presses Subscribe, and the button confirms.

**The look**
- 1920×1080, 30fps, 120 frames. Light page `theme.paper` (`#f6f5f2`), card centred.
- White card, radius `theme.radius * 22 / 18` (22 at house), padding `26px 30px`,
  `boxShadow: 0 24px 70px rgba(15,20,40,0.18)`, laid out as a flex row with 26px gaps: a 92px circular
  avatar (``linear-gradient(140deg, ${accentColor}, #c77dff)`` with the channel initial), the channel
  name at 38px weight 700 in `theme.paperInk` (`#1d1b17`) with a subscriber count at 26px in
  `theme.paperMuted` (`#4a4e5a`), then the button.
- The button is a pill (radius 99, padding `20px 40px`) — `accentColor` (`theme.pair`, `#4cc9f0`) with
  white text before the click, grey `#eef1f7` with `theme.paperMuted` (`#4a4e5a`) text after, plus a ✓
  that pops in.
- The card springs in: `spring({frame, fps, config: {damping: 14, stiffness: 110}})`, applied as
  `scale: 0.86 + cardIn * 0.14`.

**The click — everything happens on the same frame**
`clickAt = 40`. On that one frame, all of these must start together:
- The button squashes: `interpolate(sinceClick, [0, 3, 12], [0.93, 0.93, 1], …)` — held briefly at
  0.93, then recovering.
- A ripple begins: a 420px white circle at `rgba(255,255,255,0.55)` centred in the button, scaling
  0→1 over 14 frames and fading 0.8→0. **The button needs `overflow: hidden`** so the ripple is
  clipped to the pill — that clip is what makes it read as a material ripple rather than a growing
  blob.
- The label swaps to `Subscribed` and the pill changes colour.
- Twelve confetti chips (11px, radius 3, alternating `theme.series[0]`, `theme.series[3]`,
  `accentColor`, `theme.series[2]` — house `#ff5c39`, `#ffd166`, `#4cc9f0`, `#c6ff3d`)
  radiate from the button: `angle = (i / 12) * Math.PI * 2`, distance 0→190px over 22 frames on
  `Easing.bezier(0.1, 0.9, 0.2, 1)`, applied as
  `translate: \`${Math.cos(angle) * dist}px ${Math.sin(angle) * dist}px\`` with a `rotate` that grows
  with distance, fading out from frame 6 to 24.

**If you stagger these, it stops reading as one causal event** — a press and a confirmation instead of
a press *causing* a confirmation. Simultaneity is the whole trick.

**The cursor**
- A 👆 emoji at 62px with `filter: drop-shadow(0 6px 12px rgba(0,0,0,0.28))`, absolutely positioned.
- It arcs in on a single `approach` progress from frame 6 to `clickAt`, easing
  `Easing.bezier(0.3, 0, 0.15, 1)`, moving `right: -180 → 128` and `top: 230 → 74`. Interpolating two
  axes on one progress with an ease-out is what makes the path feel like an arc rather than a slide.
- It inherits the button's press scale, then fades out over frames `clickAt + 18 → clickAt + 30`.

**Requirements**
- One self-contained `.tsx` file exporting `SubscribeButton`.
- Props: `channel`, `subscribers`, `label`, `subscribedLabel`, `accentColor`, `clickAt`, and
  `transparent` — when `transparent` is true the root `<AbsoluteFill>` background is `'transparent'`,
  so the composition can be rendered as an overlay to composite over footage:
  `npx remotion render SubscribeButton --codec=prores --prores-profile=4444 --image-format=png`.
  ProRes 4444 survives an ffmpeg composite or a re-import into Remotion; VP8 WebM alpha
  (`--codec=vp8`) comes back as a black box there, so keep it for web playback only.
- Load Inter via `@remotion/google-fonts/Inter`.
