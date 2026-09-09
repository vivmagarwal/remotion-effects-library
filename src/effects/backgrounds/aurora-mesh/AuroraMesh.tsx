import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Aurora Mesh
 * A slow, endlessly drifting mesh gradient — the "expensive SaaS landing page"
 * background. Each blob is a radial gradient orbiting its own centre on a
 * different frequency, so the field never repeats visibly. Heavy blur plus
 * `screen` blending is what fuses the separate blobs into one soft mass.
 */

type Blob = {
  readonly color: string;
  readonly x: number;
  readonly y: number;
  readonly size: number;
  /** Orbit radius in percent of the frame. */
  readonly travel: number;
  /** Orbits per 10 seconds — keep these mutually irrational-ish. */
  readonly speed: number;
  readonly phase: number;
};

type Props = {
  readonly blobs?: readonly Blob[];
  readonly backgroundColor?: string;
  readonly blur?: number;
  readonly grain?: boolean;
};

export const AuroraMesh: React.FC<Props> = ({
  blobs = [
    {color: '#7c3aed', x: 28, y: 32, size: 62, travel: 11, speed: 0.31, phase: 0},
    {color: '#2563eb', x: 70, y: 28, size: 58, travel: 13, speed: 0.23, phase: 1.9},
    {color: '#db2777', x: 62, y: 70, size: 54, travel: 10, speed: 0.27, phase: 3.4},
    {color: '#0891b2', x: 33, y: 72, size: 60, travel: 12, speed: 0.19, phase: 5.1},
    {color: '#f59e0b', x: 50, y: 50, size: 40, travel: 16, speed: 0.15, phase: 2.6},
  ],
  backgroundColor = '#080711',
  blur = 90,
  grain = true,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, overflow: 'hidden'}}>
      {blobs.map((b, i) => {
        // Two different trig functions per axis keeps the path an ellipse, not a circle.
        const x = b.x + Math.cos(t * b.speed * Math.PI * 2 + b.phase) * b.travel;
        const y = b.y + Math.sin(t * b.speed * Math.PI * 2 * 0.8 + b.phase) * b.travel * 0.7;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x - b.size / 2}%`,
              top: `${y - b.size / 2}%`,
              width: `${b.size}%`,
              height: `${b.size}%`,
              borderRadius: '50%',
              backgroundImage: `radial-gradient(circle, ${b.color} 0%, ${b.color}00 70%)`,
              // Blur + screen is what fuses separate blobs into one soft field.
              filter: `blur(${blur}px)`,
              mixBlendMode: 'screen',
              opacity: interpolate(frame, [0, 20], [0, 0.95], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          />
        );
      })}

      {/* A dark vignette pulls the eye to the middle and hides the blur's edges. */}
      <AbsoluteFill
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(4,3,10,0.72) 100%)',
        }}
      />

      {grain ? (
        <AbsoluteFill
          style={{
            opacity: 0.16,
            mixBlendMode: 'overlay',
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
