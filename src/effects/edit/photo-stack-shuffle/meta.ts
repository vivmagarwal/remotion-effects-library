import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'photo-stack-shuffle', name: 'Photo Stack Shuffle', category: 'edit',
  tagline: 'A deck of prints where the top card flicks away and the stack settles forward.',
  description:
    'Every card\'s position, scale, shadow, tilt and opacity are computed from one number — how far below the top of the deck it currently sits — so a single expression lays out the whole stack at any moment and the shuffle is just that distance decreasing by one. The card being discarded is the only exception: it leaves on its own path rather than following the stack, which is what makes it read as being flicked away rather than as the deck sliding. The deck index wraps with a modulo, so the same four cards cycle forever with nothing to reset and any frame in the composition renders on its own. Each card’s tilt is seeded rather than random, so the stack looks hand-dropped but breaks identically on every render tab.',
  tags: ['photo', 'stagger', 'loop', 'spring'],
  concepts: ['depth-derived layout', 'modulo looping', 'random(seed)', 'paint order'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 330,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 56, posterFrame: 30,
  requires: ['image'], ground: 'dark', audience: ['youtuber', 'agency'],
};
