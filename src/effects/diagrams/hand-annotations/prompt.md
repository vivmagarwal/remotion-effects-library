Build a Remotion composition called **HandAnnotations** (composition id `hand-annotations`): rough,
hand-drawn marks landing on a paragraph one after another.

**Setup**

```bash
npx remotion add @remotion/rough-notation
```

Six components, each a different kind of mark: `<Highlight>`, `<Circle>`, `<Underline>`,
`<StrikeThrough>`, `<CrossedOff>`, `<Box>` (there is also `<Bracket>`). The component you pick decides
both the style and whether it draws behind or on top of the text.

**Drive `progress` from the frame — never let it auto-play**

```tsx
const at = (n: number) =>
  interpolate(frame, [startAt + n * stagger, startAt + n * stagger + drawFrames], [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.32, 0.72, 0.3, 1)});

<Highlight color="rgba(255, 214, 64, 0.55)" progress={at(0)}>hand drawn</Highlight>
<Circle color="#4cc9f0" progress={at(1)}>deterministic</Circle>
```

This is the whole rule. `@remotion/rough-notation` is perfectly happy to animate itself, and a self-animating
annotation advances on the browser clock — so Remotion, which renders frames out of order and
re-renders them, captures it at a different point every time and the mark flickers or lands
half-drawn. A `progress` computed from `useCurrentFrame()` is reproducible.

Keep the `interpolate()` call **inline in the prop**, not hoisted into a variable — that is what lets
Remotion Studio recognise the keyframes and retime each mark by dragging it.

The easing matters too: `Easing.bezier(0.32, 0.72, 0.3, 1)` starts fast and settles, like a real
marker stroke. `Easing.linear` reads as a wipe.

**The hand comes from the theme**
Every mark takes `roughness={theme.roughness / 0.3}` (Highlight: `/ 0.15`) and
`strokeWidth={theme.stroke * 20 / 3}` (Box: `* 7 / 3`). Those are rough-notation's own defaults — 1.5
and 3 roughness, 20px and 7px strokes — at the house `roughness: 0.45` and `stroke: 3`, and
ruler-straight at `roughness: 0`. Highlight takes no `strokeWidth`; it is a band, not a line.

**The page**
- 1920×1080, 30fps, 210 frames. Ground `paperColor` (defaults to `theme.paper`, `#f6f5f2`), type in
  `inkColor` (`theme.paperInk`, `#1d1b17`), 150px side padding, vertically centred.
- A kicker at 26px weight 700 with `letter-spacing: 0.24em` in `theme.paperMuted` (`#4a4e5a`).
- A paragraph at 78px weight 400, line-height 1.55, max-width 1560 — large enough that the marks read
  as annotations on a statement rather than as decoration on body copy.
- Six marks, 22 frames apart, 26 frames each, each with its own colour: an amber highlight
  `rgba(255, 214, 64, 0.55)`, a cyan circle `#4cc9f0`, an orange strike-through `#ff5c39`, a lime
  underline `#c6ff3d`, a violet box `#c77dff`, an orange crossed-off `#ff5c39`.
- Stagger them. Marks landing together read as a graphic; landing in sequence they read as someone
  working through the sentence.

**Requirements**
- One self-contained `.tsx` file exporting `HandAnnotations`.
- Props: `kicker`, `stagger`, `drawFrames`, `startAt`, `paperColor`, `inkColor`.
- The annotated words sit inline in the paragraph, so the marks wrap with the text — do not absolutely
  position them.
- Keep each mark and the punctuation after it in a `white-space: nowrap` span. The mark wrapper is
  inline-block, which is a wrap opportunity, so a wider face strands the full stop on its own line.
  Keep the inter-word `{' '}` outside the span so the surrounding spacing is unchanged.
- Load Inter via `@remotion/google-fonts/Inter`.
