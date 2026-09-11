Build a Remotion composition called **PunchInCut** (composition id `punch-in-cut`): a talking-head clip
whose framing steps on every cut, so a sequence of jump cuts stops reading as cuts.

**Setup**

```bash
npx remotion add @remotion/media @remotion/google-fonts
```

**The look**
- 1920×1080, 30fps, 240 frames. Ground `#0a0b10`, `overflow: hidden`.
- One `<Video>` from `@remotion/media`, `objectFit: 'cover'`, filling the frame, `muted` and `loop`.
- A readout pill top-left at `left: 84, top: 84`: `1.05×` at 54px/800, then `CUT 2` at 28px/700 with
  `letter-spacing: 0.16em` in `#ff5c39`, then `+18f` at 28px/500 in `#8d93a5`. Pill is
  `padding: 14px 26px`, `borderRadius: 12 × theme.radius / 18` (12 at house), `rgba(10,11,16,0.72)`,
  `backdropFilter: 'blur(18px) saturate(1.3)'`, `1px solid rgba(255,255,255,0.14)`.
- A 6px cut strip along the bottom at `left/right: 84, bottom: 84`, track
  `rgba(255,255,255,0.18)`, a `3 × theme.stroke / 3`px-wide (3 at house) × 32px tick at each cut
  (accent for the current one, else `rgba(255,255,255,0.5)`), and an accent progress fill. The strip
  itself is a track, not a stroke, so it stays 6px.

**The mechanism — this is the whole effect**

1. **The step is not animated.** Take the level in force from the cut list:

```tsx
const current = cuts.filter((c) => c.at <= frame).at(-1) ?? cuts[0];
```

   Then apply `scale: current.scale` directly. Do **not** `interpolate` between levels. An eased zoom
   on a cut announces the cut; a hard step is what the brain mistakes for a second camera. If you
   find yourself reaching for a tween here you have built a different effect.

2. **2-5 % is the band.** Below 2 % the eye files the change as an encode wobble and the cut stays
   visible. Above about 8 % it reads as a zoom and draws attention to the edit. Ship this cut list:

```tsx
[{at: 0, scale: 1.0}, {at: 42, scale: 1.05}, {at: 84, scale: 1.0},
 {at: 126, scale: 1.08}, {at: 168, scale: 1.03}, {at: 210, scale: 1.0}]
```

   Note that no two consecutive levels are equal. Repeat one and the cut disappears — there is no
   framing change to hide it behind. Ratchet them all upward and the shot creeps in and never comes
   back, which is the same mistake as a Ken Burns sequence that only ever pushes.

3. **Anchor on the subject, not the centre.** A subject's eyes are almost never centred, and scaling
   about the frame centre moves them. Use `transformOrigin` from a normalised subject point:

```tsx
transformOrigin: `${subject[0] * 100}% ${subject[1] * 100}%`   // e.g. [0.46, 0.38]
```

   Scaling about the centre and then translating back is two moves fighting each other, and it shows
   on the frame edges part-way through.

**Requirements**
- One self-contained `.tsx` file exporting `PunchInCut`.
- Props with these exact defaults: `src` (optional, defaults to
  `staticFile('footage/interview-raw.mp4')`), `cuts` (the array above), `subject` `[0.46, 0.38]`,
  `showDebug` `true`, `accentColor` `'#ff5c39'`, `backgroundColor` `'#0a0b10'`.
- `<Video>` comes from `@remotion/media`, not from `remotion`. Give it `muted` and `loop`: the shipped
  clip is 39.0s at 30fps = 1170 frames, comfortably longer than the composition, but `loop` keeps it
  honest if someone swaps in a shorter source, and a black frame here looks like a broken cut.
- `showDebug` must genuinely remove the readout and the strip, because the useful version of this
  effect is the one with no furniture on it.
- Load Inter via `@remotion/google-fonts` at weights 500, 700 and 800 — exactly the three used.

**A note on what this is for.** Pair it with a transcript-driven cut list (silence and filler-word
removal) and the punch is what makes the result watchable: every removal leaves a discontinuity, and a
framing change at each one is what stops the viewer seeing forty of them.
