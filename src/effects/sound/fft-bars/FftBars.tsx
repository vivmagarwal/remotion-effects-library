import {AbsoluteFill, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {loadFont} from '@remotion/google-fonts/Sora';

const {fontFamily} = loadFont('normal', {weights: ['500', '700'], subsets: ['latin']});

/**
 * FFT Bars
 * Real FFT bars driven by the actual audio file, mirrored around the centre.
 *
 * Two corrections stand between `visualizeAudio` and bars that look like a
 * spectrum analyser instead of a slope, and both are about the same thing: the
 * FFT is linear and hearing is not.
 *
 *  - `visualizeAudio` hands back bins spaced *linearly* from 0 Hz to Nyquist.
 *    On any real music, everything audible sits in the bottom eighth of that
 *    range, so drawing one bar per bin gives a tall left edge decaying to a flat
 *    dead zone — the classic "broken analyser" look. `toLogBands` re-buckets the
 *    bins into octave-spaced bands between 40 Hz and 16 kHz, which is what every
 *    hardware analyser does and what makes each bar move independently.
 *  - Even then, music loses roughly 3 dB per octave going up, so the top bands
 *    stay short. A pink-noise tilt (+3 dB/octave) puts them back on an even
 *    footing, and only then does the perceptual `gamma` do its job.
 */

/**
 * Re-bucket linear FFT bins into `count` octave-spaced bands.
 *
 * Each band takes the *peak* of the bins inside it, not the mean: a mean across
 * a wide high band averages one loud hi-hat partial together with a lot of
 * silence and reads as nothing. Bands narrower than one bin fall back to the
 * single bin they land on, so the low end never renders empty.
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

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly muted: string;
  readonly ink: string;
  readonly text: string;
  readonly bgDeep: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  muted: '#8d93a5',
  ink: '#ffffff',
  text: fontFamily,
  bgDeep: '#04050a',
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly src?: string;
  readonly title?: string;
  readonly artist?: string;
  readonly bars?: number;
  readonly colors?: readonly [string, string];
  readonly backgroundColor?: string;
  /** Compresses the dynamic range. Lower = livelier bars. */
  readonly gamma?: number;
};

export const FftBars: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  src,
  title = 'Frame by Frame',
  artist = 'The Renderers',
  bars = 48,
  colors = ['#4cc9f0', '#c77dff'],
  backgroundColor = theme.bgDeep,
  gamma = 0.42,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const source = src ?? staticFile('audio/music-bed.mp3');

  // Returns null on the first render while the file is being fetched.
  const audioData = useAudioData(source);

  // Ask for a power of two; the visualiser returns numberOfSamples / 2 bins,
  // linearly spaced from 0 Hz to the Nyquist frequency (sampleRate / 2).
  const linear = audioData
    ? visualizeAudio({audioData, frame, fps, numberOfSamples: 1024, optimizeFor: 'accuracy'})
    : new Array(512).fill(0);

  const nyquist = (audioData?.sampleRate ?? 44100) / 2;
  const used = toLogBands(linear, bars, nyquist);

  const progress = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        backgroundImage: `radial-gradient(ellipse at 50% 50%, ${colors[0]}18 0%, transparent 62%)`,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
      }}
    >
      <Audio src={source} />

      <Interactive.Div
        name="Title"
        style={{fontSize: 74, fontWeight: 700, color: theme.ink, letterSpacing: '-0.02em'}}
      >
        {title}
      </Interactive.Div>
      <Interactive.Div
        name="Artist"
        style={{
          fontSize: 30,
          fontWeight: 500,
          letterSpacing: '0.28em',
          marginRight: '-0.28em',
          textTransform: 'uppercase',
          color: theme.muted,
          marginTop: 10,
          marginBottom: 56,
        }}
      >
        {artist}
      </Interactive.Div>

      <div style={{display: 'flex', alignItems: 'center', gap: 7, height: 420}}>
        {used.map((v, i) => {
          // Perceptual correction: the ear is logarithmic, the FFT output is not.
          const shaped = Math.pow(v, gamma);
          const h = Math.max(6, shaped * 1450);
          const mix = i / Math.max(1, used.length - 1);
          return (
            <div
              key={i}
              style={{
                width: 16,
                height: h,
                borderRadius: 8,
                background: `linear-gradient(${colors[0]}, ${colors[1]})`,
                opacity: 0.45 + mix * 0.55,
                boxShadow: shaped > 0.35 ? `0 0 22px ${colors[0]}77` : undefined,
              }}
            />
          );
        })}
      </div>

      <div style={{width: 1180, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 62}}>
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            borderRadius: 3,
            background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
