Build a Remotion composition called **CinematicTechIntro**: light streaks race in from both sides,
collide at the centre in a flash, and leave a wordmark behind.

**The look**
- 1920×1080, 30fps, 150 frames. Background `backgroundColor` (`theme.bgDeep`, `#04050a`) with
  `overflow: hidden`. Accent `accentColor` (`theme.pair`, `#4cc9f0`).
- A soft floor glow behind everything:
  ``radial-gradient(ellipse at 50% 50%, ${accentColor}22 0%, transparent 62%)`` in an
  `<AbsoluteFill>`.
- Title in `fontFamily` (default `theme.display`; this file loads Sora as the inline value), 168px,
  weight 700, `theme.ink`, with ``textShadow: `0 0 60px ${accentColor}66` ``.
- A 1px accent hairline 30px below it, and a subtitle at 34px weight 300, uppercase,
  letter-spacing `0.34em`, in `theme.muted` (house `#8d93a5`).

**The streaks**
- 14 absolutely positioned bars, alternating `fromLeft` by index parity. For each, seed with
  `random()` from `remotion`: vertical position `8 + rand*84` (%), thickness `1 + rand*3.2` px,
  start delay `rand*10` frames, speed multiplier `0.6 + rand*0.6`, length `18 + rand*30` (%).
- Each is a gradient fading to transparent at its tail —
  ``linear-gradient(90deg, transparent, ${accentColor})`` from the left, `270deg` from the right — with
  `borderRadius` equal to its thickness and `filter: 'blur(0.5px)'`.
- Animate travel with a single progress `p` from 0→1, easing `Easing.bezier(0.4, 0, 0.2, 1)`, and
  position with `left: \`${-len + p * (52 + len)}%\`` for left-movers (`right:` for the others) — so
  each starts fully off-screen and ends just past centre.
- They fade out between `impact - 6` and `impact + 10`.

**The impact**
- `impact = 1.1 * fps` (frame 33). A full-screen white `<AbsoluteFill>` whose opacity interpolates
  `[impact - 2, impact, impact + 6] → [0, 0.85, 0]` — bright for two frames, gone in six. Longer than
  that and it reads as a fade, not a hit.
- The title fades in across `impact - 3 → impact + 4` and scales 1.06→1 over 1.6s.
- **Its `letter-spacing` opens from `'0.02em'` to `'0.22em'` over two seconds** with
  `Easing.bezier(0.16, 1, 0.3, 1)`. This is the detail that makes the whole thing read as expensive —
  do not skip it. Both ends need the same unit.
- The hairline grows 0→620px starting 6 frames after impact; the subtitle fades in after that.

**Letterboxing**
- Two bars in `theme.bgDeep` (house `#04050a`), one pinned `top: 0` and one `bottom: 0`, full width, whose height animates
  0 → `height * 0.075` over the first 0.8s. Cheap, and it does more for the "cinematic" read than
  anything else in the shot.

**Requirements**
- One self-contained `.tsx` file exporting `CinematicTechIntro`.
- Props: `title`, `subtitle`, `accentColor`, `backgroundColor` — optional, defaults above.
- Load Sora via `@remotion/google-fonts/Sora`.
- Use `random(seed)` from `remotion`, not `Math.random()` — otherwise the streaks re-roll on every
  rendered frame and the whole shot boils.
