import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'route-flyover',
  name: 'Route Flyover',
  category: 'motion',
  tagline: 'A travel route draws itself while the camera tracks the marker.',
  description:
    'The travel-map format with no map library and no API key. @remotion/paths does all the geometry: evolvePath draws the trail, getPointAtLength places the marker and getTangentAtLength gives its heading — so the marker points along the curve it is actually on rather than at the next waypoint. The camera counter-translates by the marker\'s offset from centre scaled by the zoom, which is what keeps the marker pinned while the map slides beneath it, and the HUD sits outside the camera transform so it never swims.',
  tags: ['motion', 'map', 'route', 'travel', 'path', 'svg', 'camera', 'journey', 'flyover'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 200,
  packages: ['remotion', '@remotion/paths', '@remotion/google-fonts'],
  difficulty: 'advanced',
  checkFrame: 90,
  posterFrame: 130,
  concepts: ['evolvePath', 'tangent heading', 'camera counter-translate', 'HUD outside camera'],
  credit: {
    label: 'Idea from “Travel Route on Map with 3D landmarks” in the Remotion prompt showcase',
    url: 'https://www.remotion.dev/prompts',
  },
};
