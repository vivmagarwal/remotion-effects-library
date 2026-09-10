import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Kalam';
import {loadFont as loadSans} from '@remotion/google-fonts/Inter';

const {fontFamily: hand} = loadFont('normal', {weights: ['400', '700'], subsets: ['latin']});
const {fontFamily: sans} = loadSans('normal', {weights: ['500'], subsets: ['latin']});

/**
 * Write-On Text
 * Manim's `Write`: each glyph's outline is stroked on, then its fill arrives
 * behind it. Two layers of the same SVG text — one stroked with an animated
 * dash, one filled — is the whole mechanism, and the small delay between them is
 * what reads as ink being laid down rather than as a wipe.
 */

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly hand: string;
  readonly text: string;
  readonly bg: string;
  readonly paper: string;
  readonly series: readonly string[];
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  hand: hand,
  text: sans,
  bg: '#0a0b10',
  paper: '#f6f5f2',
  series: ['#ff5c39', '#4cc9f0', '#c6ff3d', '#ffd166', '#c77dff', '#8d93a5'],
};

type Props = {
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  /** CSS family for the display face. Defaults to this file's own, or the theme's. */
  readonly handFamily?: string;
  /** CSS family for the supporting text. Defaults to this file's Inter, or the theme's. */
  readonly textFamily?: string;
  readonly lines?: readonly string[];
  readonly caption?: string;
  /** Frames between one character starting and the next. */
  readonly stagger?: number;
  /** Frames a single glyph's outline takes to draw. */
  readonly strokeFrames?: number;
  /** Frames after a glyph's outline completes before its fill appears. */
  readonly fillDelay?: number;
  readonly startAt?: number;
  readonly inkColor?: string;
  readonly strokeColor?: string;
  readonly backgroundColor?: string;
  readonly fontSize?: number;
};

/** Manim's `smooth`: 3t² − 2t³. */
const smooth = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

export const WriteOnText: React.FC<Props> = ({
  theme = THEME,
  handFamily = theme.hand,
  textFamily = theme.text,
  lines = ['Write it on,', 'stroke first.'],
  caption = "MANIM'S Write() — OUTLINE, THEN FILL",
  stagger = 3.4,
  strokeFrames = 16,
  fillDelay = 5,
  startAt = 14,
  inkColor = theme.paper,
  strokeColor = theme.series[3],
  backgroundColor = theme.bg,
  fontSize = 168,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  // A generous dash length: it only has to exceed each glyph's outline, and any
  // excess simply sits off the end of the path.
  const DASH = fontSize * 6;

  let charIndex = 0;
  const lineHeight = fontSize * 1.24;
  const blockTop = height / 2 - ((lines.length - 1) * lineHeight) / 2;

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{backgroundImage: 'radial-gradient(ellipse at 50% 42%, rgba(255,255,255,0.055) 0%, rgba(0,0,0,0.42) 70%)'}}
      />

      {/* Faint ruled paper, so the writing has something to sit on. */}
      <AbsoluteFill
        style={{
          backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${lineHeight - 2}px, #ffffff0e ${lineHeight - 2}px ${lineHeight}px)`,
          backgroundPosition: `0 ${blockTop + fontSize * 0.34}px`,
        }}
      />

      <svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
        {lines.map((line, li) => {
          const y = blockTop + li * lineHeight;
          return line.split('').map((ch, ci) => {
            const i = charIndex++;
            const from = startAt + i * stagger;

            // Outline draws first…
            const stroke = smooth(interpolate(frame, [from, from + strokeFrames], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }));
            // …then the fill arrives behind it, a beat later.
            const fill = smooth(
              interpolate(frame, [from + fillDelay, from + fillDelay + strokeFrames], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            );

            if (stroke <= 0) return null;

            // Both layers are the SAME text at the SAME position, so the fill
            // lands exactly inside the outline that drew it.
            const common = {
              x: width / 2,
              y,
              textAnchor: 'middle' as const,
              dominantBaseline: 'middle' as const,
              fontFamily: handFamily,
              fontSize,
              fontWeight: 700,
              // Lay the characters out by shifting each one, so a single <text>
              // per glyph still forms a centred line.
              dx: (ci - (line.length - 1) / 2) * (fontSize * 0.44),
            };

            return (
              <g key={`${li}-${ci}`}>
                <text
                  {...common}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={2.4}
                  strokeLinejoin="round"
                  strokeDasharray={DASH}
                  strokeDashoffset={DASH * (1 - stroke)}
                  // The outline fades out once its fill has caught up, so the
                  // finished text is clean ink rather than outlined ink.
                  opacity={1 - fill}
                >
                  {ch}
                </text>
                <text {...common} fill={inkColor} opacity={fill}>
                  {ch}
                </text>
              </g>
            );
          });
        })}
      </svg>

      <Interactive.Div
        name="Caption"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 128,
          textAlign: 'center',
          fontFamily: textFamily,
          fontSize: 26,
          fontWeight: 500,
          letterSpacing: '0.3em',
          marginRight: '-0.3em',
          color: '#8d93a5',
        }}
      >
        {caption}
      </Interactive.Div>
    </AbsoluteFill>
  );
};
