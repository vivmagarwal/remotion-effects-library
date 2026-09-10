import {useMemo} from 'react';
import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {geoGraticule10, geoInterpolate, geoOrthographic, geoPath} from 'd3-geo';
import type {GeoPermissibleObjects} from 'd3-geo';
import {feature} from 'topojson-client';
import type {FeatureCollection, Geometry} from 'geojson';
import countries110m from 'world-atlas/countries-110m.json';
import {loadFont} from '@remotion/google-fonts/Inter';

const {fontFamily} = loadFont('normal', {weights: ['600', '800'], subsets: ['latin']});

/**
 * Globe Arcs
 * A slowly turning orthographic globe with flight arcs lifting off it.
 * d3-geo's orthographic projection is the one that looks like a globe rather
 * than a map — and critically it culls the far hemisphere for you, so
 * everything behind the sphere simply is not drawn. The arcs come from
 * geoInterpolate, which walks the great-circle path between two points: the
 * shortest route on a sphere, which is why they bow.
 */

type City = {
  readonly name: string;
  readonly lon: number;
  readonly lat: number;
  /** Label offset from the marker. Defaults to 15 right, 5 down. */
  readonly dx?: number;
  readonly dy?: number;
  /** Flip the label to the left of the marker where neighbours would collide. */
  readonly anchor?: 'start' | 'end';
};
type Route = {readonly from: string; readonly to: string};

/**
 * The shared theme, narrowed to the tokens this file uses. TypeScript is
 * structural, so the library's full theme object is assignable to it — the
 * vocabulary is shared by NAME rather than by an import, which is what keeps
 * this file runnable on its own.
 */
type Theme = {
  readonly text: string;
  readonly bg: string;
  readonly bgDeep: string;
  readonly body: string;
  readonly pair: string;
  readonly paperMuted: string;
};

/** The house values. Pass a `theme` prop to restyle every effect at once. */
const THEME: Theme = {
  text: fontFamily,
  bg: '#0a0b10',
  bgDeep: '#04050a',
  body: '#eef1f7',
  pair: '#4cc9f0',
  paperMuted: '#4a4e5a',
};

type Props = {
  /** CSS font family. Defaults to this file's own loaded face, or the theme's. */
  readonly fontFamily?: string;
  /** Colours, typefaces and shape for the whole library. Any single prop below still wins. */
  readonly theme?: Theme;
  readonly title?: string;
  readonly subtitle?: string;
  readonly cities?: readonly City[];
  readonly routes?: readonly Route[];
  /** Degrees of rotation per frame. */
  readonly spin?: number;
  /** Frames between one arc drawing and the next. */
  readonly stagger?: number;
  /** Frames each arc takes to draw. */
  readonly drawFrames?: number;
  readonly startAt?: number;
  readonly oceanColor?: string;
  readonly landColor?: string;
  readonly arcColor?: string;
  readonly backgroundColor?: string;
  readonly paperColor?: string;
};

const DEFAULT_CITIES: City[] = [
  {name: 'San Francisco', lon: -122.4, lat: 37.8},
  {name: 'New York', lon: -74.0, lat: 40.7},
  // London and Berlin are ~35px apart at this radius; without opposed anchors
  // their labels overlap in every frame.
  {name: 'London', lon: -0.13, lat: 51.5, dx: -15, anchor: 'end'},
  {name: 'Berlin', lon: 13.4, lat: 52.5, dy: -14},
  {name: 'Bengaluru', lon: 77.6, lat: 12.97},
  {name: 'Singapore', lon: 103.8, lat: 1.35},
  {name: 'Tokyo', lon: 139.7, lat: 35.7},
  {name: 'São Paulo', lon: -46.6, lat: -23.5},
  {name: 'Lagos', lon: 3.4, lat: 6.5},
  {name: 'Sydney', lon: 151.2, lat: -33.9},
];

const DEFAULT_ROUTES: Route[] = [
  {from: 'San Francisco', to: 'Tokyo'},
  {from: 'San Francisco', to: 'New York'},
  {from: 'New York', to: 'London'},
  {from: 'London', to: 'Berlin'},
  {from: 'Berlin', to: 'Bengaluru'},
  {from: 'Bengaluru', to: 'Singapore'},
  {from: 'Singapore', to: 'Sydney'},
  {from: 'London', to: 'Lagos'},
  {from: 'New York', to: 'São Paulo'},
  {from: 'Tokyo', to: 'Sydney'},
];

export const GlobeArcs: React.FC<Props> = ({
  theme = THEME,
  fontFamily = theme.text,
  title = 'Rendering, everywhere',
  subtitle = 'orthographic globe · d3-geo + geoInterpolate',
  cities = DEFAULT_CITIES,
  routes = DEFAULT_ROUTES,
  spin = 0.75,
  stagger = 9,
  drawFrames = 34,
  startAt = 16,
  oceanColor = theme.bg,
  landColor = theme.paperMuted,
  arcColor = theme.pair,
  backgroundColor = theme.bgDeep,
  paperColor = theme.body,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  // Sized and dropped so the sphere clears the header — an orthographic globe
  // is exactly a disc of radius = scale, so the extent is known up front and
  // there is no excuse for it colliding with the type.
  const R = Math.min(width * 0.21, height * 0.36);
  const cx = width / 2;
  const cy = height / 2 + 76;

  // topojson → GeoJSON, once. It never changes, so it must not be recomputed.
  const land = useMemo(
    () =>
      feature(
        countries110m as never,
        (countries110m as never as {objects: {countries: unknown}}).objects.countries as never,
      ) as unknown as FeatureCollection<Geometry>,
    [],
  );

  const graticule = useMemo(() => geoGraticule10(), []);

  // The projection is rebuilt every frame ON PURPOSE. It is a mutable object
  // that caches its rotation, so sharing one instance across frames rendered in
  // parallel tabs would give whichever rotation was set last.
  const {projection, path} = useMemo(() => {
    const proj = geoOrthographic()
      .scale(R)
      .translate([cx, cy])
      // A little negative tilt puts the northern hemisphere in view, which is
      // where most of the routes are.
      // Starts centred on ~100°E and sweeps 180° west over the composition, so
      // every city in the default set comes into view at some point. A shorter
      // sweep leaves the Pacific ones behind the globe for the whole video.
      .rotate([frame * spin - 100, -18, 0])
      .clipAngle(90); // cull the far hemisphere
    return {projection: proj, path: geoPath(proj)};
  }, [R, cx, cy, frame, spin]);

  const cityByName = useMemo(() => new Map(cities.map((c) => [c.name, c])), [cities]);

  /** Is this lon/lat on the near side of the globe right now? */
  const isVisible = (lon: number, lat: number) => {
    const rotate = projection.rotate();
    const [lambda, phi] = [(-rotate[0] * Math.PI) / 180, (-rotate[1] * Math.PI) / 180];
    const [l, p] = [(lon * Math.PI) / 180, (lat * Math.PI) / 180];
    // Angular distance from the point facing the camera. > 90° means far side.
    const cosDelta =
      Math.sin(phi) * Math.sin(p) + Math.cos(phi) * Math.cos(p) * Math.cos(l - lambda);
    // A hair past the horizon rather than exactly on it, so markers never sit
    // half-off the rim.
    return cosDelta > 0.03;
  };

  const globeIn = interpolate(frame, [0, 34], [0.82, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: 'perceptual-scale',
  });

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        backgroundColor,
        backgroundImage: `radial-gradient(ellipse at 50% 52%, ${arcColor}12 0%, transparent 62%)`,
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
          top: 84,
          textAlign: 'center',
          fontSize: 56,
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
          top: 154,
          textAlign: 'center',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 24,
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
        width={width}
        height={height}
        style={{position: 'absolute', inset: 0, transformOrigin: `${cx}px ${cy}px`, scale: globeIn}}
      >
        {/* The ocean: a plain circle, since an orthographic globe is exactly a
            disc of radius = scale. */}
        <circle cx={cx} cy={cy} r={R} fill={oceanColor} />

        <path d={path(graticule) ?? undefined} fill="none" stroke="#ffffff10" strokeWidth={1} />

        {land.features.map((f, i) => (
          <path
            key={i}
            d={path(f as unknown as GeoPermissibleObjects) ?? undefined}
            fill={landColor}
            stroke={`${landColor}`}
            strokeWidth={0.4}
          />
        ))}

        {/* The rim is drawn AFTER the land: painted before it, a coastline that
            reaches the limb erases the edge of the globe. */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={`${arcColor}55`} strokeWidth={1.6} />

        {routes.map((route, i) => {
          const a = cityByName.get(route.from);
          const b = cityByName.get(route.to);
          if (!a || !b) return null;

          const begin = startAt + i * stagger;
          const p = interpolate(frame, [begin, begin + drawFrames], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          });
          if (p <= 0) return null;

          // geoInterpolate walks the GREAT CIRCLE between two points — the
          // shortest path on a sphere. That is why the arcs bow rather than
          // running straight across the projection.
          const along = geoInterpolate([a.lon, a.lat], [b.lon, b.lat]);
          const steps = 48;
          const coords: [number, number][] = [];
          const whole = Math.floor(steps * p);
          for (let s = 0; s <= whole; s++) {
            coords.push(along(s / steps) as [number, number]);
          }
          // Without this trailing partial point the head snaps forward a whole
          // 1/48 of the route at a time instead of sliding.
          if (p > 0 && whole / steps < p) coords.push(along(p) as [number, number]);
          if (coords.length < 2) return null;

          return (
            <path
              key={`${route.from}-${route.to}`}
              // A LineString hands the clipping back to the projection, so the
              // part of the arc behind the globe disappears on its own.
              d={path({type: 'LineString', coordinates: coords}) ?? undefined}
              fill="none"
              stroke={arcColor}
              strokeWidth={2.6}
              strokeLinecap="round"
              opacity={0.9}
            />
          );
        })}

        {cities.map((c) => {
          if (!isVisible(c.lon, c.lat)) return null;
          const xy = projection([c.lon, c.lat]);
          if (!xy) return null;
          const appear = interpolate(frame, [startAt - 8, startAt + 14], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <g key={c.name} opacity={appear}>
              <circle cx={xy[0]} cy={xy[1]} r={4.5} fill={paperColor} />
              <circle cx={xy[0]} cy={xy[1]} r={9} fill="none" stroke={arcColor} strokeWidth={1.4} />
              <text
                x={xy[0] + (c.dx ?? 15)}
                y={xy[1] + (c.dy ?? 5)}
                textAnchor={c.anchor ?? 'start'}
                fill={paperColor}
                fontFamily={fontFamily}
                fontSize={19}
                fontWeight={600}
                opacity={0.88}
              >
                {c.name}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
