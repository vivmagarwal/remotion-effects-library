import type {EffectMeta} from '../../../types';
export const meta: EffectMeta = {
  id: 'globe-arcs', name: 'Globe Arcs', category: 'data',
  tagline: 'A turning globe with great-circle arcs tracing across it.',
  description:
    'geoOrthographic is the projection that looks like a globe rather than a map, and it earns its keep by culling the far hemisphere for you: with clipAngle(90), anything behind the sphere is simply not drawn, including the parts of an arc that pass round the back. The arcs come from geoInterpolate, which walks the great-circle path between two points — the shortest route on a sphere — which is why they bow instead of running straight across. Feeding those points back through geoPath as a LineString hands the clipping to the projection, so no manual visibility maths is needed for the arcs themselves; only the city markers need an explicit near-side test, since a projected point on the far side still returns coordinates. Two things have to be chosen against the data rather than by taste: the rotation window (rotate[0] = λ centres longitude -λ, so the sweep has to actually bring your cities round) and the label placement, since cities 35px apart collide with any single fixed offset. The projection is rebuilt every frame on purpose: it is a mutable object that caches its rotation, so one shared instance across frames rendered in parallel would give whichever rotation was set last.',
  tags: ['data', 'd3', 'geo', 'globe', 'map', 'arcs', 'great circle', 'svg'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 240,
  packages: ['remotion', 'd3-geo', 'topojson-client', 'world-atlas', '@remotion/google-fonts'],
  difficulty: 'advanced', checkFrame: 96, posterFrame: 150,
  concepts: ['geoOrthographic', 'clipAngle', 'geoInterpolate', 'geoPath', 'topojson feature()'],
};
