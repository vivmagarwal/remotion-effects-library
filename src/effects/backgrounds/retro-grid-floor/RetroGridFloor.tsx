import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Orbitron';

const {fontFamily} = loadFont('normal', {weights: ['500', '800'], subsets: ['latin']});

/**
 * Retro Grid Floor
 * The synthwave horizon. The floor is a real perspective projection, not a
 * skewed rectangle: each horizontal line's screen position comes from projecting
 * a constant-spaced depth, which is what makes the lines bunch toward the
 * horizon the way a real plane does.
 */

type Props = {
  readonly title?: string;
  readonly subtitle?: string;
  readonly gridColor?: string;
  readonly sunTop?: string;
  readonly sunBottom?: string;
  readonly skyTop?: string;
  readonly skyBottom?: string;
  /** Rows of the grid that scroll past per second. */
  readonly speed?: number;
  readonly columns?: number;
  readonly rows?: number;
};

export const RetroGridFloor: React.FC<Props> = ({
  title = 'OVERDRIVE',
  subtitle = 'SIDE A · 1984',
  gridColor = '#ff5c39',
  sunTop = '#ffd166',
  sunBottom = '#ff5c39',
  skyTop = '#04050a',
  skyBottom = '#c2410c',
  speed = 0.55,
  columns = 26,
  rows = 22,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;

  const horizon = height * 0.55;
  const floorDepth = height - horizon;

  // Project a depth z (1 = at the camera, →0 at the horizon) onto the screen.
  // Non-linear on purpose: this is what bunches the lines near the horizon.
  const project = (z: number) => horizon + floorDepth * (1 / (z + 1)) * 2 - floorDepth;

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        overflow: 'hidden',
        backgroundImage: `linear-gradient(${skyTop} 0%, ${skyBottom} 55%, #0a0b10 100%)`,
        fontFamily,
      }}
    >
      {/* Sun, sitting on the horizon and sliced by its own scanlines. */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: horizon,
          width: 640,
          height: 640,
          marginLeft: -320,
          marginTop: -430,
          borderRadius: '50%',
          backgroundImage: `linear-gradient(${sunTop}, ${sunBottom})`,
          // The slots widen toward the bottom — the classic synthwave sun.
          maskImage:
            'linear-gradient(black 0 58%, transparent 58% 61%, black 61% 70%, transparent 70% 74%, black 74% 80%, transparent 80% 85%, black 85% 88%, transparent 88% 100%)',
          WebkitMaskImage:
            'linear-gradient(black 0 58%, transparent 58% 61%, black 61% 70%, transparent 70% 74%, black 74% 80%, transparent 80% 85%, black 85% 88%, transparent 88% 100%)',
          filter: `drop-shadow(0 0 90px ${sunBottom}88)`,
        }}
      />

      {/* Everything below the horizon is the floor. */}
      <div style={{position: 'absolute', left: 0, right: 0, top: horizon, bottom: 0, overflow: 'hidden'}}>
        <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          {/* Horizontals: constant spacing in depth, projected to the screen. */}
          {new Array(rows).fill(0).map((_, i) => {
            // The scroll is a fractional offset on the row index — so rows enter
            // at the horizon and accelerate toward the camera, and it loops.
            const z = ((i + ((t * speed) % 1)) / rows) * 2.4;
            const y = project(z) - horizon;
            if (y < -2 || y > floorDepth + 2) return null;
            return (
              <line
                key={i}
                x1={-width}
                x2={width * 2}
                y1={y}
                y2={y}
                stroke={gridColor}
                strokeWidth={1.6}
                opacity={0.16 + (y / floorDepth) * 0.7}
              />
            );
          })}

          {/* Verticals: all converge on the vanishing point. */}
          {new Array(columns + 1).fill(0).map((_, i) => {
            const spread = (i / columns - 0.5) * width * 5;
            return (
              <line
                key={i}
                x1={width / 2}
                y1={0}
                x2={width / 2 + spread}
                y2={floorDepth}
                stroke={gridColor}
                strokeWidth={1.6}
                opacity={0.5 - Math.abs(i / columns - 0.5) * 0.55}
              />
            );
          })}
        </svg>

        {/* Haze at the horizon, so the lines dissolve instead of stopping dead. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(${skyBottom} 0%, transparent 26%)`,
          }}
        />
      </div>

      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', paddingBottom: height * 0.24}}>
        <Interactive.Div
          name="Title"
          style={{
            fontSize: 168,
            fontWeight: 800,
            letterSpacing: '0.06em',
            marginRight: '-0.06em',
            color: '#fff',
            textShadow: `0 0 40px ${gridColor}, 0 6px 0 ${gridColor}77`,
            scale: interpolate(frame, [0, 30], [0.9, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              output: 'perceptual-scale',
            }),
            opacity: interpolate(frame, [0, 18], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {title}
        </Interactive.Div>
        <Interactive.Div
          name="Subtitle"
          style={{
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: '0.5em',
            marginRight: '-0.5em',
            color: sunTop,
            marginTop: 22,
            opacity: interpolate(frame, [16, 40], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {subtitle}
        </Interactive.Div>
      </AbsoluteFill>

      {/* Scanlines over everything. */}
      <AbsoluteFill
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgba(0,0,0,0.16) 0 2px, transparent 2px 5px)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
