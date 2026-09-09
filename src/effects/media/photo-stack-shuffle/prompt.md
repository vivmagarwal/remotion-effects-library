Build a Remotion composition called **PhotoStackShuffle** (composition id `photo-stack-shuffle`): a
deck of photo prints where the top card flicks away and the stack settles forward.

**One number lays out the whole deck**
This is the design. For each card, work out how far below the current top it sits — then derive
*everything* from that:

```tsx
const cycle = holdFrames + flickFrames;            // 46 + 20
const topIndex = Math.floor(frame / cycle);
const flick = interpolate(frame % cycle, [holdFrames, cycle], [0, 1],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.4, 0, 0.2, 1)});

const depth  = (((i - topIndex) % cards.length) + cards.length) % cards.length;
const settle = Math.max(0, depth - flick);         // advances as the top leaves
```

```tsx
translate: `${settle * 16}px ${settle * 26}px`,
scale: 1 - settle * 0.045,
boxShadow: `0 ${24 + settle * 6}px ${60 + settle * 16}px rgba(0,0,0,${0.5 - settle * 0.06})`,
zIndex: cards.length - Math.round(depth),
```

The shuffle is nothing more than `settle` decreasing by one for every card at once. There is no
per-card animation, no state, and it loops for free — `topIndex` just keeps counting and the modulo
wraps the deck. Note the **double modulo**: `((a % n) + n) % n`. A plain `%` returns negatives in
JavaScript, and a negative depth puts a card in front of the deck instead of behind it.

**The card that leaves is the exception**
The discarded card (`depth === 0` during the flick) must **not** follow the stack — give it its own
path:

```tsx
const leaveX = flick * 1500;
const leaveRot = flick * 26;
const leaveOpacity = 1 - Math.max(0, (flick - 0.55) / 0.45);   // fades only in the last 45%
```

If it just advances with everyone else the deck reads as sliding sideways; sending it off on its own
arc is what makes it read as being flicked off the top. Fading it late rather than throughout keeps it
solid long enough to see it go.

**The look**
- 1920×1080, 30fps, 330 frames. Background `#15161c` with
  `radial-gradient(ellipse at 50% 44%, #232633 0%, #101116 66%)`.
- Cards 900px wide, `#fbfaf7`, radius 10, 20px padding and 74px at the bottom — a photographic print
  with a wide lower border. Image inside at 3:2, `objectFit: 'cover'`, radius 4.
- A monospace caption at 34px in `#3c3a35` in the bottom border.
- Give each card a **seeded** tilt, `(random(\`tilt-${i}\`) - 0.5) * 9` degrees, and ease it toward 0 as
  it reaches the top — so the deck looks hand-stacked but the top card sits square. Use `random()` from
  `remotion`, never `Math.random()`, or the deck re-scatters on every rendered frame.

**Requirements**
- One self-contained `.tsx` file exporting `PhotoStackShuffle`.
- Props: `cards` (array of `{src, caption}`), `holdFrames`, `flickFrames`, `backgroundColor`,
  `cardWidth`, `showCaptions`.
- Use `<CanvasImage>` from `remotion` with `staticFile()` for images in `public/`, or a remote URL.
- Load Inter via `@remotion/google-fonts/Inter`.
