Build a Remotion composition called **ExtrudedText** (composition id `extruded-text`): solid 3D type,
built from stacked copies of one word.

**Stack real nodes in 3D — not a text-shadow**

```tsx
<AbsoluteFill style={{perspective: 2200, /* … */}}>          {/* on the PARENT */}
  <div style={{position: 'relative', transformStyle: 'preserve-3d',
               transform: `rotateY(${yaw}deg) rotateX(${pitch}deg)`}}>
    {new Array(depth).fill(0).map((_, i) => {
      const layer = depth - 1 - i;                            // furthest first
      return (
        <div key={layer} style={{
          position: layer === depth - 1 ? 'relative' : 'absolute',
          inset: layer === depth - 1 ? undefined : 0,
          transform: `translateZ(${-layer * step}px)`,         // depth 40, step 3
          color: layer === 0 ? faceColor : (layer / (depth - 1)) < 0.55 ? sideColor : sideShadeColor,
        }}>{text}</div>
      );
    })}
  </div>
</AbsoluteFill>
```

The usual shortcut is a long `text-shadow` chain (`1px 1px 0 …, 2px 2px 0 …`). It looks identical while
the word is still — and collapses the instant it turns, because a shadow is painted **flat in screen
space** and does not live in the 3D scene. Real nodes on `translateZ` rotate with the word, so the side
of the extrusion is genuinely visible as it swings.

Four details:
- **`perspective` on the parent**, `transformStyle: 'preserve-3d'` on the rotating element. Miss either
  and the layers flatten into one plane.
- **Draw back to front.** Iterate so the furthest layer renders first and the face last, and the face
  stays crisp on top. Reverse it and the back of the word paints over its own front.
- **The first-rendered layer is `position: relative`**, the rest `absolute; inset: 0`. That one
  in-flow copy is what gives the stack its width and height; make them all absolute and the parent
  collapses to zero and nothing centres.
- **Shade the sides along their length** — `layer / (depth - 1)` under 0.55 gets the lit side colour,
  beyond that the shadowed one. A single flat side colour reads as a sticker.

**Swing, don't spin**
`yaw = Math.sin(t * 0.62) * 26`, `pitch = Math.sin(t * 0.4 + 1.1) * 8`. The word turns far enough to
show its side and comes back. A continuous rotation passes through edge-on, where the extrusion
degenerates into a line and the illusion breaks.

**The reflection**
A single flipped copy of the **face only** below the word: `transform: scaleY(-1) rotateY(...)`,
`opacity: 0.09`, `filter: blur(5px)`, and `maskImage: 'linear-gradient(transparent 30%, #000 100%)'`
(plus `WebkitMaskImage`) so it fades out with distance. Reflecting the whole extrusion is more code and
reads as a second object.

**The look**
- 1920×1080, 30fps, 210 frames. Background `theme.bg` (house `#0a0b10`) with
  `radial-gradient(ellipse at 50% 46%, ${accentColor}1f 0%, transparent 62%)` (`accentColor` =
  `theme.accent`).
- Anton at 300px, `fontWeight: 800` on the word and its reflection, with `fontSynthesis: 'none'` on the
  scene. Anton ships 400 only, so it renders unchanged, and a theme's display face gets its heavy cut
  instead of its regular one. Face `theme.paper` (house `#f6f5f2`), side `theme.accent` (house
  `#ff5c39`), shaded side `theme.accentOnPaper` (house `#c2410c`). `whiteSpace: 'nowrap'`.
- A tracked monospace caption below, in `theme.mono`, colour `theme.muted`, with a matching negative
  right margin so it stays centred.

**Requirements**
- One self-contained `.tsx` file exporting `ExtrudedText`.
- Props: `text`, `caption`, `depth`, `step`, `faceColor`, `sideColor`, `sideShadeColor`,
  `backgroundColor`, `accentColor`, `swing`.
- Load Anton via `@remotion/google-fonts/Anton`.
- 40 layers is ~40 extra DOM nodes per frame — cheap. Push past ~120 and render time starts to show.
