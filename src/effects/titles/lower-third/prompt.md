Build a Remotion composition called **LowerThird** (composition id `lower-third`): a broadcast name
plate that unrolls out of an accent bar and retracts the same way.

**One `open` value drives everything**
This is the whole design. Take the minimum of an ease-in ramp and an ease-out ramp so the value goes
0 → 1 → 0 across the shot:

```tsx
const open = Math.min(
  interpolate(frame, [0, enterFrames], [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)}),
  interpolate(frame, [durationInFrames - enterFrames, durationInFrames], [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.7, 0, 0.84, 0)}),
);
```

Then stage the layers off it, each starting later in the same 0→1 range:

```tsx
const stage = (delay: number) => Math.max(0, Math.min(1, (open - delay) / (1 - delay)));
const bar = stage(0), plate = stage(0.3), text = stage(0.55);
```

Because the exit is the same value running backwards, the plate **retracts into the bar** exactly the
way it came out. Writing a separate exit animation — or just fading the whole thing — loses that, and
the plate stops reading as one mechanism.

**The build**
- 1920×1080, 30fps, 140 frames. Anchored bottom-left at `left: 140, bottom: 190`, 148px tall.
- The whole assembly gets `transform: skewX(-12deg)`, so the bar and plate share one slanted edge.
- **Accent bar**: 22px wide, `accentColor` (`theme.accent`, `#ff5c39`),
  `transformOrigin: 'bottom left'`, `scale: \`1 ${bar}\`` — it grows vertically out of nothing.
- **Plate**: `plateColor` (`theme.bg`, `#0a0b10`), `overflow: hidden`, `transformOrigin: 'left center'`,
  `scale: \`${plate} 1\`` — it unrolls horizontally out of the bar.
- **Text block**: `transform: skewX(12deg)` — the **counter-skew** is essential. Without it the words
  are italicised along with the plate, which looks like a mistake rather than a design. It also slides
  `translate: \`${(text - 1) * 90}px 0px\`` so it emerges from behind the bar, and needs
  `whiteSpace: 'nowrap'` or it reflows while the plate is still narrow.
- Inside: a `LIVE` chip (20px weight 800, `letter-spacing: 0.18em`, `theme.accentInk` text on the
  accent (house `#04050a`), radius `theme.radius * 5 / 18` (5 at house)), the name at 52px weight 800,
  and a title line at 26px weight 500 in `theme.muted` (`#8d93a5`).
- A `theme.stroke` (3px) accent rule 14px below the plate, growing 0→620px on the `text` stage.

**Note the axis-specific scale.** `scale: '1 0.4'` scales y only, `scale: '0.4 1'` scales x only. Two
values, space-separated, no units. That is what lets the bar grow up while the plate grows sideways
from the same driver.

**Requirements**
- One self-contained `.tsx` file exporting `LowerThird`.
- Props: `name`, `title`, `kicker`, `accentColor`, `plateColor`, `textColor`, `holdFrames`,
  `enterFrames`, `x`, `y`, `skew`, `transparent`.
- With `transparent`, render as an alpha overlay (`--codec=prores --prores-profile=4444`) and composite
  over your footage — which is how a real lower third gets used. ProRes 4444 survives the composite;
  VP8 WebM alpha comes back as a black box, so keep `--codec=vp8` for web playback only.
- Load Inter via `@remotion/google-fonts/Inter`.
