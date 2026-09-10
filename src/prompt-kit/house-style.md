## House style — the look this library ships

These are values, not suggestions. There is **no shared tokens module**: inline the constants you use,
by name, with the comment shown. That keeps the file copy-pasteable and lets a reviewer see the intent.
The brief overrides any number here; nothing else does.

The colours and typefaces below are also the **house theme's** values. An effect reads them through a
`theme` prop whose inline default is exactly what is written here — see the theme section — so a set of
videos can be restyled together without any file losing the ability to run on its own. The easings,
springs and duration bands are NOT in the theme: they are craft rather than brand, and no set of
guidelines ever said "our videos use easeOutQuint".

### Grounds — three, not forty-nine

```ts
const INK      = '#0A0B10';   // default studio ground for almost every effect
const INK_DEEP = '#04050A';   // space / 3D / particle grounds, where stars need contrast
const PAPER    = '#F6F5F2';   // the light variant every effect should also survive
```

### Accents — one per effect

`EMBER #FF5C39` (house, on dark) · `EMBER_INK #C2410C` (house, on light) · `LIME #C6FF3D` ·
`SKY #4CC9F0` · `AMBER #FFD166` · `VIOLET #C77DFF`.

A second colour is allowed **only** as a semantic pair (before/after, gain/loss), and then it is
`EMBER` + `SKY`, never two warms. Effects that deliberately recreate someone else's product UI are
exempt; mark each such line `// palette: brand-mimicry <name>`.

### Neutrals

On `INK`: `#FFFFFF` display · `#EEF1F7` body · `#8D93A5` secondary.
On `PAPER`: `#1D1B17` display · `#4A4E5A` secondary.

### Type scale at 1920×1080 — scale by `height / 1080` at any other size

| tier | px | weight | tracking | use |
|---|---|---|---|---|
| `HERO` | 220 | 800 | −0.045em | one-word slam, stat slam |
| `DISPLAY` | 140 | 800 | −0.035em | title lock-up |
| `HEADLINE` | 92 | 800 | −0.03em | headline, kinetic words |
| `SUBHEAD` | 62 | 700 | −0.02em | secondary line, chart title |
| `BODY` | 44 | 500 | −0.01em | captions, labels, lower-third name |
| `SMALL` | 34 | 500 | 0 | credits, footnotes — **absolute floor** |
| `EYEBROW` | 28 | 700 | +0.24em, uppercase | kicker, chapter number, LIVE badge |

**Dense informational layers are exempt from the floor**: chart ticks and axis labels, code and
terminal output, recreated product UI, HUD readouts, table cells, legends. A 19 px axis label is
correct — forcing it to 34 px destroys the layout.

### Typefaces

`Inter` (UI, body, data) · `Sora` (tech, space, 3D) · `Archivo` + `Anton` (impact display) ·
`Playfair Display` (editorial) · `JetBrains Mono` (code only) · `Kalam` (hand-drawn only).
Anything else needs a one-line justification in `meta.description`.

### Easing vocabulary — inline these by name, with the comment

```ts
const SETTLE = Easing.bezier(0.16, 1, 0.3, 1);   // easeOutExpo — DEFAULT entrance
const GLIDE  = Easing.bezier(0.22, 1, 0.36, 1);  // easeOutQuint — softer, long travel
const SWEEP  = Easing.bezier(0.65, 0, 0.35, 1);  // easeInOutCubic — on-screen A→B moves only
const LEAVE  = Easing.bezier(0.5, 0, 0.75, 0);   // easeInQuad — exits only
const SNATCH = Easing.bezier(0.7, 0, 0.84, 0);   // easeInQuart — whip-outs, hard cuts
const DRIFT  = Easing.linear;                    // constant motion ONLY: camera drift, marquee, ticker
```

Never `easeInOut` on an entrance and never `linear` on an entrance: ease-in starts slow at exactly the
moment the eye is watching, and constant velocity has no mass.

### Spring vocabulary

```ts
const SNAP     = {damping: 24, stiffness: 155, mass: 1};    // 0 % overshoot, settles 10 f
const MICRO    = {damping: 22, stiffness: 220, mass: 0.7};  // 0.2 %,  8 f — ticks, chips
const SETTLE_S = {damping: 20, stiffness: 165, mass: 1};    // 2 %,   12 f — DEFAULT
const POP      = {damping: 18, stiffness: 190, mass: 1};    // 6.7 %, 13 f — badges
const BOUNCE   = {damping: 15, stiffness: 200, mass: 1};    // 14 %,  16 f — playful, once per effect
const FLOAT    = {damping: 22, stiffness: 120, mass: 1.4};  // 0.6 %, 15 f — heavy objects
```

**Never ship bare `spring({frame, fps})`.** The default is 16 % overshoot over 24 frames and is the
single most common tell of an unstyled Remotion video. `{damping: 200}` inside
`springTiming({config, durationInFrames})` is a different, correct idiom: the duration is fixed there,
so damping 200 only means "shaped like a spring, never overshoots".

### Duration bands

micro **6–10 f** (a tick, a digit flip, a chip) · standard **15–20 f** (a card entering, a bar
growing) · hero **30–45 f** (a title lock-up, a camera push) · ambient **≥90 f, looping** (grids,
auroras, drift). Pick a band and stay in it; a 23-frame entrance reads as neither.

### Safe area

`const SAFE = 84;` at 1920×1080. Vertical 1080×1920: `SAFE_X 84`, `SAFE_TOP 240`,
`SAFE_BOTTOM 380` (platform UI). Only full-bleed grounds, wipes and letterbox bars cross it.

### Light and dark ground

Every effect takes a `backgroundColor` prop and **derives** its foreground from it. Inline these six
lines rather than hard-coding `#ffffff`:

```ts
const isDark = (hex: string) => {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) < 0.18;
};
const ink    = isDark(backgroundColor) ? '#FFFFFF' : '#1D1B17';
const muted  = isDark(backgroundColor) ? '#8D93A5' : '#4A4E5A';
const accent = accentColor ?? (isDark(backgroundColor) ? '#FF5C39' : '#C2410C');
```

Effects where a light ground is physically wrong — additive glow, particle fields, 3D — keep their
studio look and declare `ground: 'dark'` in their metadata instead of faking it.

---

### The 12-point premium checklist — an effect ships only if all pass

1. A named easing or spring on **every** entrance.
2. Exits use `LEAVE` or `SNATCH` and are ~20 % shorter than the matching entrance.
3. **Nothing scales from 0.** Entrances start at 0.92–1.08 — 0.92–0.97 rising, or 1.04–1.08 settling
   down. Nothing in the real world appears from nothing.
4. Overshoot is 0 or ≤ 7 %, and at most one element in the frame overshoots.
5. Stagger 2–3 frames, total span ≤ 12 frames.
6. In any 10-frame window, **one property carries the motion**; everything else is ≤ 10 % secondary.
7. Anything travelling > 25 % of frame width in < 8 frames gets `<CameraMotionBlur>` or `<Trail>`
   from `@remotion/motion-blur`.
8. Duration sits in a named band (micro / standard / hero / ambient).
9. Type is on the scale; nothing below `SMALL` except uppercase `EYEBROW` and dense data layers.
10. One accent, from the six — or a `// palette: brand-mimicry <name>` line.
11. Everything that must be read sits inside `SAFE`.
12. It reads at **0.17× card scale and at 100 %**. Check the poster frame, not just the video.
