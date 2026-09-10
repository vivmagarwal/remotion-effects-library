import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'orbit-system', name: 'Orbit System', category: 'motion',
  tagline: 'Planets on tilted elliptical orbits, passing in front of and behind the star.',
  description:
    'A solar system seen at a 26° tilt, with no 3D library involved. Two ideas carry it: multiplying the y component of each orbit by cos(tilt) turns a circle into a viewed-at-an-angle ellipse, and splitting the bodies into two render passes — those with sin(angle) <= 0 drawn before the star, those in front drawn after — gives correct occlusion from paint order alone. Each planet is lit from the star by offsetting its radial-gradient centre against its own orbital angle. The specular highlight on each body is squashed on y along with the geometry, because a highlight computed in unprojected space disagrees with the ellipse it sits on the moment the camera drops toward edge-on.',
  tags: ['space', 'perspective', 'loop', 'ambient'],
  concepts: ['elliptical projection', 'trig orbits', 'paint order'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 300,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'advanced', checkFrame: 96, // 270, not 214. The orbital periods bring the planets into conjunction around
 // 214 — they bunch on one side, the frame goes lopsided, and Mercury's label
 // disappears into the sun's glow, reading as "CURY". check:poster measured it
 // as almost no structure and was right. At 270 they are spread across the width.
 posterFrame: 270,
  ground: 'dark', audience: ['educator', 'youtuber'],
  credit: {
    label: 'Idea from “Solar System Orbit Animation” in the Remotion prompt showcase',
    url: 'https://www.remotion.dev/prompts',
  },
};
