import {AbsoluteFill, Easing, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Audiogram
 * The podcast-clip format: cover art, a symmetric waveform that reacts to the
 * real audio, and word-timed captions. Everything reads from one audio file, so
 * the bars and the words can never drift apart.
 */

export type Word = {readonly text: string; readonly start: number; readonly end: number};

/**
 * Re-bucket linear FFT bins into `count` octave-spaced bands.
 *
 * `visualizeAudio` returns bins spaced *linearly* from 0 Hz to Nyquist. On any
 * real music every audible thing sits in the bottom eighth of that range, so one
 * bar per bin draws a tall left edge decaying into a flat dead zone — the shape
 * that reads as a broken analyser. Octave spacing is what a hardware analyser
 * does, and it is what makes each bar move independently.
 *
 * Each band takes the *peak* of the bins inside it, not the mean: averaging a
 * wide high band mixes one loud hi-hat partial with a lot of silence and renders
 * as nothing. The `Math.pow(2, …)` term is a +3 dB/octave pink-noise tilt, which
 * compensates for music losing roughly that much energy per octave going up.
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
    out.push(peak * Math.pow(2, (Math.log2(from / LOW) * 3) / 6));
  }
  return out;
};

type Props = {
  readonly src?: string;
  readonly show?: string;
  readonly episode?: string;
  readonly words?: readonly Word[];
  readonly wordsPerPage?: number;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
  readonly bars?: number;
  /** Compresses the dynamic range. Lower = livelier bars. */
  readonly gamma?: number;
};

const SCRIPT: Word[] = [
  {text: 'The', start: 0.15, end: 0.34},
  {text: 'thing', start: 0.34, end: 0.72},
  {text: 'nobody', start: 0.72, end: 1.24},
  {text: 'tells', start: 1.24, end: 1.6},
  {text: 'you', start: 1.6, end: 1.8},
  {text: 'about', start: 1.8, end: 2.16},
  {text: 'rendering', start: 2.16, end: 2.82},
  {text: 'video', start: 2.82, end: 3.28},
  {text: 'in', start: 3.28, end: 3.42},
  {text: 'React', start: 3.42, end: 3.92},
  {text: 'is', start: 3.92, end: 4.08},
  {text: 'how', start: 4.08, end: 4.34},
  {text: 'fast', start: 4.34, end: 4.74},
  {text: 'it', start: 4.74, end: 4.9},
  {text: 'iterates', start: 4.9, end: 5.6},
];

export const Audiogram: React.FC<Props> = ({
  src,
  show = 'FRAME BY FRAME',
  episode: episodeTitle = 'Ep. 12 — Rendering in React',
  words = SCRIPT,
  wordsPerPage = 4,
  accentColor = '#c6ff3d',
  backgroundColor = '#0a0b10',
  bars = 34,
  gamma = 0.42,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const source = src ?? staticFile('audio/music-bed.mp3');
  const time = frame / fps;

  // Returns null on the first render while the file is being fetched.
  const audioData = useAudioData(source);
  const linear = audioData
    ? visualizeAudio({audioData, frame, fps, numberOfSamples: 1024, optimizeFor: 'accuracy'})
    : new Array(512).fill(0);
  const used = toLogBands(linear, bars, (audioData?.sampleRate ?? 44100) / 2);

  const activeIndex = words.findIndex((w) => time >= w.start && time < w.end);
  const index =
    activeIndex === -1 ? (time >= (words.at(-1)?.end ?? 0) ? words.length - 1 : 0) : activeIndex;
  const page = Math.floor(index / wordsPerPage);
  const pageWords = words.slice(page * wordsPerPage, (page + 1) * wordsPerPage);

  const enter = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        backgroundImage: `radial-gradient(ellipse at 50% 22%, ${accentColor}18 0%, transparent 62%)`,
        alignItems: 'center',
        padding: '120px 90px',
        fontFamily,
      }}
    >
      <Audio src={source} />

      {/* Cover art — a generated plate, so the effect has no image dependency. */}
      <Interactive.Div
        name="Cover"
        style={{
          width: 420,
          height: 420,
          borderRadius: 34,
          backgroundImage: `linear-gradient(145deg, ${accentColor}, #c6ff3d 55%, #4cc9f0)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 40px 90px rgba(0,0,0,0.55), 0 0 120px ${accentColor}22`,
          scale: 0.9 + enter * 0.1,
          opacity: enter,
          flexShrink: 0,
        }}
      >
        <span style={{fontSize: 150, fontWeight: 800, color: '#04050a', letterSpacing: '-0.05em'}}>
          ▮▮
        </span>
      </Interactive.Div>

      <Interactive.Div
        name="Show"
        style={{
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: '0.34em',
          marginRight: '-0.34em',
          color: accentColor,
          marginTop: 44,
          opacity: interpolate(frame, [10, 28], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {show}
      </Interactive.Div>
      <Interactive.Div
        name="Episode"
        style={{
          fontSize: 38,
          fontWeight: 500,
          color: '#8d93a5',
          marginTop: 12,
          opacity: interpolate(frame, [16, 34], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {episodeTitle}
      </Interactive.Div>

      {/* Captions sit between the art and the waveform — the eye lands here. */}
      <Interactive.Div
        name="Captions"
        style={{
          flex: 1,
          display: 'flex',
          flexWrap: 'wrap',
          alignContent: 'center',
          justifyContent: 'center',
          gap: '0 22px',
          maxWidth: 900,
          textAlign: 'center',
        }}
      >
        {pageWords.map((w, i) => {
          const isActive = page * wordsPerPage + i === index;
          return (
            <span
              key={i}
              style={{
                fontSize: 66,
                fontWeight: 800,
                lineHeight: 1.25,
                color: isActive ? accentColor : '#ffffff',
                opacity: time >= w.start ? 1 : 0.34,
              }}
            >
              {w.text}
            </span>
          );
        })}
      </Interactive.Div>

      {/* Symmetric waveform: one bar centred on the axis, growing both ways. */}
      <div style={{display: 'flex', alignItems: 'center', gap: 10, height: 220, flexShrink: 0}}>
        {used.map((v, i) => {
          const shaped = Math.pow(v, gamma);
          return (
            <div
              key={i}
              style={{
                width: 14,
                height: Math.max(14, shaped * 430),
                borderRadius: 7,
                backgroundColor: accentColor,
                opacity: 0.4 + shaped * 0.6,
              }}
            />
          );
        })}
      </div>

      <div style={{width: '100%', maxWidth: 900, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 34, flexShrink: 0}}>
        <div
          style={{
            height: '100%',
            borderRadius: 3,
            backgroundColor: accentColor,
            width: `${interpolate(frame, [0, durationInFrames], [0, 100], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}%`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
