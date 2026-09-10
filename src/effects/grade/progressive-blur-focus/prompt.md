Build a Remotion composition called **ProgressiveBlurFocus** (composition id
`progressive-blur-focus`): a camera pulling focus back and forth across a shot.

**Setup**
`@remotion/effects` runs on WebGL2 — add `Config.setChromiumOpenGlRenderer('angle')` to
`remotion.config.ts` (or pass `--gl=angle`), or it renders black. Import from subpaths.

**Progressive, not uniform — this is the whole effect**

```tsx
effects={[
  radialProgressiveBlur({
    center: [focusX, focusY],   // UV coordinates, 0–1 — NOT pixels, NOT centerX/centerY
    width: 1.1, height: 0.95,   // the focus ellipse, in UV
    start: 0.18,                // 0 = centre, 1 = the ellipse line: sharp inside this
    startBlur: 0,
    endBlur: 42 * focus,        // pixels of blur at the ellipse
  }),
  linearProgressiveBlur({
    start: [0.5, 0.42], end: [0.5, 0],   // both are [x, y] UV TUPLES
    startBlur: 0, endBlur: 22 * focus,
  }),
  vignette({amount: 0.45, radius: 0.78, feather: 0.6}),
]}
```

A real lens is sharp at one plane and softens away from it. `radialProgressiveBlur()` reproduces that:
sharp inside `start`, ramping to `endBlur` at the ellipse. Reach for a plain `blur()` and fade its
radius up and down instead and you get a filter switching on — the whole frame going soft at once,
which never happens on a camera and reads as exactly the cheat it is.

The second `linearProgressiveBlur` runs bottom-to-top, softening the sky independently, which is what a
shallow plane of focus does to anything behind the subject. Stacking the two is what makes it read as
depth rather than as a vignette of blur.

**Both effects take UV coordinates, and `linearProgressiveBlur`'s `start`/`end` are `[x, y]` tuples,
not scalars** — passing a number throws *"start" must be a [number, number] tuple* at render time.
`radialProgressiveBlur` takes a single `center: [x, y]`, not separate `centerX`/`centerY`. The two
effects name their parameters differently; check each one's `.d.ts` rather than assuming.

**The rack**

```tsx
const focus = interpolate(frame, [0, 45, 95, 140], [0.06, 0.72, 0.1, 0.55],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.42, 0, 0.28, 1)});
```

Multi-keyframe, so focus is pulled out, back, and out again — a focus puller hunting. The easing
matters: a real pull accelerates off the mark and settles onto it, and `Easing.linear` immediately
reads as a motor rather than a hand.

Scale every blur radius by this single `focus` value so both falloffs stay in agreement.

**The furniture**
- 1920×1080, 30fps, 165 frames. Background `#05060a`, image `objectFit: 'cover'`.
- A 128px square focus reticle (`3px solid rgba(255,255,255,0.85)`, radius 6, with a dark 1px ring so it survives a light plate) at the focus point, which
  **tightens as the shot sharpens** — `scale: 0.72 + focus * 0.5`, `opacity: 0.28 + (1 - focus) * 0.45`.
  It makes the pull legible as a deliberate camera move rather than an accident.
- Bottom-left: a DM Sans title at 88px weight 700 with `textShadow: '0 10px 40px rgba(0,0,0,0.6)'` and a
  monospace caption at 26px. **Leave the type sharp** — it lives above the lens, not in front of it.
  Blurring the overlay with the picture is the giveaway that this is a filter and not a camera.

**Requirements**
- One self-contained `.tsx` file exporting `ProgressiveBlurFocus`.
- Props: `src`, `title`, `caption`, `rack` (array of `[frame, radius]` pairs), `focusX`, `focusY`.
- Load DM Sans via `@remotion/google-fonts/DMSans`.
- Swap `<CanvasImage>` for `<Video>` from `@remotion/media` to pull focus on real footage.
