import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Sora';

const {fontFamily} = loadFont('normal', {weights: ['400', '700'], subsets: ['latin']});

/**
 * Orbit System
 * Bodies on elliptical orbits around a glowing centre, seen at a tilt. The tilt
 * is the whole illusion: squashing y by `Math.cos(tilt)` turns a circle into an
 * ellipse, and swapping z-order when a body passes behind the centre is what
 * makes it read as 3D without any 3D library.
 */

type Body = {
  readonly name: string;
  readonly color: string;
  readonly radius: number;
  readonly size: number;
  /** Orbits per 10 seconds. */
  readonly speed: number;
  readonly phase: number;
  readonly hasRing?: boolean;
};

type Props = {
  readonly bodies?: readonly Body[];
  readonly starName?: string;
  readonly starColor?: string;
  readonly backgroundColor?: string;
  /**
   * Camera elevation above the orbital plane, in degrees. 90° is straight down
   * (perfect circles), 0° is edge-on (flat lines). Low values are what make the
   * inner planets actually cross the star.
   */
  readonly elevation?: number;
  readonly showLabels?: boolean;
};

export const OrbitSystem: React.FC<Props> = ({
  bodies = [
    {name: 'Mercury', color: '#8d93a5', radius: 158, size: 26, speed: 2.6, phase: 0.4},
    {name: 'Venus', color: '#ffd166', radius: 248, size: 38, speed: 1.75, phase: 2.35},
    {name: 'Earth', color: '#4cc9f0', radius: 338, size: 42, speed: 1.2, phase: 4.2},
    {name: 'Mars', color: '#ff5c39', radius: 432, size: 32, speed: 0.85, phase: 5.55},
    {name: 'Saturn', color: '#eef1f7', radius: 548, size: 56, speed: 0.58, phase: 1.15, hasRing: true},
  ],
  starName = 'SOL',
  starColor = '#ffd166',
  backgroundColor = '#04050a',
  elevation = 17,
  showLabels = true,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;

  const cx = width / 2;
  const cy = height / 2;
  // A circle seen from `elevation` degrees above its plane projects to an ellipse
  // whose height is sin(elevation) of its width. 90° is top-down (a circle), 0° is
  // edge-on. Keep this low — it is what brings the inner orbits close enough to the
  // star on screen for the occlusion below to actually happen.
  const squash = Math.sin((elevation * Math.PI) / 180);

  const placed = bodies.map((b) => {
    const angle = t * b.speed * 0.6 + b.phase;
    return {
      ...b,
      x: cx + Math.cos(angle) * b.radius,
      y: cy + Math.sin(angle) * b.radius * squash,
      // sin(angle) > 0 means the body is on the near side of the star.
      inFront: Math.sin(angle) > 0,
      angle,
    };
  });

  const reveal = (i: number) =>
    interpolate(frame, [i * 5, i * 5 + 24], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });

  const Planet: React.FC<{b: (typeof placed)[number]; i: number}> = ({b, i}) => (
    <div
      style={{
        position: 'absolute',
        left: b.x,
        top: b.y,
        translate: '-50% -50%',
        opacity: reveal(i),
      }}
    >
      {b.hasRing ? (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: b.size * 2.5,
            height: b.size * 2.5 * squash,
            marginLeft: -b.size * 1.25,
            marginTop: -b.size * 1.25 * squash,
            borderRadius: '50%',
            border: `${Math.max(2, b.size * 0.13)}px solid ${b.color}aa`,
            rotate: '-14deg',
          }}
        />
      ) : null}
      <div
        style={{
          width: b.size,
          height: b.size,
          borderRadius: '50%',
          // Light comes from the star, so the lit side faces the centre.
          // The star's direction *on screen* is squashed on y along with everything
          // else, so the highlight has to be too — otherwise the lighting disagrees
          // with the geometry at low elevations.
          backgroundImage: `radial-gradient(circle at ${50 - Math.cos(b.angle) * 26}% ${
            50 - Math.sin(b.angle) * squash * 26
          }%, ${b.color}, ${b.color}44 62%, #04050a 100%)`,
          boxShadow: `0 0 ${b.size * 0.7}px ${b.color}55`,
        }}
      />
      {showLabels ? (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            // Clear the ring, not just the body, or a ringed planet's label sits inside it.
            top: (b.hasRing ? b.size * 1.35 : b.size * 0.62) + 10,
            translate: '-50% 0',
            fontFamily,
            fontSize: 20,
            letterSpacing: '0.2em',
            color: '#8d93a5',
            whiteSpace: 'nowrap',
          }}
        >
          {b.name.toUpperCase()}
        </div>
      ) : null}
    </div>
  );

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, overflow: 'hidden'}}>
      {/* Orbit paths, drawn as squashed rings. */}
      {bodies.map((b, i) => (
        <div
          key={b.name}
          style={{
            position: 'absolute',
            left: cx,
            top: cy,
            width: b.radius * 2,
            height: b.radius * 2 * squash,
            marginLeft: -b.radius,
            marginTop: -b.radius * squash,
            borderRadius: '50%',
            border: '1px solid #ffffff14',
            opacity: reveal(i),
          }}
        />
      ))}

      {/* Bodies currently behind the star. */}
      {placed.map((b, i) => (!b.inFront ? <Planet key={b.name} b={b} i={i} /> : null))}

      {/* The star. */}
      <Interactive.Div
        name="Star"
        style={{
          position: 'absolute',
          left: cx,
          top: cy,
          width: 180,
          height: 180,
          marginLeft: -90,
          marginTop: -90,
          borderRadius: '50%',
          backgroundImage: `radial-gradient(circle, #ffffff 0%, ${starColor} 45%, ${starColor}00 72%)`,
          boxShadow: `0 0 180px ${starColor}88, 0 0 400px ${starColor}44`,
          scale: interpolate(frame, [0, 26], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: 'perceptual-scale',
          }),
        }}
      />

      {/* Bodies in front of the star — drawn after it, so they occlude it. */}
      {placed.map((b, i) => (b.inFront ? <Planet key={b.name} b={b} i={i} /> : null))}

      <Interactive.Div
        name="Title"
        style={{
          position: 'absolute',
          left: 88,
          top: 76,
          fontFamily,
          fontSize: 52,
          fontWeight: 700,
          letterSpacing: '0.32em',
          color: '#eef1f7',
          opacity: interpolate(frame, [10, 34], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {starName}
      </Interactive.Div>
    </AbsoluteFill>
  );
};
