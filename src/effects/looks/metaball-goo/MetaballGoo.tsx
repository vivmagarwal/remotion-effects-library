import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Metaball Goo
 * Circles that merge into each other with liquid necks, using nothing but two
 * SVG filter primitives. Blur everything so neighbouring shapes bleed together,
 * then crank the alpha channel's contrast so the soft bleed snaps back to a
 * hard edge — wherever two blurs overlapped, the result is now one solid shape.
 * No WebGL, no per-pixel maths, and it composites over anything.
 */

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly text: string;
  readonly accent: string;
  readonly bg: string;
  readonly series: readonly string[];
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  text: fontFamily,
  accent: '#ff5c39',
  bg: '#0a0b10',
  series: ['#ff5c39', '#4cc9f0', '#c6ff3d', '#ffd166', '#c77dff', '#8d93a5'],
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly title?: string;
  readonly caption?: string;
  /** How many blobs orbit the centre. */
  readonly count?: number;
  /** Blur radius. Bigger = necks form from further apart. */
  readonly blur?: number;
  /** Alpha contrast. Below ~12 the edge stays soft; above ~40 the necks snap. */
  readonly contrast?: number;
  /** Alpha bias. Roughly contrast * 0.4 keeps the blobs their original size. */
  readonly cutoff?: number;
  readonly gooColor?: string;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
};

export const MetaballGoo: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  title = 'Metaballs',
  caption = 'feGaussianBlur + feColorMatrix · no WebGL',
  count = 7,
  blur = 26,
  contrast = 34,
  cutoff = 13,
  gooColor = theme.series[2],
  accentColor = theme.accent,
  backgroundColor = theme.bg,
}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();

  const t = frame / fps;
  const cx = width / 2;
  const cy = height / 2 + 24;

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, fontFamily, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{backgroundImage: `radial-gradient(ellipse at 50% 50%, ${gooColor}14 0%, transparent 64%)`}}
      />

      <svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="goo" x="-30%" y="-30%" width="160%" height="160%">
            {/* 1. Bleed neighbouring shapes into each other. */}
            <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blurred" />
            {/* 2. Snap the alpha back to a hard edge. Only the ALPHA row is
                   touched: multiply by `contrast`, then subtract `cutoff`.
                   Everything above the cutoff becomes opaque, everything below
                   becomes transparent — and where two blurs overlapped, the sum
                   crosses the cutoff, which is the neck. */}
            <feColorMatrix
              in="blurred"
              mode="matrix"
              values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${contrast} -${cutoff}`}
              result="goo"
            />
            {/* 3. Put the crisp originals back on top of the merged mass. */}
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>

        <g filter="url(#goo)">
          {new Array(count).fill(0).map((_, i) => {
            // Each blob gets its own orbit radius, speed and phase, so they
            // drift apart and re-merge instead of moving as one rigid ring.
            const phase = (i / count) * Math.PI * 2;
            const speed = 0.34 + (i % 3) * 0.16;
            const orbit = 118 + (i % 4) * 62;
            const r = 46 + (i % 3) * 20;

            // A slow breathe on the orbit is what makes them actually touch.
            const breathe = 1 + Math.sin(t * 0.55 + phase) * 0.34;

            const x = cx + Math.cos(t * speed + phase) * orbit * breathe;
            const y = cy + Math.sin(t * speed * 1.28 + phase) * orbit * 0.62 * breathe;

            return <circle key={i} cx={x} cy={y} r={r} fill={gooColor} />;
          })}
          {/* A fixed core so the mass always has something to merge back into. */}
          <circle cx={cx} cy={cy} r={72} fill={gooColor} />
        </g>
      </svg>

      <AbsoluteFill
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '104px 0 96px',
          pointerEvents: 'none',
        }}
      >
        <Interactive.Div
          name="Title"
          style={{
            fontSize: 62,
            fontWeight: 800,
            letterSpacing: '-0.025em',
            color: '#ffffff',
            textShadow: '0 4px 30px rgba(0,0,0,0.8)',
            opacity: interpolate(frame, [0, 22], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          {title}
        </Interactive.Div>
        <Interactive.Div
          name="Caption"
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            // SMALL, the 34px floor. It was 25px, which is unreadable at the
            // 0.17x the gallery card renders at — and a caption nobody can read
            // is just noise along the bottom edge.
            fontSize: 34,
            color: accentColor,
            textShadow: '0 2px 20px rgba(0,0,0,0.9)',
            opacity: interpolate(frame, [12, 34], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {caption}
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
