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
<Circle color="#2f6bff" progress={at(1)}>deterministic</Circle>
```

This is the whole rule. The library is perfectly happy to animate itself, and a self-animating
annotation advances on the browser clock — so Remotion, which renders frames out of order and
re-renders them, captures it at a different point every time and the mark flickers or lands
half-drawn. A `progress` computed from `useCurrentFrame()` is reproducible.

Keep the `interpolate()` call **inline in the prop**, not hoisted into a variable — that is what lets
Remotion Studio recognise the keyframes and retime each mark by dragging it.

The easing matters too: `Easing.bezier(0.32, 0.72, 0.3, 1)` starts fast and settles, like a real
marker stroke. `Easing.linear` reads as a wipe.

**The page**
- 1920×1080, 30fps, 210 frames. Warm paper `#faf8f2`, ink `#1a1a18`, 150px side padding, vertically
  centred.
- A kicker at 26px weight 700 with `letter-spacing: 0.24em` in `#9a938a`.
- A paragraph at 78px weight 400, line-height 1.55, max-width 1560 — large enough that the marks read
  as annotations on a statement rather than as decoration on body copy.
- Six marks, 22 frames apart, 26 frames each: yellow highlight `rgba(255, 214, 64, 0.55)`, blue circle
  `#2f6bff`, red strike-through `#d2483f`, green underline `#0f9b6c`, purple box `#7c3aed`, red
  crossed-off `#d2483f`.
- Stagger them. Marks landing together read as a graphic; landing in sequence they read as someone
  working through the sentence.

**Requirements**
- One self-contained `.tsx` file exporting `HandAnnotations`.
- Props: `kicker`, `headline`, `stagger`, `drawFrames`, `startAt`, `paperColor`, `inkColor`.
- The annotated words sit inline in the paragraph, so the marks wrap with the text — do not absolutely
  position them.
- Load Inter via `@remotion/google-fonts/Inter`.
