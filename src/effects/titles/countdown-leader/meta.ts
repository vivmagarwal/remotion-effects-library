import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'countdown-leader', name: 'Countdown Leader', category: 'titles',
  tagline: 'Academy film leader: sweeping wiper, crosshairs, one number per second.',
  description:
    'A film-leader countdown driven by two derived values — Math.floor(frame / fps) gives the number and (frame % fps) / fps gives position within the second. One expression then drives the wiper sweep, the number scale-settle, the cue punch and the frame flash, for any countdown length, with no per-number bookkeeping. The grain reseeds its feTurbulence on every frame so it moves like real stock rather than sitting there as a static texture. Because both values are derived rather than scheduled, the countdown works at any length and any fps without a table of per-number frame numbers to keep in step.',
  tags: ['countdown', 'retro', 'cinematic', 'title'],
  concepts: ['frame-derived state', 'modulo looping', 'random(seed)'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 190,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'starter', checkFrame: 78, posterFrame: 86,
  ground: 'both', audience: ['youtuber', 'agency'],
};
