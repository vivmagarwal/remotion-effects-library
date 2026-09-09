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
Fade them toward the edges with `opacity: 0.5 - Math.abs(i / columns - 0.5) * 0.55`.

**The sun**
A 640px circle straddling the horizon, filled `linear-gradient(#ffe66d, #ff2e88)`, sliced with a
`mask-image` whose transparent bands **widen toward the bottom**:

```
linear-gradient(#000 0 58%, transparent 58% 61%, #000 61% 70%, transparent 70% 74%,
                #000 74% 80%, transparent 80% 85%, #000 85% 88%, transparent 88% 100%)
```

Even slices read as a barcode; widening ones read as the sun sinking. Include `WebkitMaskImage` too.
Add `filter: drop-shadow(0 0 90px #ff2e8888)`.

**The rest**
- 1920×1080, 30fps, 240 frames. Sky `linear-gradient(#0b0524 0%, #3d1a63 55%, #12082c 100%)`.
- Haze at the horizon — `linear-gradient(#3d1a63 0%, transparent 26%)` over the top of the floor — so
  the grid lines dissolve into the distance instead of stopping dead on a hard edge.
- Title in Orbitron at 168px weight 800 with `textShadow: '0 0 40px #ff2e88, 0 6px 0 #ff2e8877'`, and a
  widely tracked subtitle. Give both tracked lines a matching negative right margin so they stay
  optically centred.
- Scanlines over everything:
  `repeating-linear-gradient(to bottom, rgba(0,0,0,0.16) 0 2px, transparent 2px 5px)`.

**Requirements**
- One self-contained `.tsx` file exporting `RetroGridFloor`.
- Props: `title`, `subtitle`, `gridColor`, `sunTop`, `sunBottom`, `skyTop`, `skyBottom`, `speed`,
  `columns`, `rows`.
- Draw the grid as SVG `<line>`s inside a container clipped to below the horizon; give the `<svg>`
  `overflow: visible` so the fanned verticals are not clipped at its box.
- Load Orbitron via `@remotion/google-fonts/Orbitron`.
- No CSS animation — the scroll comes from `useCurrentFrame()`.
