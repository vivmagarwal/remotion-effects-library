Build a Remotion composition called **Audiogram** (composition id `audiogram`): the podcast-clip
format — cover art, a live waveform, and word-timed captions.

**Setup**

```bash
npx remotion add @remotion/media @remotion/media-utils
```

Put an mp3 in `public/` and reference it with `staticFile()`.

**One file drives everything**

```tsx
const audioData = useAudioData(source);
const spectrum = audioData
  ? visualizeAudio({audioData, frame, fps, numberOfSamples: 128})
  : new Array(64).fill(0);
```

- **`useAudioData()` returns `null` on the first render** while the file loads. Handle it or the
  composition crashes on the very first frame of every render.
- `numberOfSamples` must be a power of two; you get back half that many bands. Use the low third —
  the top of the spectrum is near-silent on speech and gives you a row of dead bars.
- Render `<Audio src={source} />` as well; `visualizeAudio` only reads the data, it does not play it.
- Because the waveform and the captions both come from the same file's timeline, they cannot drift.
  Driving the bars from a sine and the words from timings is the usual shortcut and it desynchronises
  visibly within a few seconds.

**Gamma-correct the bars**

```tsx
const shaped = Math.pow(v, gamma);            // gamma ≈ 0.42
height: Math.max(14, shaped * 430),
```

`visualizeAudio` returns **linear** amplitudes and hearing is roughly logarithmic. Drawn linearly the
bars barely move except on peaks. `Math.max(14, …)` keeps a visible stub so silence reads as bars at
rest rather than as gaps.

**Symmetric bars**
Lay the bars out in a flex row with `align-items: center` and let each one grow from its own centre.
That symmetry around a shared axis is what makes it read as a waveform; bars sitting on a baseline
read as a bar chart.

**The layout**
- **1080×1920 (vertical)**, 30fps, 180 frames. Background `#0d0f16` with
  `radial-gradient(ellipse at 50% 22%, #c6ff3d18 0%, transparent 62%)`. Padding `120px 90px`.
- **Cover art**: a 420px square, radius 34, filled with
  `linear-gradient(145deg, #c6ff3d, #12c48b 55%, #0aa06e)` and a heavy shadow. Generating it as a
  gradient rather than loading an image keeps the effect dependency-free — swap in a `<CanvasImage>`
  when you have real art.
- Show name at 30px weight 700, `letter-spacing: 0.34em` (with a matching `marginRight: '-0.34em'` so
  the tracked line stays optically centred); episode title at 38px in `#8e94a6`.
- **Captions in the middle**, between the art and the waveform — that is where the eye lands. Pages of
  four words at 66px weight 800; the spoken word takes the accent colour, words not yet reached sit at
  `opacity: 0.34` so the viewer can read ahead.
- Waveform at the bottom: 34 bars, 14px wide, 10px apart, radius 7. A progress rail under it.

**Requirements**
- One self-contained `.tsx` file exporting `Audiogram` and a `Word` type
  (`{text, start, end}`, seconds — the shape `@remotion/captions` produces from a transcription).
- Props: `src`, `show`, `episode`, `words`, `wordsPerPage`, `accentColor`, `backgroundColor`, `bars`,
  `gamma`.
- Load Inter via `@remotion/google-fonts/Inter`.
