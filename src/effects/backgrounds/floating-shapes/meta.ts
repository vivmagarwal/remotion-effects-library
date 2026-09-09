import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'floating-shapes',
  name: 'Floating Shapes',
  category: 'backgrounds',
  tagline: 'Geometric confetti drifting upward on a seamless loop.',
  description:
    'Circles, squares, triangles, rings and crosses rising through the frame. Each shape gets one seeded depth value and size, blur, opacity and speed are all derived from it, so the field reads as having real depth rather than as scattered decoration. Vertical position is a modulo of elapsed time, which makes the loop seamless and means no shape ever has to be recycled back to the bottom — there is no state to keep, so any frame renders standalone.',
  tags: ['background', 'shapes', 'confetti', 'ambient', 'loop', 'geometric', 'depth', 'particles'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 240,
  packages: ['remotion'],
  difficulty: 'starter',
  checkFrame: 140,
  concepts: ['modulo looping', 'seeded depth', 'derived atmospherics', 'clip-path shapes'],
};
