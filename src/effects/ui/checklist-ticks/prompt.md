Build a Remotion composition called **ChecklistTicks**: rows that get ticked off one at a time.

**Setup**

```bash
npx remotion add @remotion/google-fonts
```

**The check is drawn, not faded**
A static ✓ that fades in reads as a reveal. A stroke that *travels* reads as a decision. Use an SVG
path with `stroke-dasharray` and a `stroke-dashoffset` that runs to zero:

```tsx
/** The tick, in a 24×24 box. Its true length is ~21.6 units. */
const CHECK_PATH = 'M5 12.5 L10 17.5 L19 7';
const CHECK_LEN  = 24;   // round the length UP — a dash shorter than the path never finishes

<path
  d={CHECK_PATH}
  fill="none"
  stroke={accentColor}
  strokeWidth={2.6}
  strokeLinecap="round"
  strokeLinejoin="round"
  strokeDasharray={CHECK_LEN}
  strokeDashoffset={CHECK_LEN * (1 - draw)}   // draw 0 → 1
/>
```

**Four things per row, in sequence**

```tsx
const begin = startAt + i * stagger;

// 1. the row arrives…
const enter = spring({frame: frame - begin, fps,
                      config: {damping: 16, stiffness: 170, mass: 0.7}});
if (enter <= 0.001) return null;          // skip rows that have not started

// 2. …and only once it has settled does the check start drawing
const draw = interpolate(frame, [begin + 8, begin + 8 + drawFrames], [0, 1],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.5, 0, 0.2, 1)});

// 3. the box fills as the stroke completes, so colour and motion resolve together
const fill = interpolate(draw, [0.15, 1], [0, 1],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

// 4. then the rule strikes through
const strike = interpolate(frame, [begin + 8 + drawFrames, begin + 26 + drawFrames], [0, 1],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.22, 1, 0.32, 1)});
```

**The strike-through, and the trap in it**
`text-decoration` cannot be animated, so the rule is its own element — and its wrapper **must be
`inline-block`**, sized to the text. A block-level wrapper stretches to the whole row and the rule
strikes through the empty space after the label as well, which looks broken:

```tsx
<div style={{flex: 1, minWidth: 0}}>
  <span style={{position: 'relative', display: 'inline-block',
                fontSize: 38, fontWeight: 600, lineHeight: 1.3,
                color: strike > 0.5 ? '#79808f' : textColor}}>
    {item}
    <span style={{position: 'absolute', left: 0, top: '52%', height: 2.5,
                  width: `${strike * 100}%`, backgroundColor: accentColor, opacity: 0.75}} />
  </span>
</div>
```

**The box**
A 62px `<svg viewBox="0 0 24 24">`, `flex-shrink: 0`, holding the rect and the path:

```tsx
<rect x={1.4} y={1.4} width={21.2} height={21.2} rx={6}
      fill={accentColor} fillOpacity={fill * 0.16}
      stroke={fill > 0.5 ? accentColor : '#39404f'} strokeWidth={1.8} />
```

**Layout**
- Rows are absolutely positioned at `top: 292 + i * ROW_H` with `ROW_H = 108`, `left: 168`,
  `right: 168`, `height: 62`, `display: flex`, `align-items: center`, `gap: 30`.
- Row entrance: `opacity: Math.min(1, enter * 1.5)`, `translate: ${(1 - enter) * -34}px 0px`.
- Title at `left: 168, top: 150`, Inter 60px weight 800, `letter-spacing: -0.025em`, `textColor`,
  fading in over frames 0–20 and rising 16px→0 over 0–24 on `Easing.bezier(0.16, 1, 0.3, 1)`.

**The scene**
- 1920×1080, 30fps, **180 frames**. Background `#0d0f14` with
  `radial-gradient(ellipse at 30% 22%, #191d27 0%, #0a0c11 68%)`.
- Load Inter: `loadFont('normal', {weights: ['400', '600', '800'], subsets: ['latin']})`.

**Requirements**
- One self-contained `.tsx` file exporting `ChecklistTicks`.
- Props, with defaults: `title` (`'Before you hit render'`), `items` (five strings —
  `'Every animation reads useCurrentFrame()'`, `'Fonts loaded, not just named'`,
  `'No Math.random() anywhere'`, `'Assets in public/, via staticFile()'`,
  `'Checked a frame mid-motion, not the last one'`), `stagger` (22), `startAt` (20), `drawFrames`
  (13), `accentColor` (`#20e3b2`), `backgroundColor` (`#0d0f14`), `textColor` (`#eef1f7`).
