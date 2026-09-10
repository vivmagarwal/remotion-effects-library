Build a Remotion composition called **LogoPathDraw**: a mark that draws itself stroke by stroke,
then fills.

**Setup**

```bash
npx remotion add @remotion/paths @remotion/google-fonts
```

**Use `evolvePath`, not hand-rolled dashes**
The self-drawing trick is `stroke-dasharray` set to the path's length with a `stroke-dashoffset`
that runs to zero. The part people get wrong is the *length*: hardcode a number and short paths
finish early while long ones never finish at all. `evolvePath(progress, d)` measures the path and
returns both values from one call, so they cannot drift apart:

```tsx
const {strokeDasharray, strokeDashoffset} = evolvePath(p, stroke.d);

<path
  d={stroke.d}
  fill="none"
  stroke={accentColor}
  strokeWidth={strokeWidth}
  strokeLinecap="round"
  strokeLinejoin="round"
  strokeDasharray={strokeDasharray}
  strokeDashoffset={strokeDashoffset}
/>
```

**Every stroke gets its own timing**
Not one global progress. A long curve and a short tick given the same duration make the pen appear
to change speed, which is the giveaway that a draw-on was faked:

```tsx
type Stroke = {
  d: string;      // SVG path data, in the viewBox below
  at: number;     // frame it starts, relative to startAt
  over: number;   // frames it takes — tune per path length
};

const DEFAULT_STROKES: Stroke[] = [
  {d: 'M60 170 L60 30 L140 30 A40 40 0 0 1 140 110 L60 110', at: 0,  over: 36},  // R bowl
  {d: 'M108 110 L165 170',                                    at: 28, over: 14},  // R leg
  {d: 'M215 38 L215 162 L308 100 Z',                          at: 36, over: 30},  // play triangle
];
```
Per stroke: `p = interpolate(frame, [startAt + at, startAt + at + over], [0, 1], {clamp both,
easing: Easing.bezier(0.45, 0, 0.25, 1)})`, and `return null` while `p <= 0`.

**Outline, then fill**
The fill is *the same paths drawn again on top*, faded in. No second geometry to keep in sync:

```tsx
const lastDone = startAt + Math.max(...strokes.map((s) => s.at + s.over));
const fill = interpolate(frame, [lastDone + fillDelay, lastDone + fillDelay + 22], [0, 1],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.4, 0, 0.2, 1)});
```
Render them only when `fill > 0`, identical to the stroked paths but `stroke={fillColor}` and
`opacity={fill}`, with no dash props.

**The scene**
- 1920×1080, 30fps, **150 frames**. Background `#0a0b12` plus
  `radial-gradient(ellipse at 50% 44%, <accentColor>18 0%, transparent 62%)`.
- `<svg width={SIZE} height={SIZE * 0.58} viewBox="40 10 300 180" style={{overflow: 'visible'}}>`
  where `SIZE = Math.min(width * 0.42, 760)`. `overflow: visible` matters — round caps at
  `strokeWidth: 9` spill past the viewBox.
- Centred column: svg, then the title, then the subtitle.

**Typography** (Sora, `loadFont('normal', {weights: ['300', '700'], subsets: ['latin']})`)

| | |
|---|---|
| title | `margin-top: 58`, 62px weight 700, `letter-spacing: 0.34em` with a matching negative `margin-right`, `#f2f4fa`, fades in over `lastDone → lastDone + 22` |
| subtitle | `margin-top: 16`, monospace 25px, `#7f88a0`, fades in over `lastDone + 12 → lastDone + 34` |
| readout | absolute `bottom: 76`, monospace 22px, `#4e556a`, `font-variant-numeric: tabular-nums`, fades in over `startAt → startAt + 16` |

The readout prints `total path length {n} units` using
`Math.round(strokes.reduce((a, s) => a + getLength(s.d), 0))` — the same measurement `evolvePath`
does internally, shown so the number is visibly real rather than a guess.

**Requirements**
- One self-contained `.tsx` file exporting `LogoPathDraw`.
- Props, with defaults: `title` (`'PATHS'`), `subtitle`
  (`'evolvePath() · one call, correct dashes'`), `strokes` (the three above), `viewBox`
  (`'40 10 300 180'`), `startAt` (14), `fillDelay` (10), `strokeWidth` (9), `accentColor`
  (`#ff5c39`), `fillColor` (`#ffffff`), `backgroundColor` (`#0a0b12`).
