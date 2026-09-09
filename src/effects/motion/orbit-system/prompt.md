Build a Remotion composition called **OrbitSystem** (composition id `orbit-system`): planets orbiting
a glowing star, seen from a low angle, genuinely passing in front of and behind it. No 3D library —
plain CSS and trigonometry.

**The look**
- 1920×1080, 30fps, 300 frames. Background `#04040a`. Sora throughout.
- A glowing star at centre: 180px, `radial-gradient(circle, #fff8e0 0%, #ffcf5c 45%, #ffcf5c00 72%)`
  with `boxShadow: '0 0 180px #ffcf5c88, 0 0 400px #ffcf5c44'`, scaling 0→1 over 26 frames
  (`output: 'perceptual-scale'`).
- Five bodies. Use exactly these — the numbers matter, see below:

  | name | colour | radius | size | speed | phase | ring |
  |---|---|---|---|---|---|---|
  | Mercury | `#c9b39b` | 158 | 26 | 2.6 | 0.4 | |
  | Venus | `#e9b06a` | 248 | 38 | 1.75 | 2.35 | |
  | Earth | `#4fa3e3` | 338 | 42 | 1.2 | 4.2 | |
  | Mars | `#e0663f` | 432 | 32 | 0.85 | 5.55 | |
  | Saturn | `#e8cf94` | 548 | 56 | 0.58 | 1.15 | ✓ |

- Faint orbit paths (`1px solid #ffffff14`), a 20px name label under each planet with
  `letter-spacing: 0.2em` in `#7d8598`, and the star's name top-left at 52px weight 700.

**The two ideas that make it work**

1. **Tilt by squashing y.**

```tsx
// Camera elevation ABOVE the orbital plane, in degrees.
// 90° = straight down (circles), 0° = edge-on (flat lines).
const squash = Math.sin((elevation * Math.PI) / 180);   // elevation = 17
const angle  = t * b.speed * 0.6 + b.phase;             // t = frame / fps
const x = cx + Math.cos(angle) * b.radius;
const y = cy + Math.sin(angle) * b.radius * squash;     // ← the whole illusion
```

   A circle seen from `elevation` degrees above its plane projects to an ellipse whose height is
   `sin(elevation)` of its width. The orbit rings use the same squash on their height, so paths and
   bodies always agree.

2. **Occlusion from paint order.** `Math.sin(angle) > 0` means the body is on the near side. Render the
   planets in **two passes**: those with `sin(angle) <= 0` before the star, those with `sin(angle) > 0`
   after it. Later elements paint on top, so near planets occlude the star and far ones disappear
   behind it — correct depth sorting for free, no z-index bookkeeping and no 3D library.

**The geometry has to let the occlusion happen — this is the trap**
A planet's closest approach to the star *on screen* is `radius × squash`. If that is larger than the
star's visible radius, **no planet ever touches the star and the entire two-pass structure is dead
code** — it changes zero pixels, and the shot looks like a flat diagram of concentric circles.

Check it before you ship. The star's gradient fades out at 72%, so its visible radius is
`180 / 2 × 0.72 ≈ 65px`. At `elevation = 17` (`squash = 0.292`):

```
Mercury  158 × 0.292 = 46px  − 13 (half its size) = 33  <  65  → transits ✓
Venus    248 × 0.292 = 72px  − 19               = 53  <  65  → transits ✓
Earth    338 × 0.292 = 99px  − 21               = 78  >  65  → clears
```

A shallow elevation like 60–70° gives `squash ≈ 0.87–0.94`: the innermost planet then stays ~140px
clear of a 65px star, nothing ever crosses, **and** Saturn's vertical excursion (`548 × 0.9 = 493px`)
overflows the 540px half-frame and gets clipped off the bottom. Low elevation fixes both at once.

Verify it by rendering the extreme frames rather than trusting it: find the frame where a body is at
`sin(angle) ≈ -1` (deepest behind) and at `≈ +1` (deepest in front) and look at both. At these
parameters Mercury is fully hidden at **frame 83** and silhouetted on the star's core at **frame 264**.

**Lighting**
Offset each planet's gradient centre *against* its orbital angle so the lit side faces the star — and
squash the y component, exactly as the position is squashed:

```tsx
backgroundImage: `radial-gradient(circle at ${50 - Math.cos(angle) * 26}% ${50 - Math.sin(angle) * squash * 26}%,
  ${color}, ${color}44 62%, #05050c 100%)`,
```

Omitting `squash` on y leaves the highlight disagreeing with the geometry, which is invisible at high
elevations and obviously wrong at low ones. Without any of this every planet is a flat disc and the
shot looks like a diagram; with it they read as spheres. (It is a screen-space approximation, not real
phase lighting — a planet transiting the star still looks side-lit rather than silhouetted.)

**Other details**
- Saturn's ring is an ellipse `2.5×` the body width with the same `squash` on its height, rotated
  `-14deg`, drawn as a `border`. Offset its name label below the **ring**, not the body
  (`size * 1.35` rather than `size * 0.62`), or the label sits inside the ring and both become
  unreadable.
- Stagger the reveal: body `i` fades in over frames `[i * 5, i * 5 + 24]`; the orbit path and label
  follow their own body.
- Position each body with `left`/`top` in pixels plus `translate: '-50% -50%'` to centre it.

**Requirements**
- One self-contained `.tsx` file exporting `OrbitSystem`.
- Props: `bodies` (array of `{name, color, radius, size, speed, phase, hasRing?}`), `starName`,
  `starColor`, `backgroundColor`, `elevation`, `showLabels`.
- `starColor` is interpolated into hex strings with alpha suffixes appended (`${starColor}88`), so it
  only accepts 6-digit hex — not `rgb()` or a named colour.
- Load Sora via `@remotion/google-fonts/Sora` (it ships up to weight 800, not 900).
- Take `width`/`height` from `useVideoConfig()` for the centre point.
