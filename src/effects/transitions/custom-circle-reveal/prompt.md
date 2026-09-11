Build a Remotion composition called **CustomCircleReveal** (composition id `custom-circle-reveal`)
that demonstrates writing your **own** `TransitionPresentation` instead of using a built-in one.

**Setup**

```bash
npx remotion add @remotion/transitions
```

**What a presentation actually is**
Just an object of the shape `{component, props}`. Remotion renders your component twice per
transition — once for the outgoing scene and once for the incoming one — passing it:

- `presentationProgress` — 0→1 across the transition
- `presentationDirection` — `'entering'` or `'exiting'`
- `passedProps` — whatever your factory put in `props`
- `children` — the scene to draw

```tsx
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';

const CircleRevealPresentation: React.FC<TransitionPresentationComponentProps<CircleRevealProps>> = ({
  children, presentationProgress, presentationDirection, passedProps,
}) => {
  // The exiting scene stays put and is simply covered.
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }
  const r = interpolate(presentationProgress, [0, 1], [0, 78], {easing: Easing.bezier(0.65, 0, 0.35, 1)});
  return (
    <AbsoluteFill style={{clipPath: `circle(${r}% at ${originX}% ${originY}%)`}}>
      {children}
    </AbsoluteFill>
  );
};

export const circleReveal = (props: CircleRevealProps = {}): TransitionPresentation<CircleRevealProps> =>
  ({component: CircleRevealPresentation, props});
```

**Two things that decide whether it looks right**

1. **Return the exiting scene untouched.** It is tempting to fade or scale it out as well — but the
   incoming scene is already covering it, so animating both double-counts the move and reads as a
   stutter. One side moves, the other holds.
2. **Grow the circle to 142%, not 100%.** A percentage radius in `circle()` resolves against
   `sqrt(w² + h²) / sqrt(2)` — **not** the diagonal. For 1920×1080 that reference length is 1558px,
   while the far corner from an origin at (22%, 30%) is 1678px away, so even `100%` leaves a wedge of
   the outgoing scene alive in the corner for the rest of the shot. 142% (`sqrt(2) × 100`) covers the
   frame from any origin, including a corner. This is very easy to get wrong and looks like a
   rendering bug rather than a maths error.

`presentationProgress` is already 0→1 — do **not** use `useCurrentFrame()` inside a presentation.
Remotion drives the progress, including when the transition is retimed by a different `timing`.

**The composition**
- 1920×1080, 30fps. Three cards of 60 / 60 / 70 frames, joined by two 26-frame
  `linearTiming` transitions → `190 - 52 = ` **138 frames**.
- Shots are footage under `linear-gradient(to top, rgba(6,7,14,0.86) 0%, rgba(6,7,14,0.4) 36%,
  rgba(6,7,14,0) 64%)`; a shot without `src` draws on `theme.bg` (`#0a0b10`); titles in `#f6f5f2`.
- Title in `theme.display` (Sora by default) at 132px weight 800, letter-spacing `-0.04em`,
  `maxWidth: 1500`, with a monospace subtitle at 30px in `theme.mono`, coloured `theme.series[2]`
  (`#c6ff3d`), naming the API being shown.
- First transition from `(22%, 30%)` with a `softness` blur that resolves as it opens; second from
  `(82%, 74%)` with no blur, so the two reads differently.

**Requirements**
- One self-contained `.tsx` file exporting both `CustomCircleReveal` and the reusable `circleReveal`
  factory.
- Props on the presentation: `originX`, `originY`, `softness`.
- Props on the composition: `theme` (first, so the rest default off it), `shots`, `origins`,
  `softness`, `transitionFrames`, `holdFrames`, `fontFamily`, `monoFamily`, `accentColor`,
  `cardColor`. A shot's own `backgroundColor`/`color`/`accentColor` still wins over the theme, and a
  card's ground must stay **opaque** — the exiting scene sits under the entering one for the whole
  reveal.
- Load Sora via `@remotion/google-fonts/Sora`.
- Everything the built-in presentations do — `fade`, `slide`, `wipe`, `clockWipe`, `iris`, `flip` — is
  the same shape. Once you can write one, any CSS you can animate becomes a transition.
