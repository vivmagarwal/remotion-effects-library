Build a Remotion composition called **VideoInText** (composition id `video-in-text`): footage playing
inside letterforms, which then open up and swallow the frame.

**Use an SVG `clipPath`, not `background-clip: text`**
This is the whole point. `background-clip: text` clips a **paint** — it can carry a gradient, and
that is all. It cannot clip a `<Video>`, a `<CanvasImage>`, or any other element. An SVG `<clipPath>`
containing real `<text>` clips **anything you put inside it**:

```tsx
<svg width={0} height={0} style={{position: 'absolute'}}>
  <defs>
    <clipPath id={`vit-text-${svgId}`} clipPathUnits="userSpaceOnUse">
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
            fontFamily={fontFamily} fontSize={fontSize} fontWeight={800}
            transform={`translate(${cx} ${cy}) scale(${maskScale}) translate(${-cx} ${-cy})`}>
        {word}
      </text>
    </clipPath>
  </defs>
</svg>

<AbsoluteFill style={{clipPath: `url(#vit-text-${svgId})`, WebkitClipPath: `url(#vit-text-${svgId})`}}>
  <CanvasImage src={…} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
</AbsoluteFill>
```

Three mechanics:
- **`clipPathUnits="userSpaceOnUse"`** — the clip is defined in pixels, matching the composition's
  coordinate space. The default (`objectBoundingBox`) makes every coordinate a 0–1 fraction of the
  clipped element, and your 330px text becomes 330× the frame.
- The `<svg>` holding the `<defs>` is `width={0} height={0}` — it is a **definition**, not a drawing.
  Give it a size and it takes up layout.
- Include `WebkitClipPath` alongside `clipPath`.

**The open — scale the mask, not the content**

```tsx
const open = interpolate(frame, [openAt, openAt + openFrames], [1, openScale], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.7, 0, 0.3, 1)});
```

Scale the **text inside the clipPath** about the frame's centre —
`translate(cx cy) scale(s) translate(-cx -cy)` — while the media behind it stays put. The letterform
grows until its counters clear the frame, and what began as a text-shaped window becomes a full-frame
reveal. The media never moves, so the footage stays correctly framed the whole way through; scaling
the content instead sends the shot flying off while the window stands still.

`openScale` has to be large enough to actually clear the frame — 26 for a 330px word at 1920 wide.
Under-scale it and a letterform's edges are still visible at the end of the move.

The zoom centre can land between two letters (it does for `INSIDE`, in every face), so the letterform
alone never covers the frame. Put `<circle cx={cx} cy={cy} r={iris} />` in the same clipPath, growing
0 → `Math.hypot(cx, cy)` over the back 60% of the open on the same easing. The clip is the union, and
the reveal ends full-frame whatever typeface the theme supplies.

**The rest**
- 1920×1080, 30fps, 180 frames. Background `theme.bg` (house `#0a0b10`). Anton at 330px,
  `fontWeight={800}` with `fontSynthesis: 'none'` on the scene (Anton renders its one weight unchanged;
  a theme's display face gets its heavy cut), `letterSpacing: -6`, `dominant-baseline: central`.
- A settle first: the mask scales 1.16→1 over 34 frames, so the type arrives before it opens.
- The media gets its own slow push (1.05→1.16) independent of the mask — two speeds, so the shot is
  alive inside the letters.
- A monospace caption in `theme.mono`, colour `theme.muted`, that fades **out before the open begins**
  (`[22, 40, openAt - 6, openAt + 6] → [0, 1, 1, 0]`), or it ends up sitting on top of the revealed
  footage.

**Requirements**
- One self-contained `.tsx` file exporting `VideoInText`.
- Props: `src`, `word`, `caption`, `openAt`, `openFrames`, `openScale`, `backgroundColor`,
  `captionColor`, `fontSize`.
- Swap `<CanvasImage>` for `<Video>` from `@remotion/media` for real footage — the clip works
  identically, which is the entire reason for using it.
- SVG `<text>` needs `fontFamily` set on the element; it does not inherit from an ancestor div.
- Load Anton via `@remotion/google-fonts/Anton`.
