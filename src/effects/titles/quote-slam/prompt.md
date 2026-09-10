Build a Remotion composition called **QuoteSlam**: a pull quote that lands rather than fades.

**Setup**

```bash
npx remotion add @remotion/google-fonts
```

**What makes it a slam**
Three things have to land in the *same short window*, or it reads as an ordinary fade-in:

1. the line snaps in on a spring that **overshoots**,
2. the whole frame **kicks** the other way,
3. a **flash** blooms behind it.

They do not peak on one frame, and pretending they do will lead you astray. For this spring
(`damping: 12, stiffness: 200, mass: 0.8`) the damped frequency is ~13.9 rad/s, so the overshoot
peaks **π/ω ≈ 6.8 frames after landing**. The kick decays with τ = 3.5 frames and is spent before
then. So the flash is timed to meet the *overshoot*, not the contact — peaks at `lastLanding + 7`.
The window where all three are simultaneously visible is roughly `lastLanding + 4 … + 9`.

**The lines**
Split on `\n` so the line breaks stay a typographic decision instead of something that reflows:

```tsx
const lines = quote.split('\n');

const landing = (i: number) =>
  spring({
    frame: frame - (startAt + i * lineStagger),
    fps,
    config: {damping: 12, stiffness: 200, mass: 0.8},   // damping 12 → real overshoot
  });
```

**Hide unstarted lines — do not unmount them.** This is the single biggest trap in the effect. The
lines sit in a vertically centred column, so `return null` frees the box, the column re-centres, and
every line that has already landed **jumps ~60px upward**. The kick is ~10px. You would be shipping
a reflow six times larger than the effect itself, on exactly the frames that matter:

```tsx
const p = landing(i);
const waiting = p <= 0.001;
// …and on the style object:
visibility: waiting ? 'hidden' : 'visible',
```

Each line:

```tsx
style={{
  fontSize,                       // 104
  lineHeight: 1.12,               // NOT 1 — a serif this size clips its descenders
  fontWeight: 500,
  letterSpacing: '-0.02em',
  color: textColor,
  // The spring peaks at p ≈ 1.18, so this tops out around 1.026 — a 2.6%
  // overshoot. Small on purpose: larger reads as a bounce, not an impact.
  scale: 0.86 + p * 0.14,
  translate: `${(1 - p) * -26}px 0px`,
  opacity: Math.min(1, p * 2.2),
  transformOrigin: 'left center',
}}
```

**The kick — a decaying impulse, summed**

```tsx
const kick = lines.reduce((acc, _, i) => {
  const hit = frame - (startAt + i * lineStagger);
  if (hit < 0) return acc;
  // Sharp at contact, gone in ~10 frames. Later lines hit harder.
  return acc + Math.exp(-hit / 3.5) * Math.sin(hit * 0.9) * (6 + i * 2.5);
}, 0);
```
Summing rather than taking the latest means overlapping landings **compound**. Apply it to a wrapper
`<AbsoluteFill style={{translate: `0px ${-kick * 1.15}px`}}>` containing the quote, its background
gradient *and* the quote mark — moving only the text reads as a wobble, not a hit.

That multiplier matters. The raw impulse peaks around ±9, so `1.15` gives roughly **±10px** on a
1080p frame. At `0.35` the kick is ±3px — genuinely present, but you cannot see it in a still and it
is under a pixel and a half at `--scale=0.4`.

**The flash**
Peaks exactly as the final line lands, and sits **outside** the kicked wrapper so it does not move:

```tsx
const lastLanding = startAt + (lines.length - 1) * lineStagger;
// Peaks at +7 to meet the spring's overshoot, not at contact.
const flash = interpolate(frame, [lastLanding + 1, lastLanding + 7, lastLanding + 24], [0, 0.5, 0],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

<AbsoluteFill style={{backgroundColor: '#ffffff', opacity: flash,
                      mixBlendMode: 'overlay', pointerEvents: 'none'}} />
```

**The scene**
- 1920×1080, 30fps, **150 frames**. Background `#0b0b10`, and inside the kicked wrapper a
  `radial-gradient(ellipse at 50% 46%, <accentColor>1c 0%, transparent 64%)`.
- Content vertically centred, `padding: '0 132px'`, `fontFamily` = Playfair Display.
- An oversized quote mark (`&ldquo;`) in **Playfair Display**, absolutely at `left: 74, top: 118`,
  `fontSize: 300`, `lineHeight: 1`, weight 700, in `accentColor`, fading `0.08 → 0.22` over frames
  0–18. It goes **inside** the kicked wrapper — it is scene texture and should take the hit. It
  starts at 0.08 rather than 0 so frame 0 is not an empty frame.

**The attribution**
**One row that fades as a unit**, `gap: 22`, `align-items: center`, `margin-top: 46`. Fading only the
text leaves an orange dash sitting next to a ghost:

```tsx
// Same window as the fade below. That ease covers ~91% in its first third, so
// on a different window the rule finishes long before the text it belongs to.
const ruleWidth = interpolate(frame, [lastLanding + 10, lastLanding + 30], [0, 148],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
```
- the rule: `width: ruleWidth`, `height: 3`, `backgroundColor: accentColor`, and **`flexShrink: 0`**
  — an animated width in a flex row is compressible, and a longer author name squeezes it
- author: Inter 34px weight 700, `textColor`
- role: Inter 26px weight 500, `#8b8b98`, `margin-top: 4`
- the whole row (rule included) fades in over frames `lastLanding + 10 → lastLanding + 30`

**Fonts**

```tsx
import {loadFont as loadSerif} from '@remotion/google-fonts/PlayfairDisplay';
import {loadFont as loadSans}  from '@remotion/google-fonts/Inter';
const {fontFamily: serif} = loadSerif('normal', {weights: ['500', '700'], subsets: ['latin']});
const {fontFamily: sans}  = loadSans('normal',  {weights: ['500', '700'], subsets: ['latin']});
```

**Requirements**
- One self-contained `.tsx` file exporting `QuoteSlam`.
- Props, with defaults: `quote`
  (`'We stopped\nrendering videos\nand started\nprogramming them.'`), `author` (`'Jonny Burger'`),
  `role` (`'Creator of Remotion'`), `lineStagger` (7), `startAt` (12), `accentColor` (`#ff5c39`),
  `backgroundColor` (`#0b0b10`), `textColor` (`#f6f4ef`), `fontSize` (104).
