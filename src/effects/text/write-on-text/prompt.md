Build a Remotion composition called **WriteOnText** (composition id `write-on-text`): text that writes
itself on — each glyph's outline stroked first, then its ink arriving behind it. This is Manim's
`Write()`.

**Two layers of the same text, one lagging the other**

```tsx
const common = {
  x: width / 2, y,
  textAnchor: 'middle' as const,
  dominantBaseline: 'middle' as const,
  fontFamily: hand, fontSize, fontWeight: 700,
  dx: (ci - (line.length - 1) / 2) * (fontSize * 0.44),
};

<text {...common} fill="none" stroke={strokeColor} strokeWidth={2.4} strokeLinejoin="round"
      strokeDasharray={DASH} strokeDashoffset={DASH * (1 - stroke)} opacity={1 - fill}>{ch}</text>
<text {...common} fill={inkColor} opacity={fill}>{ch}</text>
```

Three things make this work:

1. **`stroke-dasharray` applies to SVG `<text>`**, and the dash follows each glyph's *outline*. Set
   `DASH` to something comfortably longer than any glyph's perimeter (`fontSize * 6`) — the excess just
   sits off the end of the path — and animate `strokeDashoffset` from `DASH` to `0`.
2. **The fill lags the stroke** by `fillDelay` frames. That lag is the whole illusion. Fill and stroke
   together is a fade; fill without stroke is a wipe; stroke *then* fill is ink being laid down.
3. **The outline fades out as the fill arrives** (`opacity: 1 - fill`), so the finished line is clean
   ink rather than permanently outlined.

**Both layers must share identical geometry.** Spread the same `common` props object into both — same
`x`, `y`, `dx`, `fontSize`, `textAnchor`, `dominantBaseline`. Set them separately and the fill lands a
pixel or two off the outline that drew it, which looks like a printing misregistration.

**Per-glyph layout**
One `<text>` per character, positioned with
`dx: (ci - (line.length - 1) / 2) * (fontSize * 0.44)` so each line still reads as centred. This is an
approximation — the font is not monospaced — but for a handwriting face at display size it is close
enough, and it is what lets each glyph have its own stagger. Return `null` for glyphs whose stroke
progress is still 0, so nothing paints before its turn.

**Manim's easing**

```tsx
const smooth = (t: number) => {const c = Math.min(1, Math.max(0, t)); return c * c * (3 - 2 * c);};
```

Smoothstep — zero velocity at both ends, no overshoot. It is what makes the stroke settle onto the
glyph rather than stopping dead.

**The look**
- 1920×1080, 30fps, 180 frames. Deep navy `#0e1b2b` with
  `radial-gradient(ellipse at 50% 42%, #17304a 0%, #0a1421 70%)`.
- Kalam (a handwriting face) at 168px weight 700. Ink `#f4f1e8`, outline `#ffcf3d`.
- Faint ruled lines behind the text, offset to sit under the baseline — the writing needs something to
  sit on, or it floats.
- Stagger 3.4 frames per character, 16-frame stroke, 5-frame fill delay.
- A tracked sans caption at the bottom.

**Requirements**
- One self-contained `.tsx` file exporting `WriteOnText`.
- Props: `lines`, `caption`, `stagger`, `strokeFrames`, `fillDelay`, `startAt`, `inkColor`,
  `strokeColor`, `backgroundColor`, `fontSize`.
- Load Kalam and Inter via `@remotion/google-fonts`. SVG `<text>` needs `fontFamily` set on the element
  itself — it does not inherit from an ancestor div.
- Keep a running character index across lines so the stagger continues from one line to the next rather
  than restarting.
