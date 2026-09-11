Build a Remotion composition called **RetroGridFloor** (composition id `retro-grid-floor`): the
synthwave horizon — sliced sun, converging grid, endless scroll.

**Project the floor, don't skew it**
This is the one thing that separates a convincing grid from a cheap one:

```tsx
const horizon = height * 0.55;
const floorDepth = height - horizon;

// z: 1 near the camera, → 0 at the horizon.
const project = (z: number) => horizon + floorDepth * (1 / (z + 1)) * 2 - floorDepth;
```

The **reciprocal** is the point. Lay the horizontal lines out at constant spacing *in depth* and project
each one, and they bunch toward the horizon exactly as a receding plane does. Space them evenly *on
screen* — or skew a rectangle with `rotateX` — and you get a ladder lying on the floor: even rungs, no
depth, and every viewer feels it is wrong without being able to say why.

**The scroll loops for free**

```tsx
const z = ((i + ((t * speed) % 1)) / rows) * 2.4;
```

A **fractional offset on the row index**: rows enter at the horizon, accelerate toward the camera as the
projection expands them, and the `% 1` wraps so the loop is seamless with no bookkeeping and no state.
Skip any row whose projected y falls outside the floor.

**The verticals**
Every vertical line starts at the vanishing point (`width / 2`, y = 0) and fans out to
`width / 2 + (i / columns - 0.5) * width * 5` at the bottom. They must all converge on the **same
point** the horizontals recede toward, or the two families of lines describe different rooms.
Fade them toward the edges with `opacity: 0.5 - Math.abs(i / columns - 0.5) * 0.55`. Every grid line —
horizontal and vertical — is stroked `theme.accent` at `theme.stroke × 1.6/3` px, which is 1.6 at the
house 3.

**The sun**
A 640px circle straddling the horizon, filled `linear-gradient(theme.series[3], theme.accent)`
(`#ffd166` to `#ff5c39`), sliced with a `mask-image` whose transparent bands **widen toward the
bottom**:

```
linear-gradient(#000 0 58%, transparent 58% 61%, #000 61% 70%, transparent 70% 74%,
                #000 74% 80%, transparent 80% 85%, #000 85% 88%, transparent 88% 100%)
```

Even slices read as a barcode; widening ones read as the sun sinking. Include `WebkitMaskImage` too.
Add `filter: drop-shadow(0 0 90px ${sunBottom}88)`.

**The rest**
- 1920×1080, 30fps, 240 frames. Sky
  `linear-gradient(theme.bgDeep 0%, theme.accentOnPaper 55%, theme.bg 100%)`.
- Haze at the horizon — `linear-gradient(theme.accentOnPaper 0%, transparent 26%)` over the top of the
  floor — so the grid lines dissolve into the distance instead of stopping dead on a hard edge.
- Title in `theme.display` (Orbitron by default) at 168px weight 800, colour `theme.ink`, with
  `textShadow: '0 0 40px ${gridColor}, 0 6px 0 ${gridColor}77'` where `gridColor = theme.accent`; and
  a widely tracked subtitle in the sun's own top colour, which it sits on — falling back to
  `theme.accentInk` when the theme makes that top colour no lighter than the sun's bottom (broadsheet
  lands at 1.05:1, studio at 1.02:1 otherwise). Give both tracked lines a matching negative right
  margin so they stay optically centred.
- Scanlines over everything:
  `repeating-linear-gradient(to bottom, rgba(0,0,0,0.16) 0 2px, transparent 2px 5px)`.

**Requirements**
- One self-contained `.tsx` file exporting `RetroGridFloor`.
- Props: `theme` (first, so the rest can default off it), `title`, `subtitle`, `gridColor`, `sunTop`,
  `sunBottom`, `skyTop`, `skyBottom`, `floorColor`, `subtitleColor`, `speed`, `columns`, `rows`.
  `subtitleColor` is destructured **after** `sunTop` and `sunBottom`, because its default reads them.
- Draw the grid as SVG `<line>`s inside a container clipped to below the horizon; give the `<svg>`
  `overflow: visible` so the fanned verticals are not clipped at its box.
- Load Orbitron via `@remotion/google-fonts/Orbitron`.
- No CSS animation — the scroll comes from `useCurrentFrame()`.
