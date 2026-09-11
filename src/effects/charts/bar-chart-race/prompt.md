Build a Remotion composition called **BarChartRace**: horizontal bars that grow, overtake one another
and re-sort as a time series advances.

**The look**
- 1920×1080, 30fps, 200 frames. Background `theme.bg`, padding `80px 96px`, Inter throughout.
- A title at 52px weight 800 in `displayFamily` (default `theme.display`). Five series, each with a
  label, a colour and six values — colours read from the theme, as the `series` default: Remotion
  `theme.series[1]`, After Effects `theme.series[4]`, Blender `theme.series[3]`, Figma
  `theme.series[2]`, Canva `theme.accentOnPaper`.
  Remotion starts last and finishes first; that overtake is the story of the shot.
- Each row: a right-aligned 320px label at 36px weight 700, then a rounded bar (radius
  `theme.radius * 10 / 18` — 10 at the house radius) in the series colour with
  `boxShadow: 0 8px 30px COLOR33`, and the current value at 34px weight 800 in `theme.accentInk`,
  right-aligned inside the bar. Row pitch 118px, bar height 98px.
- The period label (`Jan`, `Feb`, …) sits bottom-right at 150px weight 800 in `#ffffff0f` — behind
  everything, like a watermark.
- A 5px progress rail (track `rgba(255,255,255,0.07)`) fills in `theme.pair` as the series advances.

**The mechanics — two things make or break this**

1. **A continuous cursor, not discrete steps.**

```tsx
const cursor = Math.min(steps - 1, frame / framesPerStep);   // framesPerStep ≈ 34
const stepIndex = Math.floor(cursor);
const within = cursor - stepIndex;
const value = a + (b - a) * Easing.bezier(0.4, 0, 0.25, 1)(within);
```

   Note `Easing.bezier(...)` returns a **function** you call with a 0–1 progress — handy when you are
   blending between two data points rather than driving a style. Stepping values discretely makes it a
   slideshow; blending makes it a race.

2. **Position rows by rank, never reorder them.** Sort a copy of the data by current value to get each
   series' rank, then position the row with `translate: \`0px ${rank * rowHeight}px\``. Keep the rows
   in their original array order in the DOM so React keeps the same node for each series
   (`key={series.label}`). If you instead render the sorted array, React remounts the rows on every
   overtake and the bars teleport into their new slots instead of sliding past each other. This is the
   whole illusion.

**Other details**
- Scale bar widths against `max = Math.max(...values) * 1.06` so the leader never touches the edge.
- `fontVariantNumeric: 'tabular-nums'` on the value labels, or they jitter as the digits change.
- Put the bar inside a `flex: 1` track next to the fixed-width label, and make the bar's percentage
  width relative to that track. If you instead put the percentage on a bar that is a direct sibling of
  the label, it is measured against the whole row — so the longest bars clip against the row edge and
  two visibly different values end up drawn the same length.

**Requirements**
- One self-contained `.tsx` file exporting `BarChartRace`.
- Props: `title`, `series` (array of `{label, color, values}`), `ticks`, `framesPerStep`,
  `backgroundColor` — optional, with the defaults above.
- Load Inter via `@remotion/google-fonts/Inter`.
