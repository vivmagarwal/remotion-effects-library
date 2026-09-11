Build a Remotion composition called **HandheldDrift** (composition id `handheld-drift`): a locked-off
clip given a human operator, in four named presets.

**Setup**

```bash
npx remotion add @remotion/media @remotion/noise @remotion/google-fonts
```

**Why noise and not a sine.** A sine wave is periodic, and the eye locks onto the period within about
two cycles — after which the shot reads as *oscillating*, not as handheld. Perlin noise is aperiodic
and band-limited, which is what a human arm actually is. `noise2D(seed, x, y)` from `@remotion/noise`
returns `[-1, 1]` and is deterministic for a given seed, so it survives Remotion rendering frames out
of order.

**The four details, all of which matter**

```tsx
// 1 + 2. Two octaves, 3:1, the second at 30%. One is too smooth to be a person; three is mush.
const octaves = (seed: string, t: number) =>
  noise2D(seed, t * p.step, 0) + noise2D(`${seed}-hi`, t * p.step * 3, 0) * 0.3;

// 3. A different seed per axis. `noise2D(seed, t, 0)` and `noise2D(seed, 0, t)` on the SAME seed are
//    correlated and produce diagonal motion — the classic tell.
const dx = octaves('hh-x', frame) * p.amp;
const dy = octaves('hh-y', frame) * p.amp;

// 4. Rotation evaluated in the PAST. A real operator's wrist turns after their arm has moved.
const rot = octaves('hh-r', frame - rotationLag) * p.rot;
```

**Overscan, computed rather than guessed.** Drifting a full-bleed layer moves the frame edge into
view. Scale the picture up by more than the worst-case drift first, with headroom for the rotation,
which throws the corners further than the centre:

```tsx
const overscan = 1 + (p.amp * 2 * 1.3) / height + Math.abs(p.breathe);
```

**The presets** — amplitude in px at 1080p, rotation in degrees, `step` is the base octave's noise
input per frame:

| preset | amp | rot | step | breathe | note |
|---|---|---|---|---|---|
| `tripod` | 3 | 0.15 | 0.012 | 0 | a locked-off shot that is not dead |
| `shoulder` | 11 | 0.45 | 0.03 | 0 | the default for an interview |
| `walking` | 26 | 1.2 | 0.055 | 0.009 | add `<CameraMotionBlur>` at this amplitude |
| `seasick` | 46 | 2.4 | 0.095 | 0.02 | ship this one as the counter-example, not as an option |

Past about ±40px and ±2° it stops reading as a camera and starts reading as a fault. Below ±3px the
drift is invisible and you have paid for nothing — which is fine, `tripod` is for shots that need to
feel alive without appearing to move.

**The debug layer** draws both noise curves as `<polyline>` over the last 120 frames, the rotation one
sampled at `frame - rotationLag`, so the lag is **visible** rather than asserted. A playhead line in
`theme.ink` sits at the right edge. Keep it behind `showDebug`, because the useful version of this
effect has no furniture on it.

**The look**
- 1920×1080, 30fps, 240 frames. Ground `#0a0b10`, `overflow: hidden`.
- Readout pill top-left at `84, 84`, `maxWidth: 720`: preset name at 34px/800 tracking `0.16em` in
  `#ff5c39`; the note at 34px/500 `#eef1f7`; then `±11px · ±0.45° · lag 4f · overscan 1.027×` at
  34px/500 `#8d93a5`. Pill: `padding: 16px 26px`, radius `12 × theme.radius / 18` (12 at house),
  `rgba(10,11,16,0.72)`, `backdropFilter: 'blur(18px) saturate(1.3)'`,
  `1px solid rgba(255,255,255,0.14)`.
- Curves at `left/right: 84, bottom: 84`, 120px tall, `viewBox="0 0 1000 120"` with
  `preserveAspectRatio="none"`, translate in the accent and rotate in `theme.pair` (house `#4cc9f0`),
  at `2.5 × theme.stroke / 3`px.
- Top-right, fading in over frames 0–16: `two octaves · 3:1 · second at 30%` at 34px/500 `#8d93a5`,
  with `textShadow: '0 2px 14px rgba(10,11,16,0.95), 0 0 34px rgba(10,11,16,0.8)'` so it survives
  bright footage.

**Requirements**
- One self-contained `.tsx` file exporting `HandheldDrift`.
- Props with these exact defaults: `src` (defaults to `staticFile('footage/interview.mp4')`),
  `preset` `'shoulder'`, `rotationLag` `4`, `showDebug` `true`, `accentColor` `'#ff5c39'`,
  `backgroundColor` `'#0a0b10'`.
- `<Video>` from `@remotion/media`, `muted` and `loop` — the shipped clip is 6.1s and the composition
  is 8s.
- Load Inter at weights 500, 700, 800.
