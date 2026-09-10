import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'particle-field', name: 'Particle Field', category: 'motion',
  tagline: 'Hundreds of particles drifting toward the camera, linked into constellations.',
  description:
    'A depth-sorted particle field with no simulation anywhere in it. Each particle\'s depth is (seed + t * speed) % 1 — a closed-form function of the frame — so there is no state to advance, any frame renders standalone, and the field loops forever for free. A quadratic perspective term pushes near particles outward and enlarges them, and pairs closer than 8.5% of the frame get an SVG line between them, which reads as a constellation without any graph bookkeeping. Links are drawn only between the nearest few particles rather than across the whole field, which keeps the pair test off the quadratic path while still reading as a constellation.',
  tags: ['particles', 'space', 'loop', 'ambient', 'background'],
  concepts: ['closed-form motion', 'modulo looping', 'fake perspective', 'random(seed)'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 240,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'advanced', checkFrame: 150,
  ground: 'dark', audience: ['saas', 'agency'],
};
