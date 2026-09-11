Build a Remotion composition called **MusicDuck** (composition id `music-duck`): a music bed getting
out of the way of a voice, with the envelope computed from the transcript rather than from the audio.

**Setup**

```bash
npx remotion add @remotion/media @remotion/media-utils @remotion/google-fonts
```

**Why the transcript and not a sidechain compressor**

A compressor reacts to what it has *already heard*, so it is late by its own attack time, every time.
It also cannot tell a breath from a word, or a cough from a sentence. Word timings are exact, they come
free with any word-level ASR, and — the part that matters — they are known **in advance**, which is
the one thing a real-time compressor can never have. Look-ahead is not a feature you bolt on; it is
what you get for free the moment the envelope is a pure function of data you already hold.

**Four numbers, and each one is a specific mistake**

| knob | value | the mistake |
|---|---|---|
| look-ahead | **150 ms** | Start the duck *on* the first word and its first syllable lands on top of full-level music — exactly the moment the audience needed to hear it. |
| release | **450 ms** | Shorter than this and the bed pumps: it surges into every gap between sentences and the mix breathes like a bad radio edit. Always longer than the attack. |
| hold | **800 ms** | Gaps shorter than this must not un-duck at all. Without a hold the bed rises into every comma, which is the loudest possible signal that a mix was automated. |
| duck depth | **−14 dB** | −12 to −16 is the band. Less and the voice fights the bed; more and the bed disappears, which defeats having one. |

**Build it as regions, not as per-word ramps.** The hold *is* the merge:

```tsx
const regions = useMemo(() => {
  const merged = [];
  for (const w of words) {
    const last = merged[merged.length - 1];
    if (last && w.s - last.e < holdMs / 1000) last.e = Math.max(last.e, w.e);
    else merged.push({s: w.s, e: w.e});
  }
  return merged;
}, [words, holdMs]);
```

**Interpolate in dB, not in amplitude.** Loudness is logarithmic. A linear ramp from 1.0 to 0.2 spends
most of its travel in the first third and then crawls, which is heard as a lurch followed by a hang.
Ramp 0 dB → −14 dB linearly and convert **once, at the end**:

```tsx
const dbToGain = (db) => 10 ** (db / 20);
```

**`volume` takes a function.** `VolumeProp = number | ((frame: number) => number)`, and the frame it
hands you is the frame inside the **media's own sequence** — so fold any window offset in once, where
the envelope is built, not at every call site.

```tsx
<Audio src={musicSrc} volume={(f) => dbToGain(bedDb + envelopeDb[Math.min(f, envelopeDb.length - 1)])} />
<Audio src={voiceSrc} />
```

Precompute `envelopeDb` as an array indexed by frame in a `useMemo`. It is a pure function of the
transcript and the four knobs; recomputing it inside `volume` runs it once per media frame.

**Drawing it: the picture should BE the mix**

`useAudioData(src)` returns `{channelWaveforms: Float32Array[], sampleRate, durationInSeconds, …}`, or
**`null` on the first render while the file loads** — render a placeholder, do not reach into
`.channelWaveforms` and crash.

Downsample to ~480 buckets with a **peak** per bucket, not a mean. A mean averages a drum hit away;
a peak is what an editor sees in a timeline.

**Window the waveform to the composition.** `channelWaveforms` holds the *whole file*, and the bed is
42 s against a 12 s composition. Draw all of it and the music lane sits on a different horizontal
clock from the voice lane and the envelope under it, so a dip lines up with nothing — which quietly
destroys the only reason to draw three lanes. Slice to
`Math.round((durationInFrames / fps) * data.sampleRate)` samples first. Then draw the music lane **scaled by the envelope**, so
the waveform on screen is the level the duck leaves it at — not a waveform with a separate curve
drawn near it.

**The look**

- 1920×1080, 30 fps, 360 frames. Ground `#04050a`. Inter at 500/700/800.
- Readout pill top-left at `84, 84`, `padding: 18px 28px`, radius `theme.radius × 12/18`, the theme's
  `bg` at 0.72,
  `backdropFilter: 'blur(18px) saturate(1.3)'`, `1px solid rgba(255,255,255,0.14)`, `minWidth: 640`.
  `BED DUCKED` / `BED MOVING` / `BED OPEN` at 34px/800 `letter-spacing: 0.16em` in `#ff5c39`; the
  current level at 34px/500 `#eef1f7` with `fontVariantNumeric: 'tabular-nums'`; the four knobs at
  34px/500 `#8d93a5`.
- Two waveform lanes from `top: 300`, 210px tall, 40px apart: the bed in the theme's `pair`
  (`#4cc9f0`), the voice in the theme's `paper` (`#f6f5f2`). Bars 0.7 units wide on a 480-unit viewBox with `preserveAspectRatio="none"`. Everything
  before the playhead at 0.95 opacity, everything after at 0.34.
- **Draw the merged regions behind the envelope**, as bands in `accentColor` at `fillOpacity` 0.16 on
  the same frame axis. Twenty-five words become two bands, and that merge *is* the hold — undrawn, the curve looks
  like something keyframed by hand rather than derived.
- Top-right, in `#8d93a5` with the first line in `#eef1f7`: *"A compressor reacts to what it has
  already heard. 25 word timings are known in advance, which is the one thing it can never have."*
- The envelope under both at `bottom: 96`, 120px tall, `viewBox="0 0 <durationInFrames> 120"` so the
  x-axis is *frames* and a dip lines up with the words that caused it. `strokeWidth: theme.stroke ×
  5/3` (5 at house) with `vectorEffect="non-scaling-stroke"`, because the viewBox is anisotropic and a
  plain stroke would be squashed to a thread. A hairline at 0 dB and a playhead in the theme's `paper`
  (`#f6f5f2`).

**Requirements**

- One self-contained `.tsx` file exporting `MusicDuck`.
- Props with these exact defaults: `musicSrc` `staticFile('audio/music-bed.mp3')`, `voiceSrc`
  `staticFile('audio/voice-interview.mp3')`, `words` (a real Deepgram response inlined, 25 words over
  12 s, `{w, s, e}` in seconds), `duckDb` `-14`, `lookAheadMs` `150`, `releaseMs` `450`, `holdMs`
  `800`, `bedDb` `-6`, `showDebug` `true`, `accentColor` `'#ff5c39'`, `backgroundColor` `'#04050a'`.
- **Leave the ASR's mistakes in.** `How` spans 3.14 → 4.42 s — a 1.28 s word, because Deepgram
  mis-attributed the tail of an answer — and the duck therefore holds about 1.5 s longer than the
  voice needs it to. That is the honest cost of driving a mix from a transcript, and nothing
  downstream can detect it: the envelope is exactly as correct as its input. Say so, rather than
  cleaning the fixture and shipping a demo that cannot fail.
- Keep the transcript's one long pause in the window. A duck demo without a gap long enough to release
  into shows a bed that goes down and stays down, which proves nothing.
