Build a Remotion composition called **WhipPan** (composition id `whip-pan`): a camera whipping between
shots, with the picture smeared along the axis of travel.

**Write it as a custom presentation, not a built-in**
`@remotion/transitions` ships `zoomBlur`, `linearBlur` and friends — but **those are shader
presentations**: they draw through `<HtmlInCanvas>` and WebGL2, and where that is unavailable they
render a **blank white frame with no error at all**. A custom presentation built from CSS transforms is
plain DOM and renders everywhere.

A presentation is just `{component, props}`. Remotion renders your component twice per transition —
once per scene — passing `presentationProgress` (0→1), `presentationDirection` (`'entering'` or
`'exiting'`), `passedProps` and `children`.

```tsx
const WhipPanPresentation: React.FC<TransitionPresentationComponentProps<WhipPanProps>> = ({
  children, presentationProgress, presentationDirection, passedProps,
}) => {
  const {direction = 'left', blur = 26, overshoot = 1} = passedProps;
  const vertical = direction === 'up' || direction === 'down';
  const sign = direction === 'left' || direction === 'up' ? -1 : 1;

  const p = interpolate(presentationProgress, [0, 1], [0, 1], {easing: Easing.bezier(0.7, 0, 0.3, 1)});
  const offset = presentationDirection === 'exiting'
    ? p * sign * 100 * overshoot
    : (p - 1) * sign * 100 * overshoot;

  const amount = Math.sin(presentationProgress * Math.PI) * blur;

  return (
    <AbsoluteFill style={{
      translate: vertical ? `0px ${offset}%` : `${offset}% 0px`,
      filter: `blur(${vertical ? 0 : amount}px) blur(${vertical ? amount : 0}px)`,
    }}>
      {children}
    </AbsoluteFill>
  );
};

export const whipPan = (props: WhipPanProps = {}): TransitionPresentation<WhipPanProps> =>
  ({component: WhipPanPresentation, props});
```

**Three things make it a whip rather than a slide**

1. **Both scenes move.** The outgoing goes `0 → +100%` and the incoming `-100% → 0`, so at every
   moment they are exactly one frame apart and travel together. This is the opposite of the rule for a
   reveal-style transition, where one side holds still — here, if either scene stays put the shot reads
   as a card sliding over a backdrop, not as a camera turning.
2. **The blur peaks in the middle.** `Math.sin(presentationProgress * Math.PI)` is 0 at both ends and 1
   at the midpoint, so the smear appears and clears with the movement. A blur that ramps in linearly
   leaves the incoming scene soft after it has stopped, which reads as being out of focus.
3. **Blur on the axis of travel only.** A horizontal whip gets a horizontal smear and nothing vertical.
   A uniform blur reads as a focus pull.
4. Ease with `Easing.bezier(0.7, 0, 0.3, 1)` — slow at both ends, violently fast through the middle,
   which is how a hand-held pan actually moves.

**The composition**
- 1920×1080, 30fps. Four shots of 52 / 52 / 52 / 60 frames joined by three 12-frame
  `linearTiming` transitions → `216 − 36 = ` **180 frames**. Whips are short; 12 frames at 30fps is
  already 0.4s.
- Directions `left`, `up`, `right` so the moves do not all repeat.
- Shots: saturated grounds with a kicker at 30px weight 800 (`letter-spacing: 0.4em`, with a matching
  negative right margin so the tracked line stays centred) and a line at 104px weight 800. Give each
  shot a slow 1→1.05 drift so it is never quite still — the whip then feels like it interrupted
  something.
- Wrap the `<TransitionSeries>` in a dark `<AbsoluteFill>`: while both scenes are mid-travel the frame
  edge is briefly uncovered.

**Requirements**
- One self-contained `.tsx` file exporting both `WhipPan` and the reusable `whipPan` factory.
- Presentation props: `direction` (`'left' | 'right' | 'up' | 'down'`), `blur`, `overshoot`.
- Do **not** call `useCurrentFrame()` inside a presentation — `presentationProgress` is already the
  0→1 you need, and it stays correct when the transition is retimed.
- Interleave sequences and transitions with `<React.Fragment key={…}>`; `<TransitionSeries>` reads them
  as a flat list.
- Load Archivo via `@remotion/google-fonts/Archivo`.
