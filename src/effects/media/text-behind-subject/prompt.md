Build a Remotion composition called **TextBehindSubject** (composition id `text-behind-subject`): type
sandwiched between a scene and its foreground, so the subject occludes the words.

**Three layers, in exactly this order**

1. **Background** — the whole scene, `objectFit: 'cover'`.
2. **The type** — kicker and headline, centred.
3. **The subject** — the *same* scene's foreground, **with a transparent background**, `inset: 0`,
   `objectFit: 'cover'`.

Layer 3 is the entire effect, and it is where this goes wrong: it must be a genuine cutout with real
alpha, transparent everywhere the background shows through. A second copy of the full plate covers the
text completely; a plate with a solid background covers it too. If you have no cutout there is no
effect — no amount of blend mode or masking substitutes for one.

For a generated placeholder, render the foreground objects (a skyline, a ridge) into their own SVG with
no background rect — and use the **same random seed and the same draw order** as the background plate,
or the two silhouettes will not line up. For real footage, produce the matte with a rotoscoping or
background-removal tool and drop the result in as layer 3.

**One push, shared**

```tsx
const push = interpolate(frame, [0, durationInFrames], [1, pushTo], {/* clamped */});  // 1 → 1.08
const textPush = 1 + (push - 1) * 1.35;
```

Both plates take `scale: push`. Scaling only the subject breaks the alignment that makes the occlusion
believable — the foreground slides against its own background and the illusion goes immediately.

The type takes `textPush`, drifting **35% faster** than the plates. That small difference separates it
from both without lifting it out of the sandwich; matching the plates exactly makes it feel painted on,
and pushing it much harder makes it read as a separate layer floating in front.

**The type**
- Archivo at 300px weight 900, line-height 0.94, letter-spacing `-0.04em`, `whiteSpace: 'nowrap'`,
  with `textShadow: '0 24px 70px rgba(0,0,0,0.55)'` so it has weight against the sky.
- It rises `translate: \`0px ${(1 - rise) * 90}px\`` and fades in over 34 frames — rising *out from
  behind* the foreground is what tells the viewer where it lives.
- A tracked accent kicker above it, with a matching negative right margin so it stays optically centred.

**The finish**
A graded wash over everything —
`linear-gradient(rgba(8,6,20,0.34) 0%, transparent 34%, transparent 62%, rgba(8,6,20,0.5) 100%)` —
which beds the type into the scene rather than leaving it sitting on top of it.

**Requirements**
- One self-contained `.tsx` file exporting `TextBehindSubject`.
- Props: `backgroundSrc`, `subjectSrc`, `text`, `kicker`, `riseFrames`, `startAt`, `pushTo`,
  `textColor`, `accentColor`, `fontSize`.
- Use `<CanvasImage>` with `staticFile()`. For video, use two `<Video>` elements from `@remotion/media`
  — the plate and its matte — with the type between them.
- Load Archivo via `@remotion/google-fonts/Archivo`.
