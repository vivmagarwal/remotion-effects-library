Build a Remotion composition called **StepProgress**: a numbered process advancing along a rail.

**Setup**

```bash
npx remotion add @remotion/google-fonts
```

**One playhead drives everything**
This is the whole idea. Do **not** give each step a boolean "done" flag — derive every piece of state
from a single continuous position in *step space*, where 0 is the first node and `steps.length - 1`
is the last. That is what makes the rail sit believably between two nodes instead of snapping.

```tsx
const cycle    = travelFrames + holdFrames;              // 26 + 16 = 42
const elapsed  = Math.max(0, frame - startAt);
const legIndex = Math.min(steps.length - 1, Math.floor(elapsed / cycle));

const legProgress = interpolate(elapsed - legIndex * cycle, [0, travelFrames], [0, 1],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.5, 0, 0.2, 1)});

const playhead = Math.min(steps.length - 1, legIndex + legProgress);
```

Everything below reads `playhead`:

```tsx
// Crossing a node is what lights it up — half a step of lead-in.
const arrived   = interpolate(playhead, [i - 0.5, i], [0, 1],
                    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const isCurrent = Math.round(playhead) === i;

// A pop the moment the playhead reaches this node.
const pop = spring({frame: frame - (startAt + i * cycle), fps,
                    config: {damping: 11, stiffness: 210, mass: 0.6}});
```

**Geometry**

```tsx
const MARGIN = 250;
const railY  = height / 2;
const railW  = width - MARGIN * 2;
const gap    = steps.length > 1 ? railW / (steps.length - 1) : 0;   // guard the 1-step case
const NODE_R = 46;
const x      = MARGIN + i * gap;
```

**The rail** — two bars, same box, the fill driven by the playhead:

```tsx
// track
<div style={{position:'absolute', left: MARGIN, top: railY - 3, width: railW,
             height: 6, borderRadius: 3, backgroundColor: '#232936'}} />
// fill
<div style={{position:'absolute', left: MARGIN, top: railY - 3, width: gap * playhead,
             height: 6, borderRadius: 3, backgroundColor: accentColor,
             boxShadow: `0 0 24px ${accentColor}88`}} />
```

**The node** — a 92px circle (`NODE_R * 2`) at `left: x - NODE_R, top: railY - NODE_R`:

- `background`: `arrived > 0.5 ? accentColor : '#151a24'`
- `border`: `4px solid ${arrived > 0.5 ? accentColor : '#2b3242'}`
- the number, Inter 34px weight 800, colour `arrived > 0.5 ? '#08090e' : '#79808f'`
- `scale: 1 + (isCurrent ? Math.max(0, pop) * 0.12 : 0)` — clamp the spring's undershoot at 0
- `boxShadow: isCurrent ? \`0 0 40px ${accentColor}77\` : 'none'`
- centre it with flex

**The label** — `left: x - 150`, `width: 300`, `text-align: center`, `top: railY + NODE_R + 34`:

- `opacity: interpolate(arrived, [0.2, 1], [0.32, 1], {clamp both})` — dim, never invisible, so the
  whole process is legible from frame one and only the *current* step is emphasised
- `translate: 0px ${(1 - Math.max(0, Math.min(1, pop))) * 12}px`
- label: Inter 38px weight 700, `textColor`
- detail: Inter 25px weight 500, `#79808f`, `margin-top: 8`

**The scene**
- 1920×1080, 30fps, **180 frames**. Background `#0b0d13` with
  `radial-gradient(ellipse at 50% 46%, #171b26 0%, #08090e 70%)`.
- Title centred at `top: 138`, Inter 56px weight 800, `letter-spacing: -0.025em`, `textColor`,
  fading in over frames 0–20.
- Load Inter: `loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']})`.

**Requirements**
- One self-contained `.tsx` file exporting `StepProgress`.
- Props, with defaults: `title` (`'How a Remotion video gets made'`), `steps` (four
  `{label, detail}` pairs — `Write` / `One .tsx per composition`, `Preview` /
  `npx remotion studio`, `Check` / `A still, mid-motion`, `Render` / `npx remotion render`),
  `travelFrames` (26), `holdFrames` (16), `startAt` (18), `accentColor` (`#4cc9f0`),
  `backgroundColor` (`#0b0d13`), `textColor` (`#eef1f7`).
