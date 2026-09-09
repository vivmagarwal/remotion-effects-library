import {AbsoluteFill, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {loadFont} from '@remotion/google-fonts/Sora';

const {fontFamily} = loadFont('normal', {weights: ['500', '700'], subsets: ['latin']});

/**
 * Audio Spectrum
 * Real FFT bars driven by the actual audio file, mirrored around the centre.
 * `visualizeAudio` returns linear amplitudes; the ear is logarithmic, so the
 * values are raised to a power before being drawn — without that the bars barely
 * move except on the loudest peaks.
 */

type Props = {
  readonly src?: string;
  readonly title?: string;
  readonly artist?: string;
  readonly bars?: number;
  readonly colors?: readonly [string, string];
  readonly backgroundColor?: string;
  /** Compresses the dynamic range. Lower = livelier bars. */
  readonly gamma?: number;
};

export const AudioSpectrum: React.FC<Props> = ({
  src,
  title = 'Frame by Frame',
  artist = 'The Renderers',
  bars = 48,
  colors = ['#4cc9f0', '#f72585'],
  backgroundColor = '#08080f',
  gamma = 0.42,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const source = src ?? staticFile('sample-audio.mp3');

  // Returns null on the first render while the file is being fetched.
  const audioData = useAudioData(source);

  // Ask for a power of two; the visualiser returns numberOfSamples / 2 bands.
  const spectrum = audioData
    ? visualizeAudio({audioData, frame, fps, numberOfSamples: 128})
    : new Array(64).fill(0);

  // Take the low two-thirds — the top bands are mostly silent on real music.
  const used = spectrum.slice(0, bars);

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
        style={{fontSize: 74, fontWeight: 700, color: '#f4f5fa', letterSpacing: '-0.02em'}}
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
          color: '#7f86a0',
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

      <div style={{width: 1180, height: 5, borderRadius: 3, backgroundColor: '#1b1e2c', marginTop: 62}}>
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
