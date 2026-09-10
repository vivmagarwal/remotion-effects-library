import {AbsoluteFill, Interactive, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {hierarchy, pack} from 'd3-hierarchy';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Bubble Pack
 * A circle-packing chart, laid out by d3-hierarchy. D3 does the geometry and
 * React does the drawing — the layout is computed once from the data and is
 * completely deterministic, so every frame agrees with every other. Only the
 * reveal is animated.
 */

type Datum = {readonly label: string; readonly value: number; readonly group: string};

/**
 * One node type for both the synthetic root and the leaves — d3-hierarchy walks
 * a single tree type, so trying to give the root and the leaves different shapes
 * is what makes the generics fight you.
 */
type PackNode = {
  readonly label?: string;
  readonly value?: number;
  readonly group?: string;
  readonly children?: readonly PackNode[];
};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly text: string;
  readonly bg: string;
  readonly paper: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  text: fontFamily,
  bg: '#0a0b10',
  paper: '#f6f5f2',
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly title?: string;
  readonly subtitle?: string;
  readonly data?: readonly Datum[];
  readonly palette?: Readonly<Record<string, string>>;
  /** Frames between one bubble arriving and the next. */
  readonly stagger?: number;
  readonly startAt?: number;
  readonly backgroundColor?: string;
  readonly paperColor?: string;
};

const DEFAULT_DATA: Datum[] = [
  {label: 'React', value: 96, group: 'ui'},
  {label: 'Remotion', value: 74, group: 'video'},
  {label: 'three.js', value: 58, group: 'gfx'},
  {label: 'D3', value: 52, group: 'data'},
  {label: 'SVG', value: 44, group: 'gfx'},
  {label: 'Canvas', value: 38, group: 'gfx'},
  {label: 'WebGL', value: 34, group: 'gfx'},
  {label: 'FFmpeg', value: 30, group: 'video'},
  {label: 'CSS', value: 27, group: 'ui'},
  {label: 'Zod', value: 20, group: 'data'},
  {label: 'Vite', value: 17, group: 'ui'},
  {label: 'Node', value: 14, group: 'data'},
];

const DEFAULT_PALETTE: Record<string, string> = {
  ui: '#4cc9f0',
  video: '#ff5c39',
  gfx: '#c77dff',
  data: '#c6ff3d',
};

export const BubblePack: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  title = 'What a Remotion video is made of',
  subtitle = 'circle packing · d3-hierarchy',
  data = DEFAULT_DATA,
  palette = DEFAULT_PALETTE,
  stagger = 5,
  startAt = 18,
  backgroundColor = theme.bg,
  paperColor = theme.paper,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  const SIZE = Math.min(width - 260, height - 300);
  const cx = width / 2;
  const cy = height / 2 + 46;

  // D3 computes the layout. It is a pure function of the data — no simulation,
  // no state — so it is identical on every frame and safe to recompute.
  const root = pack<PackNode>()
    .size([SIZE, SIZE])
    .padding(9)(
    hierarchy<PackNode>({children: data}, (d) => d.children as PackNode[]).sum(
      (d) => d.value ?? 0,
    ),
  );

  const leaves = root.leaves();

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        backgroundImage: 'radial-gradient(ellipse at 50% 46%, rgba(255,255,255,0.055) 0%, rgba(0,0,0,0.42) 68%)',
        fontFamily,
        overflow: 'hidden',
      }}
    >
      <Interactive.Div
        name="Title"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 92,
          textAlign: 'center',
          fontSize: 58,
          fontWeight: 800,
          letterSpacing: '-0.025em',
          color: paperColor,
          opacity: interpolate(frame, [0, 20], [0, 1], {
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
          position: 'absolute',
          left: 0,
          right: 0,
          top: 164,
          textAlign: 'center',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 26,
          color: '#8d93a5',
          opacity: interpolate(frame, [8, 28], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {subtitle}
      </Interactive.Div>

      <svg
        width={SIZE}
        height={SIZE}
        style={{position: 'absolute', left: cx - SIZE / 2, top: cy - SIZE / 2, overflow: 'visible'}}
      >
        {leaves.map((leaf, i) => {
          const d = leaf.data;
          const colour = palette[d.group ?? ''] ?? '#8d93a5';
          // Biggest bubbles first: the chart builds from its centre of mass out.
          const pop = spring({
            frame: frame - (startAt + i * stagger),
            fps,
            config: {damping: 14, stiffness: 165, mass: 0.75},
          });
          const p = Math.min(1, pop);
          if (p <= 0) return null;

          // Only the radius is animated — the position comes straight from D3
          // and never moves, so bubbles grow into their final packing rather
          // than sliding into it.
          const r = leaf.r * (0.2 + pop * 0.8);
          const showLabel = leaf.r > 44;

          return (
            <g key={d.label} opacity={Math.min(1, pop * 1.6)}>
              <circle
                cx={leaf.x}
                cy={leaf.y}
                r={r}
                fill={`${colour}26`}
                stroke={colour}
                strokeWidth={2.5}
              />
              {showLabel ? (
                <>
                  <text
                    x={leaf.x}
                    y={leaf.y - (leaf.r > 70 ? 6 : 0)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={paperColor}
                    fontFamily={fontFamily}
                    fontSize={Math.min(38, leaf.r * 0.42)}
                    fontWeight={700}
                    opacity={interpolate(p, [0.6, 1], [0, 1], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    })}
                  >
                    {d.label}
                  </text>
                  {leaf.r > 70 ? (
                    <text
                      x={leaf.x}
                      y={leaf.y + 30}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={colour}
                      fontFamily={fontFamily}
                      fontSize={26}
                      fontWeight={800}
                      opacity={interpolate(p, [0.7, 1], [0, 1], {
                        extrapolateLeft: 'clamp',
                        extrapolateRight: 'clamp',
                      })}
                    >
                      {d.value}
                    </text>
                  ) : null}
                </>
              ) : null}
            </g>
          );
        })}
      </svg>

      {/* Legend, keyed off the palette so it can never drift from the chart. */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 78,
          display: 'flex',
          justifyContent: 'center',
          gap: 42,
        }}
      >
        {Object.entries(palette).map(([group, colour], i) => (
          <div
            key={group}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 28,
              fontWeight: 500,
              color: '#eef1f7',
              opacity: interpolate(frame, [40 + i * 5, 58 + i * 5], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            <span style={{width: 16, height: 16, borderRadius: 8, backgroundColor: colour}} />
            {group}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
