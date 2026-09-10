Build a Remotion composition called **KineticWordReveal** (composition id `kinetic-word-reveal`): a
title card where the words of a short phrase rise into view one after another from behind a hard edge.

**The look**
- 1920×1080, 30fps, 70 frames. Near-black background `#08070c`, warm off-white text `#f5f3ef`, one
  accent colour `#ff5c39`.
- The phrase is **`['Design', 'in', 'motion.']`** — three words, with the accent colour on the last one
  (`accentIndex` defaults to `2`).
- Inter at 160px, weight 800, letter-spacing `-0.04em`, laid out in a flex row with a 28px gap,
  centred in the frame. Load it with `@remotion/google-fonts/Inter` — weight 800 does not exist in most
  system fallbacks, so a plain font stack silently renders a synthesised or snapped-to-Bold weight, and
  the card loses most of its authority.
- A 4px accent rule below the phrase, with `margin-top: 44px` on the rule (measured from the bottom of
  the mask wrapper's padding box — the optical gap from the lowest ink reads larger, around 76px).

**The mask — this is the effect**
Wrap **every word in its own `overflow: hidden` div**, and animate the word's `translate` from
`'0px 110%'` to `'0px 0%'`. The word must appear to be pushed out from behind a solid edge; it must
never be visible outside its wrapper, and it must never simply fade.

**Descenders will clip if you do nothing.** At `line-height: 1`, Inter 800's ink overshoots the line
box by about 0.075em at the bottom — so `g`, `j`, `p` and `y` get sheared off flat against the mask
edge *after* the word has landed. Two independent fixes, and this design uses both:

- **`line-height: 1.3` on the word.** Anything ≥ ~1.22em gives the descenders room inside the line box.
- **`padding-bottom: 0.12em` on the wrapper.** `overflow: hidden` clips at the **padding box**, not the
  content box, so padding moves the clip edge below the overhanging ink.

Either one alone clears the descenders. Using both buys margin for the start position:
`translate: '0px 110%'` only guarantees the word is fully hidden while
`1.1 × lineBox ≥ lineBox + paddingBottom`, which at 160px is 228.8 ≥ 227.2 — a 1.6px margin.

**Where the sizes live matters.** Put `font-size: 160px` on the flex row (or anywhere at or above the
wrapper), not only on the word. `padding-bottom: 0.12em` is relative to the **wrapper's** font size; if
the wrapper inherits a 16px root it silently becomes 1.9px of padding and the descenders clip anyway.

**Which element is which.** The `overflow: hidden` wrapper is a **plain `<div>`**; the word inside it is
the `<Interactive.Div>` that carries the `translate`. Animate the wrapper instead and there is no mask
at all — the thing doing the clipping would be the thing moving.

**Timing**
- Word `i` starts at `i * stagger` (stagger 6) and takes 0.9s, easing `Easing.bezier(0.16, 1, 0.3, 1)`.
- The rule starts once the **last word has started** — `(words.length - 1) * stagger`, frame 12 — and
  grows 0 → 520px over 1.1s on the same easing.
- All motion is over by frame ~45; 70 frames leaves a short hold, not half a composition of dead air.

**Requirements**
- One self-contained `.tsx` file exporting `KineticWordReveal`, registered in `src/Root.tsx` with the
  **id `kinetic-word-reveal`** (the component is PascalCase, the composition id is kebab-case — the CLI
  commands below use the id).
- Props: `words`, `accentIndex`, `backgroundColor`, `color`, `accentColor`, `stagger` — all optional,
  with the defaults above, so the card can be re-themed without touching the animation.
- Use `<Interactive.Div>` with a `name` for each word and for the rule, so they are selectable in the
  Studio timeline.
- Both ends of the `translate` interpolation need the same unit per axis: `'0px 110%'` → `'0px 0%'`.
  Mixing `%` and `px` on one axis throws *"Cannot interpolate translate values with different units"*.
- The default phrase measures about **1258px** of ink at 160px, leaving ~330px of slack each side.
  A phrase much more than half again as long breaks the ≥80px side-margin rule below — at that point
  drop the font size or use `fitText()` from `@remotion/layout-utils`.
- The blank scaffold ships an unused `src/Composition.tsx`; delete it once you have registered this
  composition in `src/Root.tsx`, or the Studio sidebar shows a stray starter comp.
