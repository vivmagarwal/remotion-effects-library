Build a Remotion composition called **SpeedRamp** (composition id `speed-ramp`): one continuous clip
that runs at real time, ramps into slow motion, and ramps back out over-cranked.

**Setup**

```bash
npx remotion add @remotion/media @remotion/google-fonts
```

**`playbackRate` alone does not do this**

`playbackRate` is read once when the clip mounts. Animating it changes nothing on screen. A ramp is a
**remap**: at every output frame you compute how far into the *source* you have travelled by summing
the speed so far, and you seek there.

```
source position(f) = Σ speed(i) for i in [0, f]
```

```tsx
const cumulative = useMemo(() => {
  const out = [];
  let acc = 0;
  for (let i = 0; i < length; i++) { out.push(acc); acc += speedAt(i); }
  return out;
}, [speedAt, length]);

<Sequence from={frame}>
  <Video src={src} objectFit="cover" muted
         trimBefore={Math.round(cumulative[frame])}
         playbackRate={speedAt(frame)}
         style={{width: '100%', height: '100%'}} />
</Sequence>
```

**`<Sequence from={frame}>` is not a typo.** It resets the child's internal clock to 0 on every frame,
so `trimBefore` is the sole source of truth for the playhead. Leave it out and the child's own clock
advances *as well as* `trimBefore` — the clip accelerates away, and it looks like a bad encode rather
than like a bug in your code.

**Precompute the cumulative sum.** Written inline it is O(frame) per frame, which is O(n²) over a
render: survivable to about 900 frames, embarrassing after. It is also a pure function of the ramp, so
the `useMemo` is not an optimisation, it is where the value belongs.

**Write the ramp as data**, not as nested `interpolate()` calls, so it can be read and diffed:

```tsx
type Leg = {frames: number; from: number; to: number; label: string};
const RAMP: Leg[] = [
  {frames: 40, from: 1.0, to: 1.0, label: 'REAL TIME'},
  {frames:  8, from: 1.0, to: 0.4, label: 'RAMP DOWN'},
  {frames: 72, from: 0.4, to: 0.4, label: 'HOLD · 0.4×'},
  {frames: 14, from: 0.4, to: 1.5, label: 'RAMP UP'},
  {frames: 55, from: 1.5, to: 1.5, label: 'OVER-CRANK · 1.5×'},
];
```

**Three numbers, and none of them are taste**

- **The ramp out is longer than the ramp in** — 8 frames down, 14 back up. Symmetric reads mechanical,
  because nothing in the physical world accelerates and decelerates at the same rate.
- **The slow section starts 4–6 frames BEFORE the moment**, not on it. By the time the audience
  registers a speed change the moment has already begun.
- **0.4× is the floor for 30 fps source.** Below it each source frame is held for three or more output
  frames and the shot stutters. Remotion has no optical flow and no frame blending, so there is no
  software fix: slowing 30 fps to 0.2× honestly requires 150 fps in the camera. Say so rather than
  shipping a stutter.

**A ramp is a budget on the source.** The sum of the speeds is how many source frames you spend. Spend
more than the file has and the tail renders as a held final frame **with no error**, which reads as a
directing choice. Clamp `trimBefore` to `sourceDurationInFrames - 1` and put the spend on screen.

**Audio.** `playbackRate` pitches the audio with the picture. `toneFrequency` shifts pitch
independently but its verified range is **0.01–2**, and at `playbackRate: 0.4` you would need ~2.5 to
compensate. The honest answer is `<Video muted>` plus a separate un-ramped `<Audio>` of the same
source. This composition is muted.

**The look**

- 1920×1080, 30 fps, 189 frames — the sum of the legs. Ground `#04050a`. Inter at 500/700/800.
- `objectFit="cover"` as a **prop** on `<Video>`; it decodes into a canvas, so CSS `object-fit` in
  `style` is silently ignored.
- Readout pill top-left at `84, 84`, `padding: 16px 26px`, radius 12, `rgba(10,11,16,0.72)`,
  `backdropFilter: 'blur(18px) saturate(1.3)'`, `1px solid rgba(255,255,255,0.14)`, `minWidth: 560`.
  The current leg's label at 34px/800 `letter-spacing: 0.16em` in `#ff5c39`; then
  `0.40× · source frame 58 of 180` at 34px/500 `#eef1f7` with `fontVariantNumeric: 'tabular-nums'`,
  or the number jitters as the digits change width; then the spend percentage at 34px/500 `#8d93a5`.
- **Draw the ramp.** An SVG at `left/right: 84`, `bottom: 96`, `viewBox="0 0 <total> 110"` with
  `preserveAspectRatio="none"`, a hairline at 1× so the curve is measured against something, the
  speed polyline in the accent at `strokeWidth: 3` with `vectorEffect="non-scaling-stroke"` (the
  viewBox is anisotropic and a plain stroke would be squashed to a thread), and a white playhead.
- A 10px spend meter under it, `#c6ff3d` turning `#ffd166` past 98% — the moment before the budget
  runs out is the moment worth colouring.
- A 380px gradient scrim along the bottom so all of that survives whatever the footage is doing.

**Requirements**

- One self-contained `.tsx` file exporting `SpeedRamp`.
- Props with these exact defaults: `src` `staticFile('footage/broll-earth.mp4')`, `ramp` (the five
  legs above), `sourceDurationInFrames` `180`, `showDebug` `true`, `accentColor` `'#ff5c39'`,
  `backgroundColor` `'#04050a'`.
- The composition length must equal the sum of the legs. Check the budget before you pick it: these
  five legs spend 170 of the 180 available source frames, and a sixth leg at 1.5× would overrun.
