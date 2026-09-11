Build a Remotion composition called **FilmGrade** (composition id `film-grade`): a nine-stage colour
grade assembling itself one stage at a time, with the ungraded source kept on screen beside it.

**Setup**

```bash
npx remotion add @remotion/media @remotion/effects @remotion/google-fonts
```

`@remotion/effects` renders through WebGL, so the renderer needs ANGLE:

```ts
// remotion.config.ts
Config.setChromiumOpenGlRenderer('angle');
```

**The `effects` array is an ordered pipeline, and the order IS the grade**

That is the whole lesson, and it is the thing a parameter panel hides. Three consequences, in the
order they bite:

1. **Exposure and white balance go first**, before anything reads a pixel value. Set the black point
   before the exposure and you have clipped the toe of a picture that was a quarter stop under — no
   later stage gets it back, because the information is *gone*, not compressed.
2. **`vibrance` before `saturation`.** Vibrance is a non-linear lift that protects already-saturated
   colours; on a face that means it protects skin. Saturate first and vibrance has nothing left to
   protect — that is the orange face that marks an amateur grade.
3. **Vignette and grain last, grain last of all.** A vignette is *optical*, not colour: put it before
   white balance and the corners get tinted along with the picture. Grain sits **on** the image, so
   run it before a contrast stage and the contrast crushes it into blotches.

**The stack**

```tsx
const stack = [
  exposure({stops: 0.22}),
  whiteBalance({temperature: -0.14, tint: 0.06}),
  levels({blackPoint: 0.045, whitePoint: 0.97, gamma: 0.94}),
  shadowsHighlights({shadows: 0.18, highlights: -0.16}),
  vibrance({amount: 0.28}),
  saturation({amount: 0.94}),
  tint({color: '#4cc9f0', amount: 0.08}),
  vignette({amount: 0.26, radius: 0.85, feather: 0.5}),
  noise({amount: 0.06, seed: frame}),
];
<Video src={src} objectFit="cover" muted effects={stack} style={{width: '100%', height: '100%'}} />
```

Verified parameter ranges in 4.0.522: `exposure.stops` −5…5, `whiteBalance.temperature`/`.tint` −1…1,
`levels.blackPoint`/`.whitePoint` 0…1 and `.gamma` 0.01…10, `shadowsHighlights.shadows`/`.highlights`
−1…1, `vibrance.amount` −1…1, `saturation.amount` a **multiplier** (1 unchanged, 0 greyscale),
`tint.amount` 0…1, `noise.amount` 0…1.

**`seed: frame` is what separates grain from dirt.** A constant seed welds one noise pattern to the
lens, and the eye reads that as a dirty sensor inside half a second. Real grain resamples every frame.
It is also the **only** per-frame value in the stack: a grade that animates is a look change, not a
grade.

**Build the stack up with `disabled`, not by splicing.** Every descriptor takes
`disabled?: boolean`, so the array stays the same length and the same order at every frame:

```tsx
const on = (i) => frame < STAGES[i].at;
exposure({stops: 0.22, disabled: on(1)})
```

Rebuild the array instead and you are changing the pipeline's shape mid-render, which is the one thing
this composition exists to argue against.

**Keep the source on screen.** A grade judged against memory is judged against nothing — after ninety
seconds every grade looks correct, which is why colourists keep a reference up. A second `<Video>` of
the same file with no `effects`, in a bordered inset at `left: 84, bottom: 84`, 480px wide, 16:9,
radius `theme.radius × 12/18` (12 at house), `1px solid rgba(255,255,255,0.18)`,
`0 24px 60px rgba(0,0,0,0.55)`, labelled `UNGRADED`.

**The look**

- 1920×1080, 30 fps, 300 frames. Ground `#04050a`. Inter at 500/700/800.
- Stage list down the right at `right: 84, top: 96`, 760px wide, `gap: 8`. Pin every line's
  `lineHeight`: calls 1.1, parameter notes 1.15 with `whiteSpace: 'nowrap'`, and 1.15 on the
  `effects={[` / `]}` lines. This is so a theme's typeface cannot change the column: unpinned,
  JetBrains Mono's taller line box pushes `]}` off the frame, and a monospace text face wraps the
  notes until the active stage falls off the bottom. Each stage: its call at 34px/700 in a monospace
  stack, in `#eef1f7` (the theme's `body`), the parameters under it at 28px/500 `#8d93a5`.
  Not-yet-applied stages at `opacity: 0.3`; the stage that just arrived in `#ff5c39`, nudged 10px → 0
  over 8 frames — enough to catch the eye, small enough that ten of them do not read as a bouncing
  list.
- The list is wrapped in literal `effects={[` and `]}` lines at 28px/800 `letter-spacing: 0.2em` in
  `#8d93a5`, so the thing on screen is legibly the array.
- A **left-facing** gradient behind the list, **1160px** wide and holding its alpha most of the way
  across — `rgba(4,5,10,0.95) 0%, 0.9 50%, 0.55 78%, transparent 100%`. The list box starts 844px in
  from the right, so a gradient that has faded by 44% leaves the parameter lines at about 13% cover and
  they vanish wherever they cross a bright part of the shot. A full-frame dim is not the alternative:
  that would change the grade you came here to judge.
- Top-left: `ORDER IS THE GRADE` at 34px/800 `letter-spacing: 0.16em` in the accent, then
  `4 of 10 stages · the array runs top to bottom` at 34px/500 `#eef1f7`, carrying its own
  `textShadow` because it sits directly on the picture and the picture's brightness is not yours.

**Requirements**

- One self-contained `.tsx` file exporting `FilmGrade`.
- Props with these exact defaults: `src` `staticFile('footage/interview-raw.mp4')`, `step` `26`,
  `showStack` `true`, `accentColor` `'#ff5c39'`, `backgroundColor` `'#04050a'`.
- Import each effect from its own subpath — `@remotion/effects/exposure`, not the barrel — so the
  bundle carries nine shaders rather than seventy.
- **Keep the values small.** A grade you can see happening is a filter; a grade you only notice when
  you turn it off is a grade. If a reviewer says "nice look", the numbers are too big.
