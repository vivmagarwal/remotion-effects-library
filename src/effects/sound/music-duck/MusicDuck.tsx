import {AbsoluteFill, Interactive, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useMemo} from 'react';
import {Audio} from '@remotion/media';
import {useAudioData} from '@remotion/media-utils';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Music Duck
 *
 * A music bed getting out of the way of a voice, with the envelope computed from
 * the transcript rather than from the audio.
 *
 * **Working from word timings instead of from a sidechain compressor is the
 * whole trick.** A compressor reacts to what it has already heard, so it is
 * always late by its own attack time, and it cannot tell a breath from a word or
 * a cough from a sentence. Word timings are exact, they are free with any ASR,
 * and — critically — they are known in ADVANCE, which is the one thing a
 * real-time compressor can never have.
 *
 * Four numbers, and each of them is a specific mistake if you get it wrong:
 *
 *  1. **Look-ahead, 150 ms.** The duck starts BEFORE the first word. Start it on
 *     the word and the first syllable arrives on top of full-level music, which
 *     is exactly the moment the audience needed to hear it.
 *  2. **Release, 450 ms.** Long, and longer than the attack. A fast release
 *     pumps: the music surges into every gap between sentences and the mix
 *     breathes like a bad radio edit.
 *  3. **Hold, 800 ms.** Gaps shorter than this do not un-duck at all. Without a
 *     hold the music rises into every comma, and it is the single loudest
 *     signal that a mix was automated.
 *  4. **The interpolation is in dB, not in amplitude.** Loudness is
 *     logarithmic: a linear ramp from 1.0 to 0.2 dumps most of its travel in the
 *     first third and then crawls, which is heard as a lurch followed by a
 *     hang. Ramp 0 dB → −14 dB linearly instead, and convert once at the end
 *     with `10 ** (dB / 20)`.
 *
 * Everything above is a pure function of the transcript, so the envelope is
 * computed once in a `useMemo` and `volume` is a closure over it. `volume`
 * accepts `(frame) => number` — the frame it hands you is the frame within the
 * MEDIA's own sequence, which is why the window offset is folded in once here
 * rather than at every call site.
 *
 * The picture is the mix: the music waveform is drawn scaled BY the envelope, so
 * what you see is what the duck does to it, and the voice waveform sits under it
 * on the same clock.
 */

/** One word from an ASR response: text, start and end in SECONDS. */
type Word = {readonly w: string; readonly s: number; readonly e: number};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly muted: string;
  readonly body: string;
  readonly text: string;
  readonly accent: string;
  readonly pair: string;
  readonly paper: string;
  readonly bg: string;
  readonly bgDeep: string;
  readonly radius: number;
  readonly stroke: number;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  muted: '#8d93a5',
  body: '#eef1f7',
  text: fontFamily,
  accent: '#ff5c39',
  pair: '#4cc9f0',
  paper: '#f6f5f2',
  bg: '#0a0b10',
  bgDeep: '#04050a',
  radius: 18,
  stroke: 3,
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly musicSrc?: string;
  readonly voiceSrc?: string;
  /** Word timings in seconds, relative to the start of `voiceSrc`. */
  readonly words?: readonly Word[];
  /** How far the music drops, in dB. −12 to −16 is the working band. */
  readonly duckDb?: number;
  /** The duck starts this long before the first word. */
  readonly lookAheadMs?: number;
  /** And recovers over this long after the last one. Longer than the attack. */
  readonly releaseMs?: number;
  /** Gaps shorter than this never un-duck. */
  readonly holdMs?: number;
  /** Level of the bed when nothing is ducking it, in dB. */
  readonly bedDb?: number;
  readonly showDebug?: boolean;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
};

/**
 * `public/transcripts/interview-raw.deepgram.json`, 41.0 s → 53.0 s, shifted so
 * 0 is the start of `voice-interview.mp3`. Contains the clip's one long pause —
 * 3.36 s — which is where you actually see the bed come back up.
 *
 * Note "How" at 3.14 → 4.42. A 1.28 s word is Deepgram mis-attributing the tail
 * of the answer, and it is left in because it shows the honest cost of driving a
 * mix from ASR: the duck holds about 1.5 s longer than the voice needs it to.
 * Nothing downstream can detect that — the envelope is exactly as correct as its
 * input. If a bed hangs low after a line, look at the word, not at the release.
 */
const WORDS: Word[] = [
  {w: 'same', s: 0.0, e: 0.15}, {w: 'time,', s: 0.15, e: 0.71}, {w: 'um,', s: 1.03, e: 1.35},
  {w: "I'm", s: 1.35, e: 1.83}, {w: 'just', s: 1.83, e: 2.15}, {w: "I'm", s: 2.39, e: 2.55},
  {w: 'hopeful.', s: 2.55, e: 2.95}, {w: 'How', s: 3.14, e: 4.42}, {w: 'long', s: 7.78, e: 8.02},
  {w: 'before', s: 8.02, e: 8.34}, {w: 'you', s: 8.34, e: 8.5}, {w: 'find', s: 8.5, e: 8.82},
  {w: 'out', s: 8.82, e: 8.98}, {w: 'if', s: 8.98, e: 9.22}, {w: 'you', s: 9.22, e: 9.38},
  {w: 'are', s: 9.38, e: 9.62}, {w: 'on', s: 9.62, e: 9.78}, {w: 'the', s: 9.78, e: 9.94},
  {w: 'mission', s: 9.94, e: 10.18}, {w: 'for', s: 10.18, e: 10.42},
  {w: 'sure?', s: 10.42, e: 10.98}, {w: 'Well,', s: 11.22, e: 11.54},
  {w: 'I', s: 11.54, e: 11.62}, {w: 'think', s: 11.62, e: 11.78},
  {w: "it'll", s: 11.78, e: 12.02},
];

const dbToGain = (db: number) => 10 ** (db / 20);

/**
 * Peak-per-bucket over the first `seconds` of a file.
 *
 * The window is not optional. `channelWaveforms` holds the WHOLE file, and the
 * bed is 42 s against a 12 s composition — draw all of it and the music lane is
 * on a different horizontal clock from the voice lane and the envelope under it,
 * so a dip lines up with nothing. Three lanes are only worth drawing if they
 * share an x-axis.
 */
const envelopeOf = (
  data: {channelWaveforms: Float32Array[]; sampleRate: number} | null,
  buckets: number,
  seconds: number,
) => {
  const samples = data?.channelWaveforms[0];
  if (!samples || samples.length === 0) return new Array<number>(buckets).fill(0);
  const end = Math.min(samples.length, Math.round(seconds * data.sampleRate));
  const per = end / buckets;
  const out = new Array<number>(buckets);
  for (let b = 0; b < buckets; b++) {
    const from = Math.floor(b * per);
    const to = Math.min(end, Math.floor((b + 1) * per));
    let peak = 0;
    // A mean would average a drum hit away; a peak is what an editor sees.
    for (let i = from; i < to; i++) {
      const v = Math.abs(samples[i]);
      if (v > peak) peak = v;
    }
    out[b] = peak;
  }
  return out;
};

const BUCKETS = 480;

export const MusicDuck: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  musicSrc = staticFile('audio/music-bed.mp3'),
  voiceSrc = staticFile('audio/voice-interview.mp3'),
  words = WORDS,
  duckDb = -14,
  lookAheadMs = 150,
  releaseMs = 450,
  holdMs = 800,
  bedDb = -6,
  showDebug = true,
  accentColor = theme.accent,
  backgroundColor = theme.bgDeep,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const music = useAudioData(musicSrc);
  const voice = useAudioData(voiceSrc);

  /**
   * Voice regions, merged. Two runs of speech separated by less than
   * `holdMs` are one region — that merge IS the hold, and without it the bed
   * rises into every comma.
   */
  const regions = useMemo(() => {
    const merged: {s: number; e: number}[] = [];
    for (const w of words) {
      const last = merged[merged.length - 1];
      if (last && w.s - last.e < holdMs / 1000) last.e = Math.max(last.e, w.e);
      else merged.push({s: w.s, e: w.e});
    }
    return merged;
  }, [words, holdMs]);

  /**
   * The envelope, in dB, sampled per frame. dB rather than amplitude: loudness
   * is logarithmic, and a linear ramp spends most of its travel in the first
   * third, which is heard as a lurch and then a hang.
   */
  const envelopeDb = useMemo(() => {
    const attack = lookAheadMs / 1000;
    const release = releaseMs / 1000;
    const out = new Array<number>(durationInFrames);
    for (let f = 0; f < durationInFrames; f++) {
      const t = f / fps;
      let db = 0;
      for (const r of regions) {
        // Ducked through the region; ramping in over the look-ahead before it,
        // and out over the release after it.
        if (t >= r.s && t <= r.e) db = Math.min(db, duckDb);
        else if (t >= r.s - attack && t < r.s)
          db = Math.min(db, duckDb * ((t - (r.s - attack)) / attack));
        else if (t > r.e && t <= r.e + release)
          db = Math.min(db, duckDb * (1 - (t - r.e) / release));
      }
      out[f] = db;
    }
    return out;
  }, [regions, duckDb, lookAheadMs, releaseMs, durationInFrames, fps]);

  const windowSeconds = durationInFrames / fps;
  const musicEnv = useMemo(
    () => envelopeOf(music, BUCKETS, windowSeconds),
    [music, windowSeconds],
  );
  const voiceEnv = useMemo(
    () => envelopeOf(voice, BUCKETS, windowSeconds),
    [voice, windowSeconds],
  );

  const duck = envelopeDb[Math.min(frame, envelopeDb.length - 1)] ?? 0;
  const state = duck <= duckDb + 0.01 ? 'DUCKED' : duck < -0.01 ? 'MOVING' : 'OPEN';
  const playhead = durationInFrames <= 1 ? 0 : frame / (durationInFrames - 1);

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, fontFamily, overflow: 'hidden'}}>
      {/* volume takes (frame) => number. The frame is the one inside the media's
          own sequence, so the envelope is indexed directly. */}
      <Audio
        src={musicSrc}
        volume={(f) => dbToGain(bedDb + (envelopeDb[Math.min(f, envelopeDb.length - 1)] ?? 0))}
      />
      <Audio src={voiceSrc} />

      {showDebug ? (
        <>
          <Interactive.Div
            name="Readout"
            style={{
              position: 'absolute',
              left: 84,
              top: 84,
              padding: '18px 28px',
              borderRadius: theme.radius * (12 / 18),
              backgroundColor: `${theme.bg}b8`,
              backdropFilter: 'blur(18px) saturate(1.3)',
              border: '1px solid rgba(255,255,255,0.14)',
              minWidth: 640,
            }}
          >
            <div style={{fontSize: 34, fontWeight: 800, letterSpacing: '0.16em', color: accentColor}}>
              BED {state}
            </div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 500,
                color: theme.body,
                marginTop: 8,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {(bedDb + duck).toFixed(1)} dB · duck {duckDb} dB · {regions.length} voice regions
            </div>
            <div style={{fontSize: 34, fontWeight: 500, color: theme.muted, marginTop: 8}}>
              {lookAheadMs}ms look-ahead · {releaseMs}ms release · {holdMs}ms hold
            </div>
          </Interactive.Div>

          <div
            style={{
              position: 'absolute',
              right: 84,
              top: 96,
              maxWidth: 720,
              textAlign: 'right',
              fontSize: 34,
              fontWeight: 500,
              color: theme.muted,
              lineHeight: 1.4,
            }}
          >
            <span style={{color: theme.body, fontWeight: 700}}>
              A compressor reacts to what it has already heard.
            </span>
            <br />
            {words.length} word timings are known in advance, which is the one
            thing it can never have.
          </div>

          <div style={{position: 'absolute', left: 84, right: 84, top: 300}}>
            <Lane
              label="MUSIC BED · drawn at the level the duck leaves it"
              env={musicEnv}
              gain={(i) => dbToGain(envelopeDb[Math.round((i / BUCKETS) * durationInFrames)] ?? 0)}
              color={theme.pair}
              playhead={playhead}
              playheadColor={theme.paper}
              playheadWidth={theme.stroke}
              loading={music === null}
              labelColor={theme.muted}
              loadingColor={theme.muted}
            />
            <div style={{height: 40}} />
            <Lane
              label="VOICE · the thing the bed is getting out of the way of"
              env={voiceEnv}
              gain={() => 1}
              color={theme.paper}
              playhead={playhead}
              playheadColor={theme.paper}
              playheadWidth={theme.stroke}
              loading={voice === null}
              labelColor={theme.muted}
              loadingColor={theme.muted}
            />
          </div>

          {/* The envelope itself, in dB, under both lanes. Drawn on the same
              horizontal clock so a dip lines up with the words that caused it. */}
          <div style={{position: 'absolute', left: 84, right: 84, bottom: 96, height: 170}}>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: '0.18em',
                color: theme.muted,
                marginBottom: 12,
              }}
            >
              ENVELOPE · 0 dB → {duckDb} dB · shaded bands are the {regions.length} merged voice regions
            </div>
            <svg
              width="100%"
              height="120"
              viewBox={`0 0 ${durationInFrames} 120`}
              preserveAspectRatio="none"
            >
              {/* The merged regions, behind the curve. 25 words became 2 bands,
                  and that merge IS the hold — without it drawn, the curve looks
                  like it was keyframed by hand. */}
              {regions.map((r) => (
                <rect
                  key={r.s}
                  x={r.s * fps}
                  y={0}
                  width={Math.max(1, (r.e - r.s) * fps)}
                  height={120}
                  fill={accentColor}
                  fillOpacity={0.16}
                />
              ))}
              <line
                x1={0}
                y1={2}
                x2={durationInFrames}
                y2={2}
                stroke="rgba(238,241,247,0.3)"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
              <polyline
                fill="none"
                stroke={accentColor}
                strokeWidth={theme.stroke * (5 / 3)}
                vectorEffect="non-scaling-stroke"
                points={envelopeDb
                  .map((db, f) => `${f},${2 + (db / duckDb) * 116}`)
                  .join(' ')}
              />
              <line
                x1={frame}
                y1={0}
                x2={frame}
                y2={120}
                stroke={theme.paper}
                strokeWidth={theme.stroke}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

const Lane: React.FC<{
  label: string;
  env: readonly number[];
  gain: (bucket: number) => number;
  color: string;
  playhead: number;
  playheadColor: string;
  playheadWidth: number;
  loading: boolean;
  labelColor: string;
  loadingColor: string;
}> = ({
  label,
  env,
  gain,
  color,
  playhead,
  playheadColor,
  playheadWidth,
  loading,
  labelColor,
  loadingColor,
}) => (
  <div>
    <div
      style={{
        fontSize: 26,
        fontWeight: 800,
        letterSpacing: '0.18em',
        color: labelColor,
        marginBottom: 12,
      }}
    >
      {label}
    </div>
    <div style={{position: 'relative', height: 210}}>
      {/* useAudioData returns null on the first render while the file loads.
          Rendering nothing is correct; crashing on `.channelWaveforms` is the
          usual alternative. */}
      {loading ? (
        <div style={{fontSize: 30, fontWeight: 500, color: loadingColor}}>reading waveform…</div>
      ) : (
        <svg width="100%" height="210" viewBox={`0 0 ${BUCKETS} 210`} preserveAspectRatio="none">
          {env.map((v, i) => {
            const h = Math.max(1.5, v * gain(i) * 204);
            return (
              <rect
                key={i}
                x={i + 0.15}
                y={105 - h / 2}
                width={0.7}
                height={h}
                fill={color}
                opacity={i / BUCKETS <= playhead ? 0.95 : 0.34}
              />
            );
          })}
        </svg>
      )}
      <div
        style={{
          position: 'absolute',
          left: `${playhead * 100}%`,
          top: 0,
          bottom: 0,
          width: playheadWidth,
          backgroundColor: playheadColor,
          boxShadow: `0 0 18px ${playheadColor}b3`,
        }}
      />
    </div>
  </div>
);
