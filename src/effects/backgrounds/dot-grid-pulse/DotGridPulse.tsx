import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Dot Grid Pulse
 * A field of dots with a wave travelling through it. Each dot's scale and opacity
 * come from its distance to a moving origin, so the wave is a property of the
 * geometry rather than a per-dot animation — which means one formula scales to
 * a thousand dots with no extra work.
 */

type Props = {
  readonly columns?: number;
  readonly rows?: number;
  readonly dotSize?: number;
  readonly color?: string;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
  /** Waves per second. */
  readonly frequency?: number;
  /** How far the wave reaches, in grid cells. */
  readonly falloff?: number;
};

export const DotGridPulse: React.FC<Props> = ({
  columns = 42,
  rows = 24,
  dotSize = 7,
  color = '#2a3044',
  accentColor = '#5eead4',
  backgroundColor = '#080a10',
  frequency = 0.28,
  falloff = 13,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  // The wave origin drifts, so successive passes come from different angles.
  const originX = columns / 2 + Math.cos(t * 0.32) * columns * 0.34;
  const originY = rows / 2 + Math.sin(t * 0.24) * rows * 0.34;

  const dots = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const dist = Math.hypot(c - originX, r - originY);
      // A travelling ring: phase shifts with distance, amplitude decays with it.
      const wave = Math.sin(t * frequency * Math.PI * 2 - dist / 3.2);
      const decay = Math.max(0, 1 - dist / falloff);
      const energy = Math.max(0, wave) * decay;

      dots.push(
        <div
          key={`${r}-${c}`}
          style={{
            position: 'absolute',
            left: `${((c + 0.5) / columns) * 100}%`,
            top: `${((r + 0.5) / rows) * 100}%`,
            width: dotSize,
            height: dotSize,
            marginLeft: -dotSize / 2,
            marginTop: -dotSize / 2,
            borderRadius: '50%',
            backgroundColor: energy > 0.04 ? accentColor : color,
            scale: 1 + energy * 2.4,
            opacity: 0.35 + energy * 0.65,
          }}
        />,
      );
    }
  }

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, overflow: 'hidden'}}>
      {dots}
      <AbsoluteFill
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(8,10,16,0.85) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
