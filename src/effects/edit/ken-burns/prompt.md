Build a Remotion composition called **KenBurns**: still images given life by a slow push and drift,
with documentary-style captions.

**The look**
- 1920×1080, 30fps, 180 frames — two 90-frame shots played with `<Series>`.
- Under the Series, a full-frame ground in `theme.bgDeep` (`#04050a`) for each shot to fade through.
  Put it on the shot instead and it fades out with the picture, and the composition flashes
  transparent between plates.
- Each shot: a full-bleed image (`objectFit: 'cover'`) with a bottom scrim
  `linear-gradient(transparent 44%, rgba(6,6,10,0.55) 72%, rgba(6,6,10,0.92) 100%)`, a serif caption
  (DM Serif Display via `theme.display`, 78px, `theme.ink` (`#ffffff`), max-width 1300) bottom-left
  with 110px side padding, and a small uppercase credit at 26px with `letter-spacing: 0.2em` in
  `theme.muted` (`#8d93a5`), Inter via `theme.text`.
- Caption rises `'0px 26px'` → `'0px 0px'` and fades in over frames 6–34; credit follows.
- Each shot fades at both ends: `interpolate(frame, [0, 12, frames - 12, frames], [0, 1, 1, 0])`.

**The camera move — three rules**

1. **Both ends of the scale must be above 1.**

```tsx
scale: shot.from + (shot.to - shot.from) * p,   // e.g. 1.06 → 1.30
translate: `${panX * p}% ${panY * p}%`,
```

   Starting at exactly 1 leaves no overscan, so the frame edge slides into view the instant you pan.
   1.06 is the practical minimum.

2. **Ease linearly.** Use `Easing.linear` for the move. A camera on a dolly or a rostrum travels at a
   constant rate; `Easing.bezier(...)` accelerating and decelerating reads as a stumble, not as a
   camera. This is the opposite of the advice for UI motion, and it is the single thing most often
   got wrong here.

3. **Alternate direction between shots.** One shot pushes in (1.06 → 1.30) while the next pulls out
   (1.34 → 1.08), with pans on opposite signs. A sequence of identical pushes feels like the whole
   film is drifting one way forever.

**Structure**

```tsx
<Series>
  {shots.map((shot, i) => (
    <Series.Sequence key={i} durationInFrames={shotFrames} premountFor={30}>
      <Frame shot={shot} frames={shotFrames} />
    </Series.Sequence>
  ))}
</Series>
```

- `<Series>` plays children strictly one after another; `<Series.Sequence>` wraps each in an
  absolute-fill by default.
- **`premountFor={30}`** mounts the next shot a second early so its image is decoded before it is
  visible. Without it the first frame of each shot can render blank in a fast render.
- Inside `<Frame>`, `useCurrentFrame()` restarts at 0 for each shot — do not subtract the offset
  yourself.

**Requirements**
- One self-contained `.tsx` file exporting `KenBurns`.
- Props: `shots` (array of `{src?, caption, credit?, from, to, panX?, panY?}`) and `shotFrames`.
- Use `<CanvasImage>` from `remotion` for the images, with `staticFile('…')` for files in `public/`
  or a remote URL. For video sources use `<Video>` from `@remotion/media` instead.
- Load DM Serif Display and Inter via `@remotion/google-fonts`.
- Percentages in `translate` need the unit on both components: `` `${x}% ${y}%` ``.
