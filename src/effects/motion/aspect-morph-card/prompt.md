Build a Remotion composition called **AspectMorphCard** (composition id `aspect-morph-card`): a media card
that morphs between a tall portrait frame and a small landscape one, freeing the space for a text beat
and then taking it back.

**Interpolate the rectangle, not a transform**
This is the entire technique, and the thing almost everyone gets wrong.

```tsx
const lerp = (a: number, b: number) => a + (b - a) * shift;
const card = {
  x: lerp(rest.x, shifted.x),
  y: lerp(rest.y, shifted.y),
  w: lerp(rest.w, shifted.w),
  h: lerp(rest.h, shifted.h),
};

<div style={{position: 'absolute', left: card.x, top: card.y, width: card.w, height: card.h,
             borderRadius: 28, overflow: 'hidden'}}>
  <CanvasImage src={…} style={{width: '100%', height: '100%',
                               objectFit: 'cover', objectPosition: '50% 42%'}} />
</div>
```

Animating `left / top / width / height` means the card's **aspect ratio genuinely changes**, and
`objectFit: cover` re-crops the picture around its subject as it does. A `transform: scale()` cannot do
this — it squashes the contents, the border stretches with them, and the whole thing reads as a resize
rather than as one object changing shape. Use `fill` and the image distorts; use `contain` and it
letterboxes. **`cover` is the illusion.**

The border radius and border width stay constant through the move, which is what tells the eye it is
the same card. Under `scale()` both would stretch — another giveaway.

**One `shift` value, built from a spring in minus a spring out**

```tsx
let shift = 0;
for (const b of beats) {
  const out = b.at + b.hold;
  if (frame < b.at - morphFrames) continue;
  const sIn  = spring({frame: frame - (b.at - morphFrames), fps,
                       config: {damping: 15, stiffness: 150}, durationInFrames: morphFrames});
  const sOut = frame >= out
    ? spring({frame: frame - out, fps, config: {damping: 15, stiffness: 150}, durationInFrames: morphFrames})
    : 0;
  shift = Math.max(shift, Math.max(0, sIn - sOut));
}
```

`sIn - sOut` gives a clean go-and-return from two springs with no state and no keyframe list, and
`Math.max` across beats lets consecutive beats sit close together without their springs fighting —
whichever is further along wins. Track which beat is winning so you know whose text to show.

**Everything else reads from `shift`, not from the frame**
The text beat's opacity, its rise, and the per-line stagger are all `interpolate(shift, …)`:

```tsx
opacity: interpolate(shift, [0.5 + i * 0.12, 0.8 + i * 0.12], [0, 1], {/* clamped */}),
```

Because they are driven by the same value that moves the card, the text can never be visible while the
card still covers it, and the lines re-stagger identically on the way out. Drive them from `frame`
instead and every retiming of the beat desynchronises them.

**The look**
- **1080×1920 (vertical)**, 30fps, 340 frames. Warm paper `#f6f4ef`, ink `#1d1b17`, accent `#ff5c39`.
- Rest rect `{x: 44, y: 300, w: 992, h: 1180}`; shifted rect `{x: 150, y: 1170, w: 780, h: 500}`.
  Card: radius 28, `4px solid #1d1b17`, `boxShadow: '0 26px 70px rgba(29,27,23,0.28)'`,
  `overflow: hidden`.
- A fixed header top-left with a short accent rule under it — the card needs something stationary to
  move against, or the move has no frame of reference.
- The text beat: an accent kicker chip, then lines at 92px weight 800, line-height 1.16.
- A chip riding inside the card (bottom-left) so it is legible as one object in both states.
- A monospace `shift 0.00` read-out, so the mechanism is visible while you watch it.

**Requirements**
- One self-contained `.tsx` file exporting `AspectMorphCard`.
- Props: `src`, `title`, `rest` and `shifted` (each `{x, y, w, h}`), `beats` (array of
  `{at, hold, kicker, lines}`), `accentColor`, `paperColor`, `morphFrames`.
- Use `<CanvasImage>` with `staticFile()`; swap it for `<Video>` from `@remotion/media` to morph a
  video card, which is where this technique earns its keep.
- Load Inter via `@remotion/google-fonts/Inter`.
