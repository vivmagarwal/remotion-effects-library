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
  // The resting dot. 0.22 alpha multiplied by a 0.35 base opacity is an
  // effective 0.077 against #0a0b10 — a grid that is not there. The grid has
  // to be visible for the wave to be a wave THROUGH something.
  color = 'rgba(141,147,165,0.5)',
  accentColor = '#4cc9f0',
  backgroundColor = '#0a0b10',
  frequency = 0.28,
  // 22, not 13. The grid is 42 cells wide, so a 13-cell reach lights about a
  // third of it and the rest of the frame is dead field.
  falloff = 22,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  // The wave origin drifts, so successive passes come from different angles.
  const originX = columns / 2 + Math.cos(t * 0.32) * columns * 0.34;
  // 0.22 on Y, not 0.34: at 0.34 the origin leaves the frame vertically and the
  // ring is cut off by the bottom edge for a third of the loop.
  const originY = rows / 2 + Math.sin(t * 0.24) * rows * 0.22;

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
            opacity: 0.5 + energy * 0.5,
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
            'radial-gradient(ellipse at 50% 50%, transparent 54%, rgba(8,10,16,0.7) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
