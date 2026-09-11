Build a Remotion composition called **CharDropSpring**: a word whose letters fall in one at a time on
real springs, overshooting and settling rather than easing politely to a stop.

**The look**
- 1920×1080, 30fps, 90 frames. Background `theme.bg` (house `#0a0b10`), centred.
- Word in Archivo, 210px, weight 900, line-height 1, letter-spacing `-0.02em`, 6px gap between letters
  in a flex row. Default word: `BOUNCE`. Odd-indexed letters take `accentColor` = `theme.series[3]`
  (house `#ffd166`); the rest take `color` = `theme.ink` (house `#ffffff`).
- An eyebrow line above at 30px, weight 700, uppercase, letter-spacing `0.22em`, `theme.muted`
  (house `#8d93a5`), 36px above the word. It fades in after the last letter has landed.

**The animation — springs, done right**
- Give each character its own spring, delayed by index:

```tsx
const progress = spring({
  frame: frame - i * stagger,      // stagger ≈ 4
  fps,
  config: {damping: 11, stiffness: 130, mass: 0.9},
});
```

- Drive the drop by **multiplying** the spring by the distance, not by feeding it into `interpolate()`:

```tsx
translate: `0px ${dropFrom * (1 - progress)}px`,   // dropFrom ≈ -420
rotate: `${-14 * (1 - progress)}deg`,
opacity: Math.min(1, progress * 3),
```

  `interpolate()` with `extrapolateRight: 'clamp'` caps the value at 1 and throws the overshoot away —
  and the overshoot past the resting position and back is the entire reason to use a spring instead of
  an ease. `spring()` returns values above 1 on purpose; let them through.
- `damping` is the knob: ~11 gives a lively bounce, ~200 is effectively no bounce at all. Lower
  `stiffness` slows the whole thing down; higher `mass` makes it feel heavier.

**Requirements**
- One self-contained `.tsx` file exporting `CharDropSpring`.
- Props: `text`, `eyebrow`, `stagger`, `damping`, `dropFrom`, `backgroundColor`, `color`,
  `accentColor` — optional, with the defaults above.
- Load Archivo via `@remotion/google-fonts/Archivo`.
- `rotate` and the y-offset in `translate` both need units in the string (`deg`, `px`).
