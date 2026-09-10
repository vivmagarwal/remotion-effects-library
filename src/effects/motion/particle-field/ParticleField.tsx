import {AbsoluteFill, Interactive, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Sora';

const {fontFamily} = loadFont('normal', {weights: ['300', '700'], subsets: ['latin']});

/**
 * Particle Field
 * Hundreds of particles drifting through 3D-ish space toward the camera. There is
 * no particle state and no per-frame update loop: each particle's position is a
 * closed-form function of the frame and its seed, so any frame can be rendered
 * on its own. That property is what makes it renderable at all.
 */

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly text: string;
  readonly bgDeep: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  text: fontFamily,
  bgDeep: '#04050a',
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly count?: number;
  readonly title?: string;
  readonly subtitle?: string;
  readonly colors?: readonly string[];
  readonly backgroundColor?: string;
  /** Depth units travelled per second. */
  readonly speed?: number;
  readonly connect?: boolean;
};

export const ParticleField: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  count = 220,
  title = 'PARTICLES',
  subtitle = 'closed-form, not simulated',
  colors = ['#4cc9f0', '#c77dff', '#ffd166', '#ffffff'],
  backgroundColor = theme.bgDeep,
  speed = 0.22,
  connect = true,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;

  const particles = new Array(count).fill(0).map((_, i) => {
    // Angle and radius in a notional cylinder around the camera axis.
    const angle = random(`a-${i}`) * Math.PI * 2;
    const spread = 0.18 + random(`r-${i}`) * 0.82;

    // Depth wraps in [0,1) — the modulo is what makes this loop forever without state.
    const z = (random(`z-${i}`) + t * speed) % 1;
    // Perspective: near particles (z→1) are pushed outward and drawn larger.
    const persp = 0.22 + z * z * 1.9;

    const x = 50 + Math.cos(angle) * spread * 44 * persp;
    const y = 50 + Math.sin(angle) * spread * 40 * persp;
    const size = (1.2 + random(`s-${i}`) * 3.4) * persp;

    return {
      x,
      y,
      size,
      z,
      color: colors[Math.floor(random(`c-${i}`) * colors.length)],
      // Fade in from the far plane and out as they sweep past the camera.
      opacity: Math.min(1, z * 4) * (1 - Math.max(0, (z - 0.86) / 0.14)),
    };
  });

  // Cheap constellation: link only near neighbours among the closest particles.
  const links: {x1: number; y1: number; x2: number; y2: number; o: number}[] = [];
  if (connect) {
    const near = particles.filter((p) => p.z > 0.42 && p.z < 0.9);
    for (let i = 0; i < near.length; i++) {
      for (let j = i + 1; j < near.length; j++) {
        const d = Math.hypot(near[i].x - near[j].x, near[i].y - near[j].y);
        if (d < 8.5) {
          links.push({
            x1: near[i].x,
            y1: near[i].y,
            x2: near[j].x,
            y2: near[j].y,
            o: (1 - d / 8.5) * 0.34,
          });
        }
      }
    }
  }

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{backgroundImage: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.055) 0%, rgba(0,0,0,0.42) 68%)'}}
      />

      {connect ? (
        <svg width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
          {links.map((l, i) => (
            <line
              key={i}
              x1={`${l.x1}%`}
              y1={`${l.y1}%`}
              x2={`${l.x2}%`}
              y2={`${l.y2}%`}
              stroke="#4cc9f0"
              strokeWidth={1}
              opacity={l.o}
            />
          ))}
        </svg>
      ) : null}

      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
            borderRadius: '50%',
            backgroundColor: p.color,
            opacity: p.opacity,
            boxShadow: p.size > 3 ? `0 0 ${p.size * 3}px ${p.color}` : undefined,
          }}
        />
      ))}

      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', fontFamily}}>
        <Interactive.Div
          name="Title"
          style={{
            fontSize: 132,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: '#ffffff',
            textShadow: '0 0 70px rgba(76,201,240,0.5)',
            opacity: interpolate(frame, [10, 34], [0, 1], {
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
            fontWeight: 300,
            letterSpacing: '0.3em',
            marginRight: '-0.3em',
            textTransform: 'uppercase',
            color: '#8d93a5',
            marginTop: 20,
            opacity: interpolate(frame, [24, 46], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {subtitle}
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
