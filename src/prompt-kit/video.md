## Editing real footage

### The four things that are wrong in most Remotion video code

1. **`trimBefore` and `trimAfter` are FRAME COUNTS, not seconds.** At 30 fps, `trimBefore={60}` skips
   the first 2 seconds. Verified in `@remotion/media`: the player computes
   `timeInSeconds + (trimBefore ?? 0) / fps`. (If you have the `remotion-markup` agent skill
   installed, its `embedding-videos.md` says "values are in seconds" — that sentence is wrong; its own
   example passes `2 * fps`. Trust this block.)
2. **`playbackRate` is read once per clip.** Animating it does not make a speed ramp. See §4.
3. **`playbackRate` pitches the audio with it.** Use `muted` + a separate un-ramped `<Audio>`.
4. **Cut points are integers, converted once.** Never compute a cut from a float second value inside
   the render. `const CUT_IN = 102; // Math.round(3.40 * 30)`. Hard-coded integers are what make a
   clip draggable in the Studio timeline and what make two renders identical.

---

### 1. `<Video>` and `<Audio>` — the verified prop surface

```tsx
import {Video, Audio} from '@remotion/media';
import {staticFile, useVideoConfig} from 'remotion';
```

Not from `remotion` — that exports the older `Video`/`Audio`/`OffthreadVideo`. Install with
`npx remotion add @remotion/media`.

Verified `VideoProps` in 4.0.522 (`@remotion/media/dist/video/props.d.ts`):

```
src (required)
trimBefore, trimAfter          frames into the SOURCE
from, durationInFrames         position and length on the TIMELINE (it is its own <Sequence>)
freeze, hidden, name, showInTimeline
cropLeft, cropRight, cropTop, cropBottom     fractions 0..1
premountFor, postmountFor, styleWhilePremounted, styleWhilePostmounted
style, className, objectFit ('fill'|'contain'|'cover'|'none'|'scale-down')
effects                        an array of @remotion/effects descriptors — see §11
playbackRate, volume, muted, toneFrequency, loop, loopVolumeCurveBehavior, audioStreamIndex
onVideoFrame, onError, headless, debugOverlay
credentials, requestInit, delayRenderRetries, delayRenderTimeoutInMilliseconds
fallbackOffthreadVideoProps, disallowFallbackToOffthreadVideo
```

**`objectFit` is a PROP, never a style.** `<Video>` decodes into a canvas, so CSS `object-fit` in
`style` (or an `object-*` class name) has nothing to act on. The package logs a warning and otherwise
does nothing, and the failure is silent whenever the source and the composition happen to share an
aspect ratio — it only appears the day someone puts 16:9 footage in a 9:16 frame and gets a
letterboxed strip.

```tsx
<Video src={…} objectFit="cover" style={{width: '100%', height: '100%'}} />   // ✅
<Video src={…} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> // ❌ silently ignored
```

There is no `objectPosition` equivalent: `cover` centres, and you bias the crop with
`cropLeft`/`cropRight`/`cropTop`/`cropBottom`, which take fractions. And `cover` needs a definite box
to crop against — `AbsoluteFill` is a **column flex container**, so a bare `<Video>` inside one is a
flex item that takes its intrinsic aspect. Wrap it in its own `<AbsoluteFill>`.

`AudioProps` is the same minus the picture props.

`<Video>` **is** a `<Sequence>`: give it `from` and `durationInFrames` directly rather than wrapping
it. Its on-screen length, when you set `trimAfter`, is exactly
`(trimAfter − trimBefore) / playbackRate` frames — verified in `calculateMediaDuration`.

**`premountFor`.** A clip that starts on a cut has not decoded yet. Mount it early and invisible:

```tsx
<Video src={staticFile('footage/broll-earth.mp4')} from={120} durationInFrames={90}
       premountFor={fps} styleWhilePremounted={{opacity: 0}} />
```

### 2. Reframing and cropping — what the crop props really do

`cropLeft/cropRight/cropTop/cropBottom` **do exist** on `<Video>` (and on `<Sequence>` and every
`<Interactive.*>`) in 4.0.522. They are fractions from 0 to 1, they are clamped, and if one axis'
pair sums above 1 both sides fall back to 0.5. They compile to
`clipPath: inset(top% right% bottom% left%)` on the element.

**So they mask — they do not zoom.** `cropLeft={0.25} cropRight={0.25}` on a 1920-wide video inside a
1920-wide composition gives you a 960-wide picture with 480 px of empty ground either side; it does
not fill the frame with the middle half. That is the single most common misuse.

A real 16:9 → 9:16 reframe therefore needs the crop **and** a scale, or — simpler and easier to
animate — an `overflow: hidden` wrapper with the video scaled and offset inside it:

```tsx
// 1080x1920 composition, 1920x1080 source, subject 42% across the SOURCE frame.
const SUBJECT_X = 0.42;
const SCALE = 1920 / 1080;          // fill the composition's height -> 1.7778
const W = 1920 * SCALE;             // 3413px of scaled video, of which 1080 is visible

<AbsoluteFill style={{overflow: 'hidden'}}>
  <Video
    src={staticFile('footage/interview.mp4')}
    style={{
      position: 'absolute',
      top: 0,
      width: W,
      height: 1920,
      // 540 - 0.42 * 3413 = -893: puts the subject on the vertical centre line.
      left: 1080 / 2 - SUBJECT_X * W,
    }}
  />
</AbsoluteFill>
```

Animate `SUBJECT_X` from the frame and you have a tracking reframe. Clamp it to
`[540 / W, 1 - 540 / W]` or the empty ground either side of the video slides into shot.

Use the crop props when you want a *mask* that the Studio can keyframe (a letterbox, a wipe-reveal of
a clip, a split-screen pane). Use the wrapper when you want a *reframe*.

### 3. Camera moves on footage

A punch is `scale` on the `<Video>`'s own style, inline, driven by `frame`, with
`output: 'perceptual-scale'`. `transformOrigin` goes on the subject, not the frame centre — real
punch-ins are toward a face that is rarely centred.

| move | scale | duration | curve |
|---|---|---|---|
| **Invisible jump-cut punch** | hard cut 1.00 → 1.04 (the 2–5 % band) | **0 frames — it is a cut** | none |
| **Emphasis punch** | 1.00 → 1.12 | 6–8 f, `SETTLE` | land the **end** on the stressed syllable |
| **Slam** | 1.00 → 1.25, then 6 f back to 1.06 | 3–4 f | needs an impact SFX |
| **Creep / dolly** | ~1.2 %/s across the whole shot | whole shot | **linear** — an ease on a camera move reads as a stumble |
| **Dolly out** | 1.10 → 1.00 over 3–4 s | whole shot | linear |

Rules: alternate punch levels and never repeat the same level twice in a row (this is what makes 40
jump cuts invisible); alternate creep direction shot to shot; keep both ends of a creep above 1.0 if
you also pan, or the frame edge slides into view; never exceed ~1.35× on 1080p source in a 1080p
composition or it goes soft.

**Handheld** is two octaves of `noise2D` from `@remotion/noise` at a 3:1 frequency ratio, the second
at 30 % amplitude, decorrelated seeds per axis, **rotation lagging translation by 4 frames**, and
overscan of `1 + 2 * maxAmplitude / height`. The lag is the detail that sells it.

```tsx
const t = frame * 0.03;
const dx = noise2D('hh-x', t, 0) * 11 + noise2D('hh-x2', t * 5, 0) * 3.3;
const dy = noise2D('hh-y', t, 0) * 11 + noise2D('hh-y2', t * 5, 0) * 3.3;
const rot = noise2D('hh-r', (frame - 4) * 0.03, 0) * 0.45;
```

Anything travelling more than 25 % of frame width in under 8 frames gets `<CameraMotionBlur
shutterAngle={180} samples={8}>` from `@remotion/motion-blur` (it renders `samples` times — do not use
it on a ±3 px drift).

### 4. Speed, and the official time-remap snippet

`playbackRate={2}` plays at 2×, `0.5` at half. Reverse is not supported. A **ramp** is not an animated
`playbackRate` — the prop is read once. Either cut the shot into consecutive `<Video>` clips with
different rates and matching `trimBefore`s, or remap time. This is Remotion's own snippet:

```tsx
const remapSpeed = (frame: number, speed: (fr: number) => number) => {
  let framesPassed = 0;
  for (let i = 0; i <= frame; i++) {
    framesPassed += speed(i);
  }
  return framesPassed;
};

const frame = useCurrentFrame();
const speedFunction = (f: number) => interpolate(f, [0, 500], [1, 5]);
const remappedFrame = remapSpeed(frame, speedFunction);

<Sequence from={frame}>
  <Video trimBefore={Math.round(remappedFrame)} playbackRate={speedFunction(frame)} src={src} />
</Sequence>
```

Two things a reader always gets wrong:

- **`<Sequence from={frame}>` is not a typo.** It resets the child's internal frame to 0 on every
  frame, so `trimBefore` is the sole source of truth for the playhead. Without it, the child's own
  clock and `trimBefore` both advance and the clip runs away.
- **`remapSpeed` is O(frame) per frame, i.e. O(n²) over a render.** Fine to ~900 frames. Beyond that,
  precompute the cumulative array once in a `useMemo` outside the frame loop and index into it.

Ramp shape: normal → ramp down over 6–10 f → hold slow → ramp back up over 8–14 f. The ramp *out* is
longer than the ramp *in*; symmetric reads mechanical. The slow section starts **4–6 frames before**
the beat and ends 8–12 after — start it on the beat and you have already missed it. 0.4× is the
working floor for 30 fps source; below that each source frame is held long enough to read as a
stutter.

**Audio under a ramp.** `playbackRate` pitches the audio with the picture. `toneFrequency` (verified
range **0.01–2**, throws outside it) shifts pitch independently — but at `playbackRate: 0.4` you would
need ~2.5 to compensate, which is out of range. The honest answer is `<Video muted>` plus a separate
un-ramped `<Audio>` of the same source.

### 5. Building a cut list

A cut list is data. Compute it once, render it as hand-written JSX nodes.

```tsx
type Cut = {inF: number; outF: number; scale: number};   // frames into the SOURCE
const CUTS: Cut[] = [
  {inF: 0,   outF: 96,  scale: 1.00},
  {inF: 138, outF: 210, scale: 1.05},   // 1.4s of filler removed; level changes to hide the jump
  {inF: 246, outF: 330, scale: 1.00},
];

let cursor = 0;                        // playhead on the TIMELINE, in frames
const clips = CUTS.map((c, i) => {
  const from = cursor;
  const len = c.outF - c.inF;
  cursor += len;                       // + hold frames here for a deliberate pause (§8)
  return (
    <Video key={i} name={`clip ${i + 1}`} src={SRC} from={from} durationInFrames={len}
           trimBefore={c.inF} trimAfter={c.outF} style={{scale: c.scale}} />
  );
});
return <AbsoluteFill style={{backgroundColor}}>{clips}</AbsoluteFill>;
```

Two structures, pick deliberately:

- **Independent clips** — each `<Video>` carries its own `from`. Moving one does not move the others;
  gaps and overlaps are allowed. Use it when the brief gives absolute frame positions.
- **Ripple** — `<TransitionSeries>` from `@remotion/transitions`, one
  `<TransitionSeries.Sequence durationInFrames={n}>` per clip and **no `from`**. Changing one duration
  shifts everything after it. `TransitionSeries.Overlay` puts something *across* a cut (a whoosh, a
  light leak, a caption) **without shortening the timeline** — which matters when the cut list came
  from word timings and cannot afford drift.

**Do not generate clips with `.map()` when the brief gives you the cut list literally** — a mapped
clip is not individually editable in the Studio and the frame numbers stop being visible in the code.
Map only over a `CUTS` constant that is itself in the file, as above.

**Silence and filler cutting**, when you are deriving the list from audio or a transcript: silence
threshold **4 % of peak RMS over a 20 ms window**; minimum silence to cut **350 ms**; keep margin
**180–220 ms each side**; minimum kept segment **250 ms**; after removing filler words, merge adjacent
kept ranges whose gap is now **< 120 ms** so you do not stack micro-cuts. Then punch in on every cut,
alternating between 1.00 / 1.05 / 1.09 and never repeating a level.

### 6. J-cuts and L-cuts

In a **J-cut** the next scene's audio starts before its picture; in an **L-cut** the outgoing scene's
audio continues over the incoming picture. Both are just two `<Sequence>`s with different `from`:

```tsx
const LEAD = 12;   // frames B's audio leads B's picture
<>
  <Sequence from={0}  durationInFrames={90}><Video src={A} muted /></Sequence>
  <Sequence from={0}  durationInFrames={110}><Audio src={A} /></Sequence>   {/* L-cut: A's sound runs on */}

  <Sequence from={90 - LEAD}><Audio src={B} /></Sequence>                    {/* J-cut: B's sound leads */}
  <Sequence from={90}><Video src={B} muted trimBefore={LEAD} /></Sequence>
</>
```

`trimBefore={LEAD}` on the picture is the part that is always missed: if B's audio started `LEAD`
frames early, B's picture must start `LEAD` frames *into* the clip or lip sync drifts.

Lengths: **6–12 f** fast dialogue / reaction · **24–45 f** interview → b-roll · **30–60 f** cinematic
scene change · **45–90 f** music-led montage entry, always on a bar line.

**Crossfade with equal power, never linearly.** Two linear ramps sum to a dip in the middle because
power goes as amplitude squared. Take the square root:

```tsx
const XF = 8;   // crossfade length, in frames
const up = (f: number) =>
  interpolate(f, [0, XF], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

// A's audio runs 0..98 on its own clock, so it fades out over ITS frames 90..98.
<Audio src={A} volume={(f) => Math.sqrt(1 - up(f - 90))} />
// B's audio starts at timeline frame 90 - LEAD, so it fades in over ITS first XF frames.
<Audio src={B} volume={(f) => Math.sqrt(up(f))} />
```

`volume` takes `number | ((frame: number) => number)`, and **the callback receives the frame relative
to that clip's own start**, not the composition frame — which is why the two curves above are written
against different origins. Their powers sum to 1 at every point; two linear ramps would not.

### 7. B-roll holds and ducking

| cutaway | hold | why |
|---|---|---|
| illustrative (shows the noun just said) | 45–75 f | long enough to read, short enough not to become the subject |
| establishing / new location | 90–150 f | the viewer has to place themselves |
| reaction | 20–36 f | longer and it is a scene |
| insert (screen, hands, product detail) | 36–60 f | |
| **absolute floor** | **18 f** | below this the eye cannot resolve a new composition; it reads as a flash |

Keep the speaker's audio running under a cutaway by default — that is an L-cut and it is invisible.
Drop it only when the b-roll has diegetic sound worth hearing, and then crossfade 8 frames.

**Ducking, in the dB domain.** Dialogue peaks **−12…−6 dBFS**, music bed **−18…−24 dBFS**, duck
**9–12 dB** under speech.

**Master by destination — once, last, outside Remotion** (it does not normalise). **−16 LUFS /
−1.5 dBTP / LRA 11** for shorts, social and podcast delivery — the target every finished video in the
sibling studio shipped at — and **−14 LUFS / −1 dBTP** only for YouTube long-form, where the platform
normalises anyway. Run `loudnorm` **two-pass** (`print_format=json` first, then the `measured_*`
values with `linear=true`): a single pass undershoots a speech-led mix by 1.5–2.5 LU. Never stack it
with `dynaudnorm` or a second normaliser.

A smoothed duck is an accumulation, so build the whole curve in **one pass** in a `useMemo` and index
into it — never derive it from the current frame alone, which would depend on frames the renderer may
not have drawn.

```tsx
const DUCK_DB = useMemo(() => {
  // Look-ahead: the duck starts 0.5s BEFORE the word and releases 0.35s after it.
  const target = (f: number) => {
    const t = f / fps;
    return SPEECH.some((g) => t > g.start - 0.5 && t < g.end + 0.35) ? -11 : 0;
  };
  const out = new Float32Array(durationInFrames);
  let v = 0;
  for (let f = 0; f < durationInFrames; f++) {
    const g = target(f);
    v += (g - v) * (g < v ? 1 / 12 : 1 / 24);   // 12f attack, 24f release — ramped in dB, not gain
    out[f] = v;
  }
  return out;
}, [durationInFrames, fps]);

// This <Audio> starts at frame 0, so its callback frame and the composition frame agree.
<Audio src={staticFile('audio/music-bed.mp3')}
       volume={(f) => 10 ** (DUCK_DB[Math.min(f, DUCK_DB.length - 1)] / 20)} />
```

Two rules that matter more than the numbers:

- **Look ahead 250 ms – 1 s.** Duck *before* the speech, not on it. In Remotion this is exact, because
  the curve reads the word timings rather than a sidechain detector.
- **Only un-duck if the gap is > 1.2 s.** Ducking per sentence and lifting between them is the most
  obtrusive mix mistake there is — merge `SPEECH` ranges whose gap is under 1.2 s before you build the
  curve. And ramp the **dB** value, as above: interpolating linear gain sounds like it ducks late and
  recovers early.

### 8. Pause and pacing — apply this per scene boundary, in order

All values are frames at 30 fps.

```
1. base = 10 frames
2. topic changed at sub-topic level  → base = 24
   topic changed at section level    → base = 42
3. beat modifier: punchline|reveal +24 · rhetorical question +18 · list-item −6
4. importance modifier: base += (nextScene.importance − 3) * 12      // importance 1..5
5. energy modifier: last 10 s averaged >1 cut per 1.5 s → +12; <1 cut per 6 s → −8
6. clamp to [8, 150]                                   → outHold (frames)
7. inHold = clamp(round(outHold * 0.6), 6, 60)         // asymmetry is what reads as considered
8. transition: outHold ≤18 → hard cut · 19–40 → 10–14 f fade/push · 41–90 → 18–24 f overlay or
   20 f dip-to-black · >90 → 24–30 f plus a chapter card filling the hold
9. audio: outHold >12 → room tone at −30 dBFS, continuous; section break → cross-fade room tone
   over 20 f; immediately before an impact SFX → hard silence for min(12, outHold) frames
10. captions: clear the last page at lastWordEnd + 12 f; the next page appears exactly at
    nextScene.firstWordStart — captions never lead their audio
```

Total pause = `outHold + transition + inHold` → 0.5 s (tight continuation) to 5 s (section break).

Two hard constraints around it:

- **Never cut on a word.** The cut frame must land in a gap between `words[i].end` and
  `words[i+1].start`. If that gap is shorter than 6 frames, move the cut to the next gap that is not.
- **Never true digital silence for more than 20 frames** — it reads as a fault and viewers reach for
  the volume. Keep room tone at **−32…−28 dBFS** under any hold longer than 12 frames. True silence is
  a weapon used for ≤ 20 frames immediately before an impact, and nowhere else. Music does **not**
  stop in a pause; a section break is where you change music, on a bar line.

Write the decision down in the component so it is inspectable:

```tsx
// boundary -> hold in frames at 30fps, chosen per the procedure above.
const HOLDS = [
  {after: 'scene-1', frames: 45},  // 1.5s — one sentence, no number
  {after: 'scene-2', frames: 96},  // 3.2s — diagram with 6 labels
  {after: 'scene-3', frames: 54},  // 1.8s — 0.7s of natural silence already there (2.5 - 0.7)
];
```

A hold is **not** a `<Freeze>` unless the brief says so — a frozen talking head reads as a stall.
Extend the outgoing clip, or let it play under a held-still overlay.

### 9. SFX timing

**The transient lands 1–3 frames BEFORE the visual event, never on it.** Audio-early reads as
anticipation; audio-late reads as an error.

| SFX | level vs dialogue | timing | length |
|---|---|---|---|
| whoosh (whip / pan) | −10…−6 dB | **starts 10 f before the cut**, peak at the cut | 12–20 f |
| riser (before a reveal) | −24 dB → −8 dB | **ENDS exactly on the cut**, no tail | 30–75 f |
| impact / slam | −4…0 dB (loudest thing in the mix) | transient **1 f before** impact | 6–20 f + tail |
| pop (sticker, chip) | −16 dB | 1 f before the scale starts | 4–8 f |
| key click | −20 dB, ±2 dB per key | on the frame the character appears | 3 f |
| sub-drop under a title | −8 dB, high-pass the music by 200 Hz under it | on the landing frame | 30–45 f |

**Never more than 3 SFX in a 15-frame window** — past that it is noise and the loudness normaliser
pulls the whole video down.

A one-shot is a `<Sequence>` with a `from`, which is frame-exact and mixed deterministically:

```tsx
const CUT = 96;
<Sequence from={CUT - 10}><Audio src={staticFile('audio/sfx/whoosh.mp3')} volume={0.5} /></Sequence>
```

For a riser that must *end* on the cut, subtract its length: the shipped `riser.mp3` is 2.038 s ≈
61 frames, so `from={CUT - 61}`.

### 10. The footage and audio this library ships

In `public/`, referenced through `staticFile()` **with the subdirectory**. Durations measured with
`npx remotion ffprobe`:

| file | size | fps | duration | frames @30 | audio | what it is |
|---|---|---|---|---|---|---|
| `footage/interview-raw.mp4` | 1280×720 | 30 | **39.000 s** | 1170 | yes | raw locked-off interview, real fillers and pauses |
| `footage/interview.mp4` | 1920×1080 | 30 | **6.133 s** | 184 | yes | clean produced talking head |
| `footage/broll-earth.mp4` | 1920×1080 | 30 | **6.000 s** | 180 | silent | Earth from orbit |
| `footage/broll-eva.mp4` | 1920×1080 | 30 | **4.400 s** | 132 | silent | spacewalk |
| `footage/broll-sunrise.mp4` | 1920×1080 | 30 | **4.000 s** | 120 | silent | orbital sunrise limb |
| `footage/broll-night.mp4` | 1920×1080 | 30 | **3.800 s** | 114 | silent | city lights at night |
| `audio/music-bed.mp3` | — | — | **42.266 s** | 1268 | — | 92 BPM, Am9–Fmaj7–Cmaj7–G6, builds every 4 bars |

SFX in `audio/sfx/`: `whoosh` 0.627 s · `riser` 2.038 s · `impact` 1.541 s · `sub-drop` 1.646 s ·
`chime` 1.149 s · `shutter` 0.313 s · `swish` 0.261 s · `pop` 0.235 s · `key` 0.157 s ·
`click` 0.131 s.

All footage is **NASA public domain**; all audio is synthesised and CC0. At 92 BPM one bar is
2.609 s ≈ **78 frames** at 30 fps, so musical cut points sit on multiples of 78 from the first
downbeat.

Never hard-code a duration you have not checked: `npx remotion ffprobe public/footage/<file>`.

### 11. Grading, keying and blurring with `@remotion/effects`

`<Video effects={[...]}>` applies GPU passes to the **decoded video texture** — not a CSS filter.
Install with `npx remotion add @remotion/effects`; one subpath per effect.

```tsx
import {colorCorrection} from '@remotion/effects/color-correction';
import {colorKey} from '@remotion/effects/color-key';
import {regionBlur} from '@remotion/effects/region-blur';

<Video src={SRC} effects={[colorCorrection({temperature: -0.18, tint: 0.06, saturation: 1.12,
                                            shadows: -0.1, highlights: -0.15})]} />
```

Verified parameters (from each package's own `.d.ts`):

| effect | parameters |
|---|---|
| `colorCorrection` | `exposure` −5…5 (stops, d 0) · `contrast` multiplier (d 1) · `pivot` 0…1 (d 0.5) · `shadows`/`highlights`/`whites`/`blacks` −1…1 (d 0) · `temperature`/`tint` −1…1 (d 0) · `saturation` multiplier (d 1) · `vibrance` −1…1 (d 0) |
| `colorKey` | `keyColor` (d `'#00ff00'`) · `similarity` 0…1 (d 0.18) · `smoothness` 0…1 (d 0.08) · `spillSuppression` 0…1 (d 0.25) |
| `regionBlur` | `topLeft` and `bottomRight` **required**, UV pairs · `blurRadius` px (d 40) · `feather` px (d 0) · `roundness` 0…1 (d 0) |
| `blur` | `radius` **required** px · `horizontal` (d true) · `vertical` (d true) |
| `vignette` | `amount` 0…1 (d 0.5) · `radius` 0…1 (d 0.65) · `feather` 0…1 (d 0.35) · `roundness` 0…1 (d 1) · `color` (d `#000000`) · `mode` `'color'`\|`'alpha'` · `center` UV (d `[0.5, 0.5]`) |
| `glow` | `radius` px (d 20) · `intensity` multiplier (d 1) · `threshold` 0…1 (d 0) · `color` (d white) |
| `whiteNoise` | `amount` 0…1 (d 1) · `seed` number (d 0) — **drive `seed` from `frame`** for live grain; a fixed seed gives frozen "dirty sensor" grain |
| `cornerPin` | `topLeft`/`topRight`/`bottomRight`/`bottomLeft` UV pairs — a homography, i.e. screen replacement |

**The ranges are not uniform across the package and out-of-range values throw at runtime.** The
standalone `brightness()` is a *signed offset* in −1…1, so `1.06` throws — you want `0.06`. But
`contrast()` and `saturation()` are *multipliers* where 1 is neutral and 1.5 is valid. Read the
subpath's own `.d.ts` rather than assuming one convention.

**Everything in `@remotion/effects` needs WebGL2.** `remotion.config.ts` must contain
`Config.setChromiumOpenGlRenderer('angle')`, or pass `--gl=angle` on the CLI. Without it the effect
renders **blank, with no error**. `--gl=swiftshader` throws *"Failed to create WebGL2 context"*.
Always verify a graded shot by rendering a still, not by looking at the Studio.
