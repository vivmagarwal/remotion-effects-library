Build a Remotion composition called **ChapterDivider**: the card that sits between sections of a
longer video.

**Setup**

```bash
npx remotion add @remotion/google-fonts
```

**The thing that makes it reusable**
It is a complete **in, hold, and out** — everything clears the frame before the composition ends. So
you can drop it into a `<Series>` or a `<TransitionSeries>` without trimming anything, and the shot
after it starts on a clean frame.

**Two bands, one progress value**
The card is two panels that slide in to meet on the centre line, then part again on the way out.
Solving both from one number is what keeps them exactly symmetrical:

```tsx
const ease   = Easing.bezier(0.16, 1, 0.3, 1);     // out
const easeIn = Easing.bezier(0.7, 0, 0.84, 0);     // in

const close = interpolate(frame, [0, 30], [0, 1],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
const part  = interpolate(frame, [exitAt, exitAt + 26], [0, 1],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeIn});

const bandShift = (1 - close) + part;   // 1 = fully open, 0 = closed, 1 = open again
const HALF = height / 2;
```

```tsx
{/* top */}    <AbsoluteFill style={{height: HALF, top: 0,    backgroundColor,
                                     translate: `0px ${-bandShift * HALF}px`}} />
{/* bottom */} <AbsoluteFill style={{height: HALF, top: HALF, backgroundColor,
                                     translate: `0px ${ bandShift * HALF}px`}} />
```
The scene's own background is `theme.bgDeep` (house `#04050a`), a step darker than the bands, so
what you see between the parted bands during the entrance and exit is that darker ground.

**Text: one interpolation, four stops**
Rising in, holding, then dropping out is a single `interpolate` — no second "exit" value to keep in
sync:

```tsx
const reveal = (delay: number) =>
  interpolate(
    frame,
    [26 + delay, 46 + delay, exitAt + delay * 0.4, exitAt + 18 + delay * 0.4],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease},
  );
```
The `delay * 0.4` on the way out makes the exit tighter than the entrance, which reads as decisive.

| element | position | type | reveal |
|---|---|---|---|
| `CHAPTER {number}` | `top: HALF - 232` | Archivo 30px/800, `letter-spacing: 0.42em` with a matching negative `margin-right`, `font-variant-numeric: lining-nums`, `accentColor` | `reveal(0)`, `translate: 0px (1-r)*18` |
| title | `top: HALF - 168`, full width | Archivo 96px/800, `letter-spacing: -0.03em`, `line-height: 1.06`, `textColor` | `reveal(6)`, `translate: 0px (1-r)*26` |
| subtitle | `top: HALF + 44`, full width | Archivo 30px/400, `theme.muted` (house `#8d93a5`) | `reveal(14)`, `translate: 0px (1-r)*22` |

All three centred, inside an `<AbsoluteFill>` with `justify-content: center; align-items: center;
text-align: center`.

**The rule**
Draws out from the centre along the seam and retracts the same way:

```tsx
const rule = interpolate(frame, [22, 52, exitAt - 4, exitAt + 12], [0, 1, 1, 0],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

<div style={{
  position: 'absolute',
  left: width / 2 - (width * 0.34 * rule) / 2,   // grows from the centre outward
  top: HALF - theme.stroke / 2,
  width: width * 0.34 * rule,
  height: theme.stroke,                          // 3 at house
  backgroundColor: accentColor,
}} />
```

**The scene**
- 1920×1080, 30fps, **150 frames**. Scene background `theme.bgDeep` (`#04050a`); the bands are
  `backgroundColor` (`theme.bg`, `#0a0b10`).
- Load Archivo: `loadFont('normal', {weights: ['400', '600', '800'], subsets: ['latin']})`.

**Requirements**
- One self-contained `.tsx` file exporting `ChapterDivider`.
- Props, with defaults: `number` (`'02'`), `title` (`'Timing & Easing'`), `subtitle`
  (`'springs, béziers, and when to use which'`), `exitAt` (108 — the frame the exit begins, so
  everything before it is entrance and hold), `accentColor` (`theme.series[3]`, `#ffd166`),
  `backgroundColor` (`theme.bg`, `#0a0b10`), `textColor` (`theme.ink`, `#ffffff`).
