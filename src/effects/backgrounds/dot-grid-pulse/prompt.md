Build a Remotion composition called **DotGridPulse**: a large field of dots with a wave travelling
outward through it.

**The look**
- 1920×1080, 30fps, 240 frames. Background `#080a10`, `overflow: hidden`.
- A 42×24 grid of 7px circular dots, positioned in percentages
  (`left: ((c + 0.5) / columns) * 100 + '%'`, likewise for the row) with negative margins of half the
  dot size so each sits centred on its cell.
- Resting dots are dim `#2a3044`; dots the wave is passing through turn teal `#5eead4`.
- A vignette on top: `radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(8,10,16,0.85) 100%)`.

**The wave — this is the whole idea**
Do not animate dots individually. Make each dot's appearance a pure function of its distance to a
moving origin:

```tsx
const t = frame / fps;
const originX = columns / 2 + Math.cos(t * 0.32) * columns * 0.34;
const originY = rows / 2 + Math.sin(t * 0.24) * rows * 0.34;

const dist = Math.hypot(c - originX, r - originY);
const wave = Math.sin(t * frequency * Math.PI * 2 - dist / 3.2);   // frequency ≈ 0.28
const decay = Math.max(0, 1 - dist / falloff);                      // falloff ≈ 13 cells
const energy = Math.max(0, wave) * decay;
```

- Subtracting `dist / 3.2` inside the sine is what makes the ring **travel outward** rather than the
  whole grid pulsing in unison — the phase lags further the further you are from the origin.
- `Math.max(0, wave)` clips the trough, so you get a single travelling crest instead of a
  double-frequency throb.
- The linear `decay` keeps the wave local, so it reads as an impact spreading out and dying.
- Apply it as `scale: 1 + energy * 2.4`, `opacity: 0.35 + energy * 0.65`, and switch to the accent
  colour when `energy > 0.04`.
- The drifting origin means each pass comes from a different angle and the loop never looks canned.

**Requirements**
- One self-contained `.tsx` file exporting `DotGridPulse`.
- Props: `columns`, `rows`, `dotSize`, `color`, `accentColor`, `backgroundColor`, `frequency`,
  `falloff` — optional, with the defaults above.
- Build the dots in a plain nested `for` loop pushing into an array; ~1000 absolutely positioned divs
  render fine.
- `scale` is a number (not a string) in Remotion's transform shorthand.
- No CSS animation — everything derives from `useCurrentFrame()`.
