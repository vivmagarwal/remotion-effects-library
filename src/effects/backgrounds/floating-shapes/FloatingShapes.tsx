import {AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Floating Shapes
 * Geometric confetti drifting upward on a loop. Depth is faked with three
 * independent knobs that all read from the same seeded "z": size, blur and
 * speed. The loop is seamless because every shape's vertical position is a
 * modulo of the frame — nothing ever needs to be recycled.
 */

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly scheme: 'dark' | 'light';
  readonly bg: string;
  readonly accentOnPaper: string;
  readonly series: readonly string[];
  readonly radius: number;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  scheme: 'dark',
  bg: '#0a0b10',
  accentOnPaper: '#c2410c',
  series: ['#ff5c39', '#4cc9f0', '#c6ff3d', '#ffd166', '#c77dff', '#8d93a5'],
  radius: 18,
};

type Props = {
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly count?: number;
  readonly colors?: readonly string[];
  readonly backgroundColor?: string;
  /** Screen heights travelled per 10 seconds at the front plane. */
  readonly speed?: number;
  readonly maxSize?: number;
};

const SHAPES = ['circle', 'square', 'triangle', 'ring', 'cross'] as const;

export const FloatingShapes: React.FC<Props> = ({
  theme = THEME,
  count = 46,
  // Indexed out of the theme's ordered palette rather than picked by eye — the
  // confetti IS the content, so literals here leave the effect unthemed.
  colors = [theme.series[0], theme.series[1], theme.series[3], theme.series[2], theme.series[4], theme.accentOnPaper],
  backgroundColor = theme.bg,
  speed = 0.5,
  maxSize = 130,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        overflow: 'hidden',
        // A glow rising from below. The dark scrim inverts on a light scheme:
        // rgba(0,0,0,0.42) over paper is a bruise, not a backdrop.
        backgroundImage:
          theme.scheme === 'light'
            ? 'radial-gradient(ellipse at 50% 120%, rgba(255,255,255,0.55) 0%, rgba(20,18,14,0.06) 62%)'
            : 'radial-gradient(ellipse at 50% 120%, rgba(255,255,255,0.055) 0%, rgba(0,0,0,0.42) 62%)',
      }}
    >
      {new Array(count).fill(0).map((_, i) => {
        // One seeded depth per shape. Everything else reads from it.
        const z = random(`z-${i}`);
        const size = (0.28 + z * 0.72) * maxSize;
        const drift = 0.3 + z * 0.7;

        // Vertical position wraps with a modulo — the loop is seamless and
        // no shape ever has to be "recycled" back to the bottom.
        const y = 110 - ((random(`y0-${i}`) * 130 + t * speed * drift * 26) % 130);
        const x =
          random(`x-${i}`) * 100 + Math.sin(t * (0.3 + z * 0.4) + i * 2.1) * (2 + z * 5);
        const spin = (random(`r-${i}`) - 0.5) * 120 * t * drift;
        const color = colors[Math.floor(random(`c-${i}`) * colors.length)];
        const shape = SHAPES[Math.floor(random(`s-${i}`) * SHAPES.length)];

        const base: React.CSSProperties = {
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          rotate: `${spin}deg`,
          // Far shapes are small, blurred and faint; near ones sharp and bold.
          filter: `blur(${(1 - z) * 5}px)`,
          opacity: (0.2 + z * 0.55) * interpolate(frame, [0, 24], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        };

        if (shape === 'circle') {
          return <div key={i} style={{...base, borderRadius: '50%', backgroundColor: color}} />;
        }
        if (shape === 'square') {
          return (
            <div
              key={i}
              style={{...base, borderRadius: size * 0.22 * (theme.radius / 18), backgroundColor: color}}
            />
          );
        }
        if (shape === 'ring') {
          return (
            <div
              key={i}
              style={{
                ...base,
                borderRadius: '50%',
                border: `${Math.max(3, size * 0.14)}px solid ${color}`,
              }}
            />
          );
        }
        if (shape === 'cross') {
          return (
            <div key={i} style={base}>
              <div style={{position: 'absolute', left: '42%', top: 0, width: '16%', height: '100%', borderRadius: size * 0.06 * (theme.radius / 18), backgroundColor: color}} />
              <div style={{position: 'absolute', top: '42%', left: 0, height: '16%', width: '100%', borderRadius: size * 0.06 * (theme.radius / 18), backgroundColor: color}} />
            </div>
          );
        }
        return (
          <div
            key={i}
            style={{
              ...base,
              backgroundColor: color,
              clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
