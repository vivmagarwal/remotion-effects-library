Build a Remotion composition called **HalftonePrint**: a risograph / newsprint treatment where the
image is flattened to two inks and broken into a dot screen that resolves from coarse to fine.

**Setup**
`@remotion/effects` needs WebGL2 — add `Config.setChromiumOpenGlRenderer('angle')` to
`remotion.config.ts` or pass `--gl=angle`, or it renders black. Import from subpaths:
`@remotion/effects/halftone`, `@remotion/effects/duotone`.

**The stack**
On a `<CanvasImage>` (or `<Video>`), in this order:

```tsx
effects={[
  duotone({darkColor: inkDark, lightColor: inkLight, threshold: 0.34}),  // theme.paperInk, theme.accent
  halftone({dotSize: dot, dotSpacing: dot, rotation: 25, shape: 'circle', colorMode: 'source'}),
]}
```

**Flatten before you screen.** `duotone()` first collapses the picture to two inks, so the halftone
only has to break up two tones. Screening a full-colour image instead gives overlapping dots in every
hue and the result goes muddy — this ordering is the difference between "printed" and "broken".

**The resolve**
`dotSize` and `dotSpacing` both animate from 34 down to 9 over 2.6 seconds with
`Easing.bezier(0.16, 1, 0.3, 1)`, so the picture appears to come into focus. A static screen is a
filter; an animating one is an effect.

**The page**
- 1920×1080, 30fps, 120 frames. Paper `theme.paper` (`#f6f5f2`).
- The plate fills the frame, and a solid paper-coloured band covers the bottom 34% for the type. Set
  over the ink the headline disappears into the screen; on clean paper it reads, and it is how a real
  two-colour poster is laid out. Do not crop the plate with `objectFit: 'cover'` to make room — that
  throws away the subject.
- Paper grain over the ink: an `<AbsoluteFill>` at `mixBlendMode: 'multiply'`, `opacity: 0.35`, with an
  inline SVG `feTurbulence` data URI (`baseFrequency="0.6" numOctaves="4"`).
- Bottom-left: a kicker in the text face (`textFamily = theme.text`) at 30px with
  `letter-spacing: 0.42em`, and a headline in the display face (Archivo Black by default) at 196px,
  `fontWeight: 800` with `fontSynthesis: 'none'` — so a theme's display family renders heavy and
  Archivo Black, which ships weight 400 only, is not faux-bolded — line-height 0.9,
  letter-spacing `-0.035em`, in the dark ink.
- **The headline gets `` textShadow: `9px 7px 0 ${inkLight}` ``** — a hard-edged offset copy in the
  second ink, which is `theme.accent`. That deliberate misregistration is the single most recognisable
  tell of a two-colour press, and it does more for the look than the halftone itself.
- Headline rises `'0px 60px'` → `'0px 0px'` and fades in over frames 18–48; kicker follows later.

**Requirements**
- One self-contained `.tsx` file exporting `HalftonePrint`.
- Props: `src`, `headline`, `kicker`, `inkDark`, `inkLight`, `paperColor`, `angle` — optional.
- Load Archivo Black via `@remotion/google-fonts/ArchivoBlack`.
