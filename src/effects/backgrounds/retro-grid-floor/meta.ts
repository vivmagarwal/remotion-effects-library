import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'retro-grid-floor', name: 'Retro Grid Floor', category: 'backgrounds',
  tagline: 'The synthwave horizon: sliced sun, converging grid, endless scroll.',
  description:
    'A real perspective projection rather than a skewed rectangle. Each horizontal line sits at a constant spacing in depth and is projected to the screen with a reciprocal, so the lines bunch toward the horizon the way a plane actually recedes — a linear spacing looks like a ladder lying down. The scroll is a fractional offset on the row index, which makes rows enter at the horizon, accelerate toward the camera and loop for free. The sun is sliced with a mask-image whose gaps widen downward. The verticals all converge on the same vanishing point the horizontals recede toward, so the two families agree; a haze band at the horizon dissolves the lines instead of letting them stop dead, which is the tell that the floor is a drawing rather than a plane.',
  tags: ['background', 'retro', 'grid', 'perspective', 'loop'],
  concepts: ['fake perspective', 'procedural grid', 'modulo looping', 'CSS mask-image'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 240,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 120,
  ground: 'dark', audience: ['youtuber', 'agency'],
};
