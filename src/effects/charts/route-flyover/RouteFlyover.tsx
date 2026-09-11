import {AbsoluteFill, Easing, Interactive, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {evolvePath, getLength, getPointAtLength, getTangentAtLength} from '@remotion/paths';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

/**
 * Route Flyover
 * A travel route drawing itself across a stylised map, with the camera tracking
 * the marker. `@remotion/paths` does the geometry: `evolvePath` draws the trail,
 * `getPointAtLength` places the marker and `getTangentAtLength` points it — so
 * the plane always faces the direction it is actually travelling.
 */

type Stop = {readonly name: string; readonly at: number};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly ink: string;
  readonly text: string;
  readonly accent: string;
  readonly bg: string;
  readonly muted: string;
  readonly paperMuted: string;
  readonly stroke: number;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  ink: '#ffffff',
  text: fontFamily,
  accent: '#ff5c39',
  bg: '#0a0b10',
  muted: '#8d93a5',
  paperMuted: '#4a4e5a',
  stroke: 3,
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  /** The route, in the SVG's own coordinate space. */
  readonly route?: string;
  readonly stops?: readonly Stop[];
  readonly title?: string;
  /** Frames the route takes to draw. */
  readonly drawFrames?: number;
  readonly startAt?: number;
  /** How far the camera pushes in while following. 1 = locked off. */
  readonly followZoom?: number;
  readonly landColor?: string;
  readonly seaColor?: string;
  readonly routeColor?: string;
};

const VB_W = 1600;
const VB_H = 900;

const DEFAULT_ROUTE =
  'M 210 610 C 380 520, 470 690, 640 560 S 830 330, 1010 420 S 1230 640, 1400 300';

export const RouteFlyover: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  route = DEFAULT_ROUTE,
  stops = [
    {name: 'LISBON', at: 0},
    {name: 'MADRID', at: 0.34},
    {name: 'LYON', at: 0.66},
    {name: 'ZÜRICH', at: 1},
  ],
  title = 'ROUTE 04 · 1,842 km',
  drawFrames = 150,
  startAt = 18,
  followZoom = 1.5,
  landColor = theme.paperMuted,
  seaColor = theme.bg,
  routeColor = theme.accent,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  const total = getLength(route);

  const progress = interpolate(frame, [startAt, startAt + drawFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.42, 0, 0.28, 1),
  });

  // The trail: one dash the length of the path, its offset animating to zero.
  const {strokeDasharray, strokeDashoffset} = evolvePath(progress, route);

  const point = getPointAtLength(route, total * progress) ?? {x: 0, y: 0};
  const tangent = getTangentAtLength(route, total * progress) ?? {x: 1, y: 0};
  // Point the marker along the tangent, not along the straight line to the next stop.
  const heading = (Math.atan2(tangent.y, tangent.x) * 180) / Math.PI;

  // Camera: push in and track the marker, easing back out at both ends.
  const follow = interpolate(progress, [0, 0.12, 0.88, 1], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.3, 1),
  });
  const zoom = 1 + (followZoom - 1) * follow;
  // Counter-translate by the marker's offset from centre, scaled by the zoom.
  const camX = -(point.x - VB_W / 2) * (zoom - 1) * (width / VB_W) * follow;
  const camY = -(point.y - VB_H / 2) * (zoom - 1) * (height / VB_H) * follow;

  return (
    <AbsoluteFill name="Scene" style={{backgroundColor: seaColor, overflow: 'hidden', fontFamily}}>
      <Interactive.Div
        name="Camera"
        style={{
          position: 'absolute',
          inset: 0,
          scale: zoom,
          translate: `${camX}px ${camY}px`,
        }}
      >
        <svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid slice">
          {/* Stylised landmass — enough texture that the camera move reads as a move. */}
          <path
            d="M -60 700 C 160 620, 300 760, 520 690 S 760 520, 980 580 S 1240 720, 1420 520 S 1600 380, 1700 420 L 1700 960 L -60 960 Z"
            fill={landColor}
          />
          <path
            d="M -60 380 C 180 330, 330 430, 540 360 S 820 180, 1060 240 S 1320 340, 1700 200 L 1700 -40 L -60 -40 Z"
            fill={landColor}
            opacity={0.55}
          />

          {/* Contour hatching, so there is something for the zoom to bite on. */}
          {new Array(26).fill(0).map((_, i) => (
            <line
              key={i}
              x1={-60}
              x2={1700}
              y1={i * 42 + 20}
              y2={i * 42 + 20 + (random(`h-${i}`) - 0.5) * 26}
              stroke="#ffffff"
              strokeWidth={1}
              opacity={0.035}
            />
          ))}

          {/* Route: the dim full path, then the lit portion drawn over it. */}
          <path
            d={route}
            fill="none"
            stroke="#ffffff"
            strokeWidth={(theme.stroke * 4) / 3}
            opacity={0.09}
            strokeLinecap="round"
          />
          <path
            d={route}
            fill="none"
            stroke={routeColor}
            strokeWidth={theme.stroke * 2}
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            style={{filter: `drop-shadow(0 0 14px ${routeColor}88)`}}
          />

          {stops.map((stop) => {
            const p = getPointAtLength(route, total * stop.at) ?? {x: 0, y: 0};
            // Each stop lights up as the route reaches it.
            const lit = interpolate(progress, [stop.at - 0.02, stop.at + 0.03], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <g key={stop.name}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={9 + lit * 5}
                  fill={lit > 0.5 ? routeColor : theme.paperMuted}
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={9 + lit * 5}
                  fill="none"
                  stroke={seaColor}
                  strokeWidth={theme.stroke}
                />
                <text
                  x={p.x}
                  y={p.y - 26}
                  textAnchor="middle"
                  fill={lit > 0.5 ? theme.ink : theme.muted}
                  fontSize={22}
                  fontWeight={700}
                  letterSpacing={2.6}
                  style={{fontFamily}}
                >
                  {stop.name}
                </text>
              </g>
            );
          })}

          {/* The marker, rotated onto the tangent. */}
          <g transform={`translate(${point.x} ${point.y}) rotate(${heading})`}>
            <circle r={30} fill={routeColor} opacity={0.16} />
            <path
              d="M 16 0 L -11 -10 L -6 0 L -11 10 Z"
              fill={theme.ink}
              stroke={routeColor}
              strokeWidth={(theme.stroke * 2) / 3}
            />
          </g>
        </svg>
      </Interactive.Div>

      {/* HUD sits outside the camera, so it never moves with the map. */}
      <Interactive.Div
        name="Title"
        style={{
          position: 'absolute',
          left: 76,
          top: 66,
          fontSize: 34,
          fontWeight: 800,
          letterSpacing: '0.2em',
          color: theme.ink,
          opacity: interpolate(frame, [4, 24], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {title}
      </Interactive.Div>
      <Interactive.Div
        name="Progress"
        style={{
          position: 'absolute',
          right: 76,
          top: 70,
          fontSize: 30,
          fontWeight: 700,
          color: routeColor,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {Math.round(progress * 100)}%
      </Interactive.Div>
    </AbsoluteFill>
  );
};
