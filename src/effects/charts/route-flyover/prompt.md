Build a Remotion composition called **RouteFlyover** (composition id `route-flyover`): a travel route
drawing itself across a stylised map while the camera tracks the marker.

**Setup**

```bash
npx remotion add @remotion/paths
```

No map library and no API key — the map is SVG paths, which means it renders anywhere and never rate-limits.

**`@remotion/paths` does all the geometry**

```tsx
const total = getLength(route);
const {strokeDasharray, strokeDashoffset} = evolvePath(progress, route);   // the trail
const point   = getPointAtLength(route, total * progress) ?? {x: 0, y: 0}; // the marker
const tangent = getTangentAtLength(route, total * progress) ?? {x: 1, y: 0};
const heading = (Math.atan2(tangent.y, tangent.x) * 180) / Math.PI;
```

**The tangent is the important one.** Rotating the marker to face the *next waypoint* looks fine on
straight legs and visibly wrong on every curve — the marker points across the arc instead of along it.
`getTangentAtLength` gives the direction of travel at exactly that point, so the marker always faces
where it is actually going.

Both getters return `null` for a degenerate path, so default them.

**The camera**

```tsx
const follow = interpolate(progress, [0, 0.12, 0.88, 1], [0, 1, 1, 0], {/* ease */});
const zoom = 1 + (followZoom - 1) * follow;                              // followZoom 1.5
const camX = -(point.x - VB_W / 2) * (zoom - 1) * (width / VB_W) * follow;
const camY = -(point.y - VB_H / 2) * (zoom - 1) * (height / VB_H) * follow;
```

Counter-translating by the marker's offset from centre, **scaled by `(zoom - 1)`**, is what pins the
marker in place while the map slides underneath. Translating by the raw offset over-corrects and the
marker slides the other way. The `width / VB_W` factor converts from the SVG's viewBox units into
screen pixels — get that wrong and the tracking drifts further the further you go.

Ramping `follow` back to 0 at both ends means the shot opens and closes on the whole route and only
pushes in for the journey.

**Keep the HUD outside the camera**
The title and the percentage read-out live in the root `<AbsoluteFill>`, **not** inside the transformed
element. Anything inside it gets scaled and dragged along with the map, and a swimming HUD is the
fastest way to make a tracking shot look broken.

**The look**
- 1920×1080, 30fps, 200 frames. Sea `theme.bg`, land `theme.paperMuted`, route `theme.accent`. SVG viewBox
  `0 0 1600 900` with `preserveAspectRatio="xMidYMid slice"`.
- Two stylised landmasses as bezier paths, plus ~26 near-invisible contour lines (`opacity: 0.035`,
  seeded jitter via `random()` from `remotion`). **The texture matters**: on a flat fill, a camera push
  is invisible — there is nothing for the eye to track against.
- Draw the route **twice**: the full path at `opacity: 0.09` and `theme.stroke * 4 / 3` underneath,
  then the lit portion over it at `theme.stroke * 2` with `evolvePath` and
  `filter: drop-shadow(0 0 14px ${routeColor}88)`. Seeing the road ahead is what makes
  it a route rather than a line growing.
- Stops: a dot (unlit `theme.paperMuted`, lit `routeColor`) plus a label that lights from
  `theme.muted` to `theme.ink` as `progress` passes its `at` value. Ring each dot with a
  `theme.stroke` stroke in the **sea colour** so it punches out of the route line.
- Marker: a triangle at the origin inside a `<g transform={\`translate(x y) rotate(heading)\`}>`, with a
  soft halo circle behind it.

**Requirements**
- One self-contained `.tsx` file exporting `RouteFlyover`.
- Props: `route` (an SVG path string in viewBox space), `stops` (array of `{name, at}` where `at` is
  0–1 along the path), `title`, `drawFrames`, `startAt`, `followZoom`, `landColor`, `seaColor`,
  `routeColor`.
- Load Inter via `@remotion/google-fonts/Inter`; SVG `<text>` needs `fontFamily` set explicitly in its
  own style, it does not inherit from an ancestor div.
- For real cartography instead, `@remotion/maps` techniques cover Mapbox, MapLibre, MapTiler and a
  Cesium 3D flyover — but those need tiles, keys and network access at render time.
