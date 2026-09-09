import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'ken-burns',
  name: 'Ken Burns',
  category: 'media',
  tagline: 'Stills given life by a slow push and drift, with documentary captions.',
  description:
    'The documentary standard, done properly. Three rules: both ends of the scale stay above 1 so there is always overscan to pan into (start at exactly 1 and the edges show the moment you move); the drift is linear rather than eased, because an ease-in-out on a camera move reads as a stumble; and consecutive shots move in opposite directions — one pushes in while the next pulls out — so a sequence does not feel like it is drifting one way forever. Series.Sequence with premountFor loads each image before its shot begins.',
  tags: ['media', 'ken burns', 'photo', 'documentary', 'pan', 'zoom', 'slideshow', 'image'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 180,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'starter',
  checkFrame: 55,
  concepts: ['overscan', 'linear camera drift', 'Series', 'premountFor'],
};
