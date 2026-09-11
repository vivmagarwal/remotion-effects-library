import {useMemo} from 'react';
import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {interpolatePath} from '@remotion/paths';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Shape Morph
 * One silhouette becoming another. `interpolatePath(progress, a, b)` from
 * @remotion/paths blends two path strings instruction by instruction. It is
 * tolerant — it will pad a shorter path and promote an L to a C to match — but
 * a morph only looks *deliberate* when both shapes have the same number of
 * points in the same winding order, so these are all generated as 12-gons.
 */

const CENTER = 100;
const POINTS = 12;

/** `M x y L x y … Z` from a list of points. */
const toPath = (pts: readonly (readonly [number, number])[]) =>
  `M ${pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L ')} Z`;

/** All four shapes start at the top and wind clockwise, so points correspond. */
const circle = (r: number) =>
  toPath(
    new Array(POINTS).fill(0).map((_, i) => {
      const a = (i / POINTS) * Math.PI * 2 - Math.PI / 2;
      return [CENTER + Math.cos(a) * r, CENTER + Math.sin(a) * r] as const;
    }),
  );

const star = (outer: number, inner: number) =>
  toPath(
    new Array(POINTS).fill(0).map((_, i) => {
      const a = (i / POINTS) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? outer : inner;
      return [CENTER + Math.cos(a) * r, CENTER + Math.sin(a) * r] as const;
    }),
  );

const square = (lo: number, hi: number) => {
  const t = (lo + hi) / 2;
  const third = (hi - lo) / 3;
  return toPath([
    // Top edge, sampled in thirds so each side carries three points.
    [t, lo],
    [lo + third * 2, lo],
    [hi, lo],
    [hi, lo + third],
    [hi, lo + third * 2],
    [hi, hi],
    [lo + third * 2, hi],
    [lo + third, hi],
    [lo, hi],
    [lo, lo + third * 2],
    [lo, lo + third],
    [lo, lo],
  ]);
};

const plus = (arm: number, lo: number, hi: number) => {
  const a = CENTER - arm / 2;
  const b = CENTER + arm / 2;
  return toPath([
    [a, lo],
    [b, lo],
    [b, a],
    [hi, a],
    [hi, b],
    [b, b],
    [b, hi],
    [a, hi],
    [a, b],
    [lo, b],
    [lo, a],
    [a, a],
  ]);
};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
/**
 * A system monospace stack. It is the inline default for the theme's `mono`
 * token, so a pasted file needs no extra font download, and a theme that names
 * a loaded monospace family replaces it.
 */
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

type Theme = {
  readonly scheme: 'dark' | 'light';
  readonly mono: string;
  readonly muted: string;
  readonly text: string;
  readonly bg: string;
  readonly body: string;
  readonly series: readonly string[];
  readonly stroke: number;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  scheme: 'dark',
  mono: MONO,
  muted: '#8d93a5',
  text: fontFamily,
  bg: '#0a0b10',
  body: '#eef1f7',
  series: ['#ff5c39', '#4cc9f0', '#c6ff3d', '#ffd166', '#c77dff', '#8d93a5'],
  stroke: 3,
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly shapes?: readonly {readonly name: string; readonly d: string}[];
  readonly caption?: string;
  /** Frames spent morphing from one shape to the next. */
  readonly morphFrames?: number;
  /** Frames a completed shape is held. */
  readonly holdFrames?: number;
  readonly accentColor?: string;
  readonly backgroundColor?: string;
  readonly textColor?: string;
};

const DEFAULT_SHAPES = [
  {name: 'square', d: square(18, 182)},
  {name: 'circle', d: circle(82)},
  {name: 'star', d: star(90, 40)},
  {name: 'plus', d: plus(58, 16, 184)},
];

export const ShapeMorph: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  shapes = DEFAULT_SHAPES,
  caption = 'interpolatePath(p, a, b) · @remotion/paths',
  morphFrames = 26,
  holdFrames = 16,
  accentColor = theme.series[4],
  backgroundColor = theme.bg,
  textColor = theme.body,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const cycle = morphFrames + holdFrames;
  const index = Math.floor(frame / cycle) % shapes.length;
  const next = (index + 1) % shapes.length;

  // Hold first, then morph — so each shape is legible before it changes.
  const p = interpolate(frame % cycle, [holdFrames, cycle], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });

  const d = useMemo(
    () => interpolatePath(p, shapes[index].d, shapes[next].d),
    [p, shapes, index, next],
  );

  // 0.42 of the width, not 0.3. At 0.3 the shape occupies about a ninth of the
  // frame's area, and on a gallery card that is a small purple mark on black —
  // an effect that reads as nothing until you open it full size.
  const SIZE = Math.min(width * 0.42, height * 0.62);

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor, fontFamily, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{backgroundImage: `radial-gradient(ellipse at 50% 46%, ${accentColor}33 0%, transparent 64%)`}}
      />

      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <svg width={SIZE} height={SIZE} viewBox="0 0 200 200" style={{overflow: 'visible'}}>
          <path
            d={d}
            // The fill was 2e (18% alpha) on a near-black ground, which is a
            // 1.2:1 shape. Interpolating a polygon is only legible if you can
            // see the polygon.
            fill={`${accentColor}52`}
            stroke={accentColor}
            strokeWidth={theme.stroke * 1.5}
            strokeLinejoin="round"
          />
          {/* The vertices, so you can see that the points correspond one-to-one
              through the morph rather than the outline being re-sampled. */}
          {d
            .replace(/[MLZ]/g, ' ')
            .trim()
            .split(/\s+/)
            .reduce<number[][]>((acc, n, i) => {
              if (i % 2 === 0) acc.push([Number(n)]);
              else acc[acc.length - 1].push(Number(n));
              return acc;
            }, [])
            .map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={3.6} fill={textColor} opacity={0.92} />
            ))}
        </svg>

        <Interactive.Div
          name="Label"
          style={{
            marginTop: 62,
            fontSize: 52,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: textColor,
          }}
        >
          {/* Flips at the halfway point, so the name matches what you see. */}
          {p < 0.5 ? shapes[index].name : shapes[next].name}
        </Interactive.Div>

        <div
          style={{
            marginTop: 26,
            width: 320,
            height: 5,
            borderRadius: 3,
            // A white hairline is invisible on paper; a black one is invisible
            // on the dark ground. Pick from the scheme, not from the colour.
            backgroundColor: theme.scheme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}
        >
          <div style={{width: `${p * 100}%`, height: '100%', backgroundColor: accentColor}} />
        </div>

        <Interactive.Div
          name="Caption"
          style={{
            position: 'absolute',
            bottom: 84,
            fontFamily: theme.mono,
            fontSize: 25,
            color: theme.muted,
          }}
        >
          {caption}
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
