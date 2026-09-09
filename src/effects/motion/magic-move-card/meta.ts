import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'magic-move-card',
  name: 'Magic Move (Card)',
  category: 'motion',
  tagline: 'A media card morphs between portrait and landscape, re-cropping as it goes.',
  description:
    'The move is an interpolation of the card\'s layout rectangle — left, top, width and height — not a transform. That distinction is everything: a scaled card squashes its contents and reads as a resize, while a card whose rectangle changes with objectFit: cover re-crops around its subject and reads as the same object changing shape. One shift value from 0 to 1 drives the rect, the text beat that fills the freed space, and the per-line stagger, so the return leg is the outbound leg in reverse and nothing can desynchronise.',
  tags: ['motion', 'magic move', 'shared element', 'morph', 'layout', 'aspect', 'card', 'transition'],
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 340,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'advanced',
  checkFrame: 62,
  posterFrame: 110,
  concepts: ['rect interpolation', 'objectFit cover re-crop', 'spring in minus spring out', 'shift-driven staging'],
};
