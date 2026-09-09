import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'stat-slam',
  name: 'Stat Slam',
  category: 'openers',
  tagline: 'One number arrives hard — shockwave, camera kick and all.',
  description:
    'A cold open built around a single statistic. The impact is assembled from three cues landing on the same frame: the number decelerates from 7× scale and stops dead, a shockwave ring expands out of it, and the entire frame kicks a few pixels on a decaying sine. The camera kick is applied to the root AbsoluteFill, not to the number — moving everything is what makes it read as the camera being hit rather than an element wobbling. A 2.8% recoil stops the number from simply halting.',
  tags: ['opener', 'stat', 'number', 'impact', 'slam', 'shockwave', 'hook', 'cold open'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 120,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'starter',
  checkFrame: 20,
  posterFrame: 34,
  concepts: ['impact stacking', 'camera shake', 'recoil', 'shockwave ring'],
};
