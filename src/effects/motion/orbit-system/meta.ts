import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'orbit-system',
  name: 'Orbit System',
  category: 'motion',
  tagline: 'Planets on tilted elliptical orbits, passing in front of and behind the star.',
  description:
    'A solar system seen at a 26° tilt, with no 3D library involved. Two ideas carry it: multiplying the y component of each orbit by cos(tilt) turns a circle into a viewed-at-an-angle ellipse, and splitting the bodies into two render passes — those with sin(angle) <= 0 drawn before the star, those in front drawn after — gives correct occlusion from paint order alone. Each planet is lit from the star by offsetting its radial-gradient centre against its own orbital angle.',
  tags: ['motion', 'orbit', 'solar system', 'planets', 'space', '3d illusion', 'trig', 'science'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 300,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'advanced',
  checkFrame: 96,
  posterFrame: 214,
  concepts: ['elliptical projection', 'paint-order occlusion', 'directional lighting', 'trig motion'],
  credit: {
    label: 'Idea from “Solar System Orbit Animation” in the Remotion prompt showcase',
    url: 'https://www.remotion.dev/prompts',
  },
};
