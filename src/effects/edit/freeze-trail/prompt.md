Build a Remotion composition called **FreezeTrail** (composition id `freeze-trail`): motion blur made
from time rather than from a blur filter.

**Stack the past**

```tsx
{new Array(samples).fill(0).map((_, i) => {
  const age = samples - 1 - i;              // oldest first
  const past = frame - age * spacing;       // samples 12, spacing 2
  if (past < 0) return null;
  return (
    <AbsoluteFill key={age} style={{opacity: age === 0 ? 1 : /* decaying */}}>
      <Freeze frame={past}>
        <Subject … />
      </Freeze>
    </AbsoluteFill>
  );
})}
```

`<Freeze frame={n}>` from `remotion` rewinds its subtree's clock to frame `n`. Drawing the same subject
twelve times at twelve past moments gives a trail that is a **real record of where the thing was** — so
it curves when the path curves, bunches up where the subject slows, and vanishes when it stops. A
directional `blur()` filter can do none of that: it smears in one fixed direction regardless of where
the subject actually went.

**The subject must time itself**
This is the requirement that makes or breaks it. The subject has to call `useCurrentFrame()` **inside
itself**:

```tsx
const Subject = ({word, loopFrames}) => {
  const frame = useCurrentFrame();          // ← inside, so Freeze can rewind it
  const t = (frame % loopFrames) / loopFrames;
  const x = Math.sin(t * Math.PI * 2) * (width * 0.3);
  …
};
```

Compute the position in the parent and pass it down as a prop and every echo receives the *same*
position — `<Freeze>` changes the child's clock, not the parent's props — so all twelve copies stack
exactly on top of each other and you see nothing but a slightly brighter subject.

**Paint order and opacity**
- Render **oldest first** so the live subject (`age === 0`) paints last and stays crisp. Reverse it and
  the ghosts sit on top of the thing they are trailing.
- The live copy is fully opaque; the echoes decay from `tailOpacity * 4` down to `tailOpacity` (0.06).
  Keep the tail very faint — twelve layers at even 0.15 accumulate into a solid smear.
- Skip any echo whose `past` frame is negative, or the trail exists before the shot starts.

**The motion**
`Math.sin(t * Math.PI * 2)` across `loopFrames` — fast through the middle, still at both ends. That
gives a dense trail where the subject is quick and none where it is stationary, which is exactly the
behaviour that makes the technique read as speed. A constant-velocity move produces an evenly spaced
trail that looks like a repeat pattern.

**The look**
- 1920×1080, 30fps, 180 frames. Background `#0a0a10` with
  `radial-gradient(ellipse at 50% 50%, #ff5c391a 0%, transparent 62%)`.
- Archivo at 210px weight 900, letter-spacing `-0.04em`, `whiteSpace: 'nowrap'`, in the accent colour.
  Add a small counter-tilt (`-swing * 9deg`) so the trail fans rather than running dead straight.
- A monospace caption naming the technique.

**Requirements**
- One self-contained `.tsx` file exporting `FreezeTrail`, with the subject as a nested component.
- Props: `word`, `caption`, `samples`, `spacing`, `tailOpacity`, `accentColor`, `backgroundColor`,
  `loopFrames`.
- Twelve copies of a text node is cheap. Wrapping twelve `<Video>` elements this way is not — for
  footage, use `<CameraMotionBlur>` from `@remotion/motion-blur` instead, and switch its `shutterAngle`
  down to ~0.1 when nothing is moving so still passages stay sharp and cheap.
- Load Archivo via `@remotion/google-fonts/Archivo`.
