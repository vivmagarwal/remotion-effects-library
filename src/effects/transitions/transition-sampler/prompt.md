Build a Remotion composition called **TransitionSampler** (composition id `transition-sampler`): seven
full-bleed colour cards played back to back, each joined to the next by a different
`@remotion/transitions` presentation, and each card labelled with the transition that brought it in —
so the name on screen always describes the cut you just watched.

**The cards**
- 1920×1080, 30fps. Each card is an `<AbsoluteFill>` in a saturated colour with a matching foreground:

  | # | label | background | foreground |
  |---|---|---|---|
  | 01 | `Transitions` (the opener — nothing brought it in) | `#ff5c39` | `#160603` |
  | 02 | `Fade` | `#2f6bff` | `#f2f6ff` |
  | 03 | `Slide` | `#ffd166` | `#1a1405` |
  | 04 | `Wipe` | `#12c48b` | `#04150e` |
  | 05 | `Clock wipe` | `#a78bfa` | `#15092b` |
  | 06 | `Iris` | `#f43f5e` | `#1c0409` |
  | 07 | `Flip` | `#0ea5e9` | `#03151f` |

- A root `<AbsoluteFill>` behind the whole `<TransitionSeries>` in `#08070c`. **This matters**: `flip()`
  rotates both planes in 3D and at the midpoint of the flip the root is roughly two-thirds of the
  screen. Leave it unset and you get a white flash where a cut should be.
- Centred stack per card, all in Sora except the call: the two-digit index (`01`, `02`, …) at 300px
  weight 700, line-height 1; the label at **78px** weight 700, 18px below; and the literal call in
  **JetBrains Mono** at 26px, `opacity: 0.62`, 22px below that. (58px would read small — the design
  guidance below asks for ≥44px supporting text at 1080px wide, which is ≥78px at 1920.)
- Card 01's "call" is just `<TransitionSeries>` — nothing brought it in.
- **Only the index number scales**, 0.92→1 over the card's first 16 frames with
  `Easing.bezier(0.16, 1, 0.3, 1)` and `output: 'perceptual-scale'`. That easing is heavily
  front-loaded, so it reads as a ~4-frame pop with a long settle — which is the intent. Do not scale
  the card itself: an `<AbsoluteFill>` at `scale: 0.92` exposes 8% of the root background as a border
  around the card during every transition.

**The transitions**

| after card | presentation | timing (write it exactly like this) |
|---|---|---|
| 01 | `fade()` | `linearTiming({durationInFrames: 14})` |
| 02 | `slide({direction: 'from-right'})` | `springTiming({config: {damping: 200}, durationInFrames: 16})` |
| 03 | `wipe({direction: 'from-bottom-left'})` | `linearTiming({durationInFrames: 14})` |
| 04 | `clockWipe({width, height})` | `linearTiming({durationInFrames: 20})` |
| 05 | `iris({width, height})` | `linearTiming({durationInFrames: 18})` |
| 06 | `flip({direction: 'from-left'})` | `springTiming({config: {damping: 200}, durationInFrames: 18})` |

**Both `springTiming` calls need the explicit `durationInFrames`.** Left off,
`springTiming({config: {damping: 200}})` resolves to **23** frames at 30fps — the length falls out of
the spring physics — and the arithmetic below silently becomes wrong by 12 frames, which shows up as a
black tail at the end of the video.

Hold cards 01–06 for **56** frames each and card 07 for **64**.

**Three things to get right**

1. **A hold must outlive the transitions on both sides of it.** A card is only actually *on screen by
   itself* for `duration − incoming − outgoing` frames. `TransitionSeries` will happily accept a
   negative value here — Remotion checks one transition against one sequence, never the sum, so it
   fails silently — and you get **three cards on screen at once with two labels superimposed**, which
   destroys the whole premise. With the numbers above the worst case is card 05 at
   `56 − 20 − 18 = 18` solo frames. Check every card before you ship:

```
card 01: 56 −  0 − 14 = 42     card 05: 56 − 20 − 18 = 18
card 02: 56 − 14 − 16 = 26     card 06: 56 − 18 − 18 = 20
card 03: 56 − 16 − 14 = 26     card 07: 64 − 18 −  0 = 46
card 04: 56 − 14 − 20 = 22
```

2. **A transition shortens the timeline.** Both scenes play simultaneously while it runs, so the total
   is `sum(sceneDurations) − sum(transitionDurations)`. Here `6×56 + 64 = 400` scene frames minus
   `14+16+14+20+18+18 = 100` transition frames = **300 frames**. Register exactly that. Overstate it
   and the `TransitionSeries` unmounts before the composition ends, leaving seconds of the bare root
   background; understate it and the video cuts off mid-transition.
   Do not do this arithmetic in your head — derive it:

```tsx
const total = sceneDurations.reduce((a, b) => a + b, 0)
  - timings.reduce((sum, t) => sum + t.getDurationInFrames({fps}), 0);
```

   `getDurationInFrames({fps})` matters most for a `springTiming()` with **no** explicit
   `durationInFrames`, where the length falls out of the spring physics and depends on fps. Given an
   explicit `durationInFrames`, both timings return exactly that length — but note that a
   `springTiming` reaches progress `1.0` only on the frame *after* its last, so the final frame of a
   spring transition can carry a hair of residual transform. Harmless; just do not chase it.

3. **`clockWipe` and `iris` require explicit `width` and `height`** from `useVideoConfig()`. They are
   the only two presentations here that need geometry; the rest take only a direction or nothing.

**Imports**
Most presentations live at their own subpath and are **not** re-exported from the package root — that
includes all six used here:

```tsx
import {TransitionSeries, linearTiming, springTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {clockWipe} from '@remotion/transitions/clock-wipe';
import {iris} from '@remotion/transitions/iris';
import {flip} from '@remotion/transitions/flip';
```

(A few — `crossZoom`, `dreamyZoom`, `filmBurn`, `linearBlur`, `pushCut` — happen to be root-exported
too, but the subpath always works, so use it.)

**Requirements**
- One self-contained `.tsx` file exporting `TransitionSampler`, registered in `src/Root.tsx` as
  `transition-sampler` at 300 frames.
- Load Sora and JetBrains Mono via `@remotion/google-fonts`.
- Give every `<TransitionSeries.Sequence>` a `name` so the Studio timeline is readable. Note that
  `<TransitionSeries.Sequence>` does **not** accept `premountFor` — that prop is for plain
  `<Sequence>`.
- The other presentations in the package are `bookFlip`, `zoomBlur`, `dreamyZoom`, `filmBurn`,
  `linearBlur`, `zoomInOut`, `dissolve`, `ripple`, `crosswarp`, `crossZoom`, `swap`, `pushCut` and
  `none` — list them on the final card.
