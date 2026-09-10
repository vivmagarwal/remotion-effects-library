import {AbsoluteFill, Interactive, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Anton';

const {fontFamily} = loadFont('normal', {weights: ['400'], subsets: ['latin']});

/**
 * Glitch Text
 * Three copies of the same word — cyan, magenta and white — sit on top of one
 * another. During a glitch burst the coloured copies slide apart and horizontal
 * slices get displaced. Between bursts everything sits in perfect register, so
 * the glitch reads as an interruption rather than a permanent texture.
 */

type Props = {
  readonly text?: string;
  readonly subtitle?: string;
  /** Frames per glitch cycle: a burst happens in the first `burstFrames` of each. */
  readonly cycleFrames?: number;
  readonly burstFrames?: number;
  readonly intensity?: number;
  readonly backgroundColor?: string;
  readonly color?: string;
};

export const GlitchText: React.FC<Props> = ({
  text = 'GLITCH',
  subtitle = 'rgb split · slice displace',
  cycleFrames = 26,
  burstFrames = 7,
  intensity = 1,
  backgroundColor = '#04050a',
  color = '#ffffff',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const cycle = Math.floor(frame / cycleFrames);
  const withinCycle = frame % cycleFrames;
  const bursting = withinCycle < burstFrames;

  // Offsets change every frame during a burst, seeded so they are reproducible.
  const jitter = (key: string, amount: number) =>
    bursting ? (random(`${key}-${frame}`) - 0.5) * 2 * amount * intensity : 0;

  // Three horizontal slices that shift sideways during a burst.
  const slices = [0, 1, 2].map((i) => {
    const top = 18 + random(`slice-top-${cycle}-${i}`) * 55;
    return {
      top: `${top}%`,
      height: `${5 + random(`slice-h-${cycle}-${i}`) * 9}%`,
      shift: bursting ? (random(`slice-x-${cycle}-${i}`) - 0.5) * 90 * intensity : 0,
    };
  });

  const layer = (dx: number, dy: number, col: string, blend: string) => (
    <span
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: col,
        mixBlendMode: blend as React.CSSProperties['mixBlendMode'],
        translate: `${dx}px ${dy}px`,
      }}
    >
      {text}
    </span>
  );

  return (
    <AbsoluteFill
      name="Scene"
      style={{backgroundColor, justifyContent: 'center', alignItems: 'center', fontFamily}}
    >
      <Interactive.Div
        name="Glitch stack"
        style={{
          position: 'relative',
          width: 1300,
          height: 300,
          fontSize: 260,
          letterSpacing: '0.02em',
          opacity: interpolate(frame, [0, 10], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {/* Chromatic aberration: the coloured copies pull apart only during a burst. */}
        {layer(jitter('cyan-x', 14) - (bursting ? 6 : 0), jitter('cyan-y', 5), '#4cc9f0', 'screen')}
        {layer(jitter('mag-x', 14) + (bursting ? 6 : 0), jitter('mag-y', 5), '#c77dff', 'screen')}
        {layer(jitter('white-x', 4), 0, color, 'normal')}

        {/* Displaced slices, cut out of a copy of the word with clip-path. */}
        {bursting
          ? slices.map((s, i) => (
              <span
                key={i}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color,
                  clipPath: `inset(${s.top} 0 calc(100% - ${s.top} - ${s.height}) 0)`,
                  translate: `${s.shift}px 0px`,
                }}
              >
                {text}
              </span>
            ))
          : null}
      </Interactive.Div>

      <Interactive.Div
        name="Subtitle"
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 28,
          letterSpacing: '0.28em',
          marginRight: '-0.28em',
          textTransform: 'uppercase',
          color: '#4cc9f0',
          marginTop: 10,
          translate: `${jitter('sub', 8)}px 0px`,
          opacity: interpolate(frame, [12, 30], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {subtitle}
      </Interactive.Div>

      {/* Scanlines, always on — they tie the two states together. */}
      <AbsoluteFill
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgba(255,255,255,0.045) 0 2px, transparent 2px 5px)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
