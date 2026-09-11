Build a Remotion composition called **FftBars**: FFT bars reacting to a real audio file.

**Setup**

```bash
npx remotion add @remotion/media @remotion/media-utils
```

Put an mp3 in `public/` and reference it with `staticFile('audio/music-bed.mp3')`.

**Reading the audio**

```tsx
import {Audio} from '@remotion/media';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';

const audioData = useAudioData(source);
const spectrum = audioData
  ? visualizeAudio({audioData, frame, fps, numberOfSamples: 128})
  : new Array(64).fill(0);
```

- **`useAudioData()` returns `null` on the first render** while the file is being fetched. You must
  handle that — mapping over `null` crashes the composition, and it will crash on the very first frame
  of every render.
- `numberOfSamples` must be a **power of two**, and you get back `numberOfSamples / 2` bands.
- Use the low two-thirds of the bands. On real music the top of the spectrum is near-silent, so
  including it gives you a row of dead bars on the right.
- Also render `<Audio src={source} />` so the sound is actually in the output — `visualizeAudio` only
  reads the data, it does not play anything.

**The detail that makes it look alive**

```tsx
const shaped = Math.pow(v, gamma);   // gamma ≈ 0.42
const h = Math.max(6, shaped * 1450);
```

`visualizeAudio` returns **linear** amplitudes, and human hearing is roughly logarithmic. Drawn
linearly, the bars sit near zero and only twitch on the loudest peaks. Raising each band to a power
below 1 lifts the quiet detail and is the difference between a visualiser that dances and one that
looks broken. `Math.max(6, …)` keeps a visible stub so silent bands read as bars at rest rather than
as gaps.

**The look**
- 1920×1080, 30fps, 180 frames. Background `theme.bgDeep` (`#04050a`) with
  `radial-gradient(ellipse at 50% 50%, ${colors[0]}18 0%, transparent 62%)`. Sora throughout.
- A track title in `displayFamily` (default: the theme's `display` face; Sora as authored) at 74px
  weight 700, an uppercase artist line at 30px with `letter-spacing: 0.28em`.
- 48 bars, 16px wide, 7px gap, radius `theme.radius × 8/18` (8 at house), filled with a vertical
  `linear-gradient(colors[0], colors[1])`, with `colors` defaulting to
  `[theme.series[1], theme.series[4]]` (`#4cc9f0`, `#c77dff` at house), opacity ramping `0.45 → 1`
  left to right, and a glow (`0 0 22px ${colors[0]}77`) only on bands above 0.35 — so peaks light up
  and the rest stays clean.
- A 1180×5 progress rail below, filling across the composition.

**Requirements**
- One self-contained `.tsx` file exporting `FftBars`.
- Props: `src`, `title`, `artist`, `displayFamily`, `bars`, `colors` (a two-colour tuple),
  `backgroundColor`, `gamma`.
- Load Sora via `@remotion/google-fonts/Sora`.
- For a waveform instead of bars, `getWaveformPortion()` from the same package gives you time-domain
  samples you can feed into an SVG path.
