import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['400', '600', '800'], subsets: ['latin']});

/**
 * Line Chart Draw
 * The line draws itself with the stroke-dasharray trick: set the dash length to
 * the path's own length, then animate the offset from that length to zero. The
 * area fill and the travelling dot are tied to the same progress, so all three
 * arrive together.
 */

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly text: string;
  readonly bg: string;
  readonly pair: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  text: fontFamily,
  bg: '#0a0b10',
  pair: '#4cc9f0',
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly title?: string;
  readonly values?: readonly number[];
  readonly labels?: readonly string[];
  readonly lineColor?: string;
  readonly fillColor?: string;
  readonly backgroundColor?: string;
  readonly drawSeconds?: number;
  readonly unit?: string;
};

export const LineChartDraw: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  title = 'Weekly renders',
  values = [12, 19, 15, 28, 24, 41, 38, 56, 72, 68, 91, 118],
  labels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
  lineColor = theme.pair,
  fillColor = theme.pair,
  backgroundColor = theme.bg,
  drawSeconds = 2.2,
  unit = '',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const W = 1560;
  const H = 620;
  const PAD = 20;
  const max = Math.max(...values) * 1.12;

  const points = values.map((v, i) => ({
    x: PAD + (i / (values.length - 1)) * (W - PAD * 2),
    y: H - PAD - (v / max) * (H - PAD * 2),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`;

  // Approximate the path length so the dash trick has something to work with.
  const pathLength = points.reduce(
    (sum, p, i) => (i === 0 ? 0 : sum + Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y)),
    0,
  );

  const progress = interpolate(frame, [10, 10 + drawSeconds * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.35, 0, 0.15, 1),
  });

  // Where the leading dot currently sits along the polyline.
  const cursor = progress * (points.length - 1);
  const seg = Math.min(points.length - 2, Math.floor(cursor));
  const within = cursor - seg;
  const dotX = points[seg].x + (points[seg + 1].x - points[seg].x) * within;
  const dotY = points[seg].y + (points[seg + 1].y - points[seg].y) * within;
  const dotValue = values[seg] + (values[seg + 1] - values[seg]) * within;

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, padding: '78px 96px', fontFamily}}>
      <Interactive.Div
        name="Title"
        style={{fontSize: 50, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em'}}
      >
        {title}
      </Interactive.Div>
      <Interactive.Div
        name="Current value"
        style={{
          fontSize: 92,
          fontWeight: 800,
          color: lineColor,
          fontVariantNumeric: 'tabular-nums',
          marginTop: 4,
        }}
      >
        {Math.round(dotValue)}
        {unit}
      </Interactive.Div>

      <svg width={W} height={H} style={{marginTop: 24, overflow: 'visible'}}>
        <defs>
          <linearGradient id="lcd-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity={0.42} />
            <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
          </linearGradient>
          {/* The area is revealed by a wipe that tracks the same progress as the line. */}
          <clipPath id="lcd-clip">
            <rect x="0" y="0" width={progress * W} height={H} />
          </clipPath>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <line
            key={g}
            x1={0}
            x2={W}
            y1={PAD + g * (H - PAD * 2)}
            y2={PAD + g * (H - PAD * 2)}
            stroke="#ffffff10"
            strokeWidth={1}
          />
        ))}

        <path d={areaPath} fill="url(#lcd-fill)" clipPath="url(#lcd-clip)" />

        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          // The self-drawing trick: dash as long as the path, offset animating to 0.
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength * (1 - progress)}
          style={{filter: `drop-shadow(0 0 18px ${lineColor}66)`}}
        />

        <circle cx={dotX} cy={dotY} r={16} fill={lineColor} opacity={0.22} />
        <circle cx={dotX} cy={dotY} r={9} fill={lineColor} />
        <circle cx={dotX} cy={dotY} r={9} fill="none" stroke="#0a0b10" strokeWidth={3} />
      </svg>

      <div style={{display: 'flex', width: W, marginTop: 12}}>
        {labels.map((l, i) => (
          <span
            key={i}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 26,
              fontWeight: 600,
              color: i / (labels.length - 1) <= progress ? '#8d93a5' : '#4a4e5a',
            }}
          >
            {l}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
