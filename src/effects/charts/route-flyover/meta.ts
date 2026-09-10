import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'route-flyover', name: 'Route Flyover', category: 'charts',
  tagline: 'A travel route draws itself while the camera tracks the marker.',
  description:
    'The travel-map format with no map library and no API key. @remotion/paths does all the geometry: evolvePath draws the trail, getPointAtLength places the marker and getTangentAtLength gives its heading — so the marker points along the curve it is actually on rather than at the next waypoint. The camera counter-translates by the marker\'s offset from centre scaled by the zoom, which is what keeps the marker pinned while the map slides beneath it, and the HUD sits outside the camera transform so it never swims. Contour hatching under the route is not decoration: a camera push over a flat colour field has nothing to bite on and reads as a zoom on a still, so the map needs texture for the move to register as a move.',
  tags: ['geo', 'camera', 'draw-on', 'svg', 'stroke'],
  concepts: ['evolvePath', 'tangent heading', 'single driver value'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 200,
  packages: ['remotion', '@remotion/paths', '@remotion/google-fonts'],
  difficulty: 'advanced', checkFrame: 90, posterFrame: 130,
  ground: 'dark', audience: ['youtuber', 'educator'],
  credit: {
    label: 'Idea from “Travel Route on Map with 3D landmarks” in the Remotion prompt showcase',
    url: 'https://www.remotion.dev/prompts',
  },
};
