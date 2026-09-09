import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'photo-stack-shuffle',
  name: 'Photo Stack Shuffle',
  category: 'media',
  tagline: 'A deck of prints where the top card flicks away and the stack settles forward.',
  description:
    'Every card\'s position, scale, shadow, tilt and opacity are computed from one number — how far below the top of the deck it currently sits — so a single expression lays out the whole stack at any moment and the shuffle is just that distance decreasing by one. The card being discarded is the only exception: it leaves on its own path rather than following the stack, which is what makes it read as being flicked away rather than as the deck sliding.',
  tags: ['media', 'photo', 'stack', 'shuffle', 'gallery', 'cards', 'slideshow', 'deck'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 330,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 56,
  posterFrame: 30,
  concepts: ['depth-derived layout', 'modulo deck wrap', 'per-card seeded tilt', 'z-index from depth'],
};
