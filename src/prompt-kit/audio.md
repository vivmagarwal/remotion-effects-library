## Audio: reading a real file, and drawing it

### The one that ruins every spectrum

**`visualizeAudio` returns bins spaced LINEARLY from 0 Hz to Nyquist.** Hearing is logarithmic. Draw
one bar per bin and you get a tall left edge decaying into a flat dead zone — the "broken analyser"
look — because on any real music everything audible sits in the bottom few per cent of the range.
Measured: at 44.1 kHz with `numberOfSamples: 1024`, each bin is 21.5 Hz, so **1 kHz is bin 46 of
1024** — the kick, the bass and the fundamental of most voices live in the first 4.5 % of your bars
and the other 95 % never move. Re-bucket into octave bands. §3 has the code.

---

### 1. Loading

```tsx
import {useAudioData, visualizeAudio, getWaveformPortion} from '@remotion/media-utils';
import {Audio} from '@remotion/media';
```

`npx remotion add @remotion/media-utils @remotion/media`.

```tsx
const audioData = useAudioData(staticFile('audio/music-bed.mp3'));
```

Verified signature: `useAudioData(src: string, options?: {sampleRate?, requestInit?})
=> MediaUtilsAudioData | null`. It **returns `null` on the first render** while the file is fetched —
handle that branch, do not `!`-assert it. The shape:

```ts
type MediaUtilsAudioData = {
  channelWaveforms: Float32Array[];   // one per channel, samples in -1..1
  sampleRate: number;                 // e.g. 44100
  durationInSeconds: number;
  numberOfChannels: number;
  resultId: string;
  isRemote: boolean;
};
```

**Duration.** Inside a component, read `audioData.durationInSeconds` — it is already there, it is
synchronous once loaded, and it costs nothing extra. `getAudioDurationInSeconds(src): Promise<number>`
also exists in `@remotion/media-utils` and works, but it is **marked `@deprecated` in 4.0.522** ("Use
Mediabunny instead") and it is async, which means `useDelayRender()` and a fetch you did not need.
Use it only in a build script, never in a component. There is one place its async form is the right
tool: computing an SFX's length at authoring time so a riser can *end* on a cut — and for the shipped
rack, §4 already lists the numbers.

`useWindowedAudioData({src, frame, fps, windowInSeconds, channelIndex?})` is the variant for long
files: it decodes a moving window instead of the whole track and returns
`{audioData, dataOffsetInSeconds}` — pass that offset straight into `visualizeAudio`'s
`dataOffsetInSeconds`.

### 2. `visualizeAudio` — the exact contract

```tsx
const linear = visualizeAudio({
  audioData, frame, fps,
  numberOfSamples: 1024,     // must be a power of two
  optimizeFor: 'accuracy',   // 'accuracy' | 'speed'
  smoothing: true,           // default: averages frames -1, 0, +1
  dataOffsetInSeconds: 0,
});
```

- It runs an FFT of size `numberOfSamples * 2` and returns the first half of the magnitudes, so
  **`linear.length === numberOfSamples`** exactly. (An FFT size that is not a power of two throws
  `The argument "bars" must be a power of two`, so `numberOfSamples` must be one too.)
- Bin `k` covers `[k · Nyquist / N, (k+1) · Nyquist / N]` where `Nyquist = sampleRate / 2`. Verified
  empirically: a 1 kHz tone at 48 kHz with `numberOfSamples: 1024` peaks at bin 42.
- Values are normalised magnitudes, roughly 0…1, but not guaranteed to reach 1.
- `smoothing: true` costs three FFTs per frame. Turn it off for a deliberately twitchy look.
- **Your placeholder array while `audioData` is `null` must be `numberOfSamples` long**, not half that
  — a shorter placeholder makes your Hz-per-bin arithmetic wrong on the loading frame.

### 3. Re-bucketing into octave bands

This is the fix, and it is two corrections, not one: octave bucketing puts the bands where the ear is,
and a pink-noise tilt puts the top bands back on an even footing (music loses roughly 3 dB per octave
going up, so even correctly-bucketed high bands stay short).

```tsx
/**
 * Re-bucket linear FFT bins into `count` octave-spaced bands between 40 Hz and 16 kHz.
 * Each band takes the PEAK of the bins inside it, not the mean: a mean across a wide
 * high band averages one loud hi-hat partial with a lot of silence and reads as nothing.
 * Bands narrower than one bin fall back to the single bin they land on, so the low end
 * never renders empty.
 */
const toLogBands = (linear: readonly number[], count: number, nyquist: number): number[] => {
  const LOW = 40;
  const HIGH = 16000;
  const hzPerBin = nyquist / linear.length;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const from = LOW * Math.pow(HIGH / LOW, i / count);
    const to = LOW * Math.pow(HIGH / LOW, (i + 1) / count);
    const lo = Math.min(linear.length - 1, Math.floor(from / hzPerBin));
    const hi = Math.min(linear.length - 1, Math.max(lo, Math.ceil(to / hzPerBin) - 1));
    let peak = 0;
    for (let b = lo; b <= hi; b++) peak = Math.max(peak, linear[b]);
    // +3 dB per octave above the lowest band — the pink-noise tilt.
    out.push(peak * Math.pow(2, (Math.log2(from / LOW) * 3) / 6));
  }
  return out;
};

const nyquist = (audioData?.sampleRate ?? 44100) / 2;
const bands = toLogBands(linear, bars, nyquist);
```

Then a **perceptual gamma** on the drawn height, because the ear is logarithmic and the output of the
FFT is not: `Math.pow(v, 0.42)` is the working default — lower is livelier, higher is calmer. Give the
bar a floor (`Math.max(6, shaped * H)`) so the row never collapses to nothing between transients.

Below about 16 bands it reads as a level meter rather than as a spectrum; 32–64 is the usual range.
Above ~96 bars at 1920 wide each bar is under 20 px and the row reads as a texture, not as data.

**Waveforms, not spectra:** `getWaveformPortion({audioData, startTimeInSeconds, durationInSeconds,
numberOfSamples, channel?, normalize?})` returns `{index, amplitude}[]` — that is the right tool for a
scrubber, an audiogram bar row, or a static waveform. `visualizeAudioWaveform({audioData, frame, fps,
windowInSeconds, numberOfSamples, …})` is its per-frame form, and `createSmoothSvgPath({points})`
turns points into a smooth `d`.

### 4. The SFX rack this library ships

`public/audio/sfx/`, referenced with `staticFile('audio/sfx/whoosh.mp3')`. Durations measured with
`npx remotion ffprobe`; frames are at 30 fps.

| file | duration | frames | level vs dialogue | where its transient goes |
|---|---|---|---|---|
| `whoosh.mp3` | 0.627 s | 19 | −10…−6 dB | **starts 10 f before the cut**, peak on the cut |
| `riser.mp3` | 2.038 s | 61 | −24 dB → −8 dB | **ENDS on the cut** → `from={CUT - 61}`, no tail |
| `impact.mp3` | 1.541 s | 46 | −4…0 dB, loudest in the mix | transient **1 f before** the impact frame |
| `sub-drop.mp3` | 1.646 s | 49 | −8 dB; high-pass the music 200 Hz under it | on the title's landing frame |
| `chime.mp3` | 1.149 s | 34 | −14 dB | on the frame the thing confirms |
| `shutter.mp3` | 0.313 s | 9 | −12 dB | on the capture frame |
| `swish.mp3` | 0.261 s | 8 | −14 dB | 1 f before a small element moves |
| `pop.mp3` | 0.235 s | 7 | −16 dB | 1 f before the scale animation starts |
| `key.mp3` | 0.157 s | 5 | −20 dB, ±2 dB per key | on the frame the character appears |
| `click.mp3` | 0.131 s | 4 | −20 dB | on the frame the control changes state |

`audio/music-bed.mp3` is **42.266 s**, 92 BPM, Am9–Fmaj7–Cmaj7–G6, building every 4 bars. One bar is
2.609 s ≈ **78 frames**; musical cut points sit on multiples of 78 from the first downbeat.

**Universal rules.** The transient lands **1–3 frames before** the visual event, never on it — audio
early reads as anticipation, audio late reads as an error. **Never more than 3 SFX in a 15-frame
window.** A one-shot is a `<Sequence>` with a `from`, which is frame-exact and mixed deterministically:

```tsx
const CUT = 96;
<Sequence from={CUT - 10} name="whoosh">
  <Audio src={staticFile('audio/sfx/whoosh.mp3')} volume={0.5} />
</Sequence>
```

### 5. Volume is a function of frame

`volume` on `<Audio>` and `<Video>` takes `number | ((frame: number) => number)`, and the callback
receives the frame **relative to that clip's own start**, not the composition frame.

```tsx
<Audio src={staticFile('audio/music-bed.mp3')}
       volume={(f) => interpolate(f, [0, 1 * fps], [0, 0.6], {extrapolateRight: 'clamp'})} />
```

Crossfade with **equal power** — `Math.sqrt(t)` and `Math.sqrt(1 - t)`, never two linear ramps, which
sum to an audible dip in the middle. Duck in the **dB** domain and convert at the end
(`10 ** (db / 20)`); interpolating linear gain sounds like it ducks late and recovers early.

---

### Before you ship an audio effect

- [ ] `useAudioData` returning `null` is handled, with a placeholder array of exactly
      `numberOfSamples` entries.
- [ ] `numberOfSamples` is a power of two.
- [ ] Bins are re-bucketed into octave bands — the bars move independently instead of sloping.
- [ ] The check frame lands on a **loud** moment: a spectrum rendered during a quiet bar is a row of
      stubs and proves nothing.
- [ ] Every SFX transient is 1–3 frames early, and no 15-frame window holds more than 3.
