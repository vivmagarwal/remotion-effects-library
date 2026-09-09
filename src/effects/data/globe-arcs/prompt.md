Build a Remotion composition called **GlobeArcs**: a slowly turning orthographic globe with flight
arcs tracing across it. (Tracing, not *lifting off* — `geoInterpolate` walks the sphere's surface, so
the arcs hug the globe and never rise above it. There is no altitude term.)

**Setup**

```bash
npm i d3-geo topojson-client world-atlas
npm i -D @types/d3-geo @types/topojson-client
```

`FeatureCollection` and `Geometry` are imported `from 'geojson'`. You do not install it separately —
it arrives transitively with `@types/d3-geo`.

**Why orthographic**
`geoOrthographic` is the projection that looks like a *globe* rather than a map — and it earns its
keep by culling the far hemisphere for you. With `.clipAngle(90)`, anything behind the sphere is
simply not drawn, **including the parts of an arc that pass round the back**. You do not have to
compute that yourself.

```tsx
// Rebuilt every frame ON PURPOSE. A d3 projection is a mutable object that
// caches its rotation, so one shared instance across frames rendered in
// parallel tabs would give whichever rotation was set last.
const {projection, path} = useMemo(() => {
  const proj = geoOrthographic()
    .scale(R)
    .translate([cx, cy])
    .rotate([frame * spin - 100, -18, 0])   // negative tilt lifts the north into view
    .clipAngle(90);
  return {projection: proj, path: geoPath(proj)};
}, [R, cx, cy, frame, spin]);
```

**The land**
`world-atlas` ships TopoJSON; convert it to GeoJSON **once**, outside the per-frame path:

```tsx
import countries110m from 'world-atlas/countries-110m.json';
import {feature} from 'topojson-client';

const land = useMemo(
  () => feature(countries110m as never,
                (countries110m as never as {objects: {countries: unknown}}).objects.countries as never)
        as unknown as FeatureCollection<Geometry>,
  [],
);
```
`countries-110m.json` is ~105 KB and has 177 features — the right resolution for video. `50m` and
`10m` also exist and are far heavier. Needs `"resolveJsonModule": true` in tsconfig.

**Choose the rotation window against your data.** `rotate[0] = λ` puts centre longitude at `-λ`, so
`frame * 0.75 - 100` starts centred on **100°E** and sweeps **180° west** across 240 frames, ending
near 80°W. That is deliberate: it walks Asia → Europe → the Americas so every city in the default set
comes into view at some point. Pick a smaller `spin` and the Pacific cities sit behind the globe for
the entire video, and any route touching them is simply never seen.

**Sizing — an orthographic globe is exactly a disc of radius = scale**
So its extent is known up front and there is no excuse for it colliding with the type:

```tsx
const R  = Math.min(width * 0.21, height * 0.36);
const cx = width / 2;
const cy = height / 2 + 76;
```
Draw the ocean as a plain `<circle cx={cx} cy={cy} r={R} />` — no projection needed — with a second
stroked circle over it for the rim. Then `geoGraticule10()` through the same `path()` for the grid.

**The arcs — great circles, not straight lines**
`geoInterpolate(a, b)` walks the **great-circle** path between two points, the shortest route on a
sphere. That is why the arcs bow instead of running straight across the projection:

```tsx
const along = geoInterpolate([a.lon, a.lat], [b.lon, b.lat]);
const steps = 48;
const coords: [number, number][] = [];
const whole = Math.floor(steps * p);
for (let s = 0; s <= whole; s++) coords.push(along(s / steps) as [number, number]);
// Without this trailing partial point the head snaps forward a whole 1/48 of
// the route at a time instead of sliding.
if (p > 0 && whole / steps < p) coords.push(along(p) as [number, number]);
if (coords.length < 2) return null;   // a 1-point LineString yields d="" 

// Handing it back as a LineString gives the CLIPPING to the projection, so the
// part of the arc behind the globe disappears on its own.
<path d={path({type: 'LineString', coordinates: coords}) ?? undefined}
      fill="none" stroke={arcColor} strokeWidth={2.6} strokeLinecap="round" opacity={0.9} />
```
Growing `coords` with `p` is what draws the arc on. Each route starts at `startAt + i * stagger`
and takes `drawFrames`, on `Easing.bezier(0.4, 0, 0.2, 1)`.

**City markers need an explicit near-side test**
Arcs clip themselves, but a projected *point* on the far side still returns valid coordinates, so a
marker would show through the globe. Test the angular distance from the point facing the camera:

```tsx
const isVisible = (lon: number, lat: number) => {
  const rotate = projection.rotate();
  const [lambda, phi] = [(-rotate[0] * Math.PI) / 180, (-rotate[1] * Math.PI) / 180];
  const [l, p] = [(lon * Math.PI) / 180, (lat * Math.PI) / 180];
  const cosDelta = Math.sin(phi) * Math.sin(p) + Math.cos(phi) * Math.cos(p) * Math.cos(l - lambda);
  return cosDelta > 0.03;   // a hair past the horizon, so markers never sit half-off the rim
};
```
Each visible city: a dot of **radius** 4.5 in `paperColor`, a **radius** 9 ring stroked in `arcColor`
at 1.4, and the name in `paperColor` (Inter 19px weight 600, opacity 0.88).

**Labels need per-city placement.** With one fixed offset, London (−0.13, 51.5) and Berlin
(13.4, 52.5) sit ~35px apart at this radius and their labels overlap in *every frame*. Give `City`
optional `dx`, `dy` and `anchor` fields, defaulting to `dx: 15, dy: 5, anchor: 'start'`:

```tsx
x={xy[0] + (c.dx ?? 15)}
y={xy[1] + (c.dy ?? 5)}
textAnchor={c.anchor ?? 'start'}
```

**The scene**
- 1920×1080, 30fps, **240 frames** — long enough for a visible portion of a rotation.
- Background `#070a12` plus `radial-gradient(ellipse at 50% 52%, <arcColor>12 0%, transparent 62%)`.
- **Draw order matters:** ocean disc → graticule → land → **rim last**. Painted before the land, a
  coastline that reaches the limb erases the edge of the globe.
- Ocean `#111a2e`; graticule `#ffffff10` at 1px; land `#2c3d63` filled and stroked in the same colour
  at 0.4; rim `<arcColor>55` at **1.6**.
- The whole `<svg>` scales `0.82 → 1` over frames 0–34 on `Easing.bezier(0.16, 1, 0.3, 1)` with
  `output: 'perceptual-scale'`, and `transform-origin: ${cx}px ${cy}px`. The HTML title and subtitle
  sit outside the `<svg>` and do not scale.
- Centred title at `top: 84` (Inter 56px/800, `letter-spacing: -0.025em`, `paperColor`) and
  monospace subtitle at `top: 154` (24px, `#7b849b`), fading in over 0–20 and 8–28.

**Data — use these exact coordinates**
Guessed coordinates give a visibly different video, so they are pinned here:

```tsx
const DEFAULT_CITIES: City[] = [
  {name: 'San Francisco', lon: -122.4, lat: 37.8},
  {name: 'New York',      lon: -74.0,  lat: 40.7},
  // Opposed anchors: these two collide otherwise.
  {name: 'London',        lon: -0.13,  lat: 51.5, dx: -15, anchor: 'end'},
  {name: 'Berlin',        lon: 13.4,   lat: 52.5, dy: -14},
  {name: 'Bengaluru',     lon: 77.6,   lat: 12.97},
  {name: 'Singapore',     lon: 103.8,  lat: 1.35},
  {name: 'Tokyo',         lon: 139.7,  lat: 35.7},
  {name: 'São Paulo',     lon: -46.6,  lat: -23.5},
  {name: 'Lagos',         lon: 3.4,    lat: 6.5},
  {name: 'Sydney',        lon: 151.2,  lat: -33.9},
];

const DEFAULT_ROUTES: Route[] = [
  {from: 'San Francisco', to: 'Tokyo'},
  {from: 'San Francisco', to: 'New York'},
  {from: 'New York',      to: 'London'},
  {from: 'London',        to: 'Berlin'},
  {from: 'Berlin',        to: 'Bengaluru'},
  {from: 'Bengaluru',     to: 'Singapore'},
  {from: 'Singapore',     to: 'Sydney'},
  {from: 'London',        to: 'Lagos'},
  {from: 'New York',      to: 'São Paulo'},
  {from: 'Tokyo',         to: 'Sydney'},
];
```

**Requirements**
- One self-contained `.tsx` file exporting `GlobeArcs`.
- Props, with defaults: `title` (`'Rendering, everywhere'`), `subtitle`
  (`'orthographic globe · d3-geo + geoInterpolate'`), `cities`, `routes`, `spin` (0.75 degrees per
  frame), `stagger` (9), `drawFrames` (34), `startAt` (16), `oceanColor` (`#111a2e`), `landColor`
  (`#2c3d63`), `arcColor` (`#4cc9f0`), `backgroundColor` (`#070a12`), `paperColor` (`#eef1f7`).
- Load Inter via `@remotion/google-fonts/Inter`, weights **`['600', '800']`** — exactly the two the
  design uses (800 title, 600 city labels). Loading 500/700 instead means weight 600 silently falls
  back to a synthesised face.
