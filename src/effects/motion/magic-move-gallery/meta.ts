import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'magic-move-gallery',
  name: 'Magic Move (Gallery)',
  category: 'motion',
  tagline: 'A tile lifts out of a grid into a full-bleed hero and drops back into its slot.',
  description:
    'The shared-element transition. A single slotOf(i) function defines where each tile lives, and both the resting rect and the hero\'s start rect read from it — so the return lands exactly in the slot it left rather than approximately. The open tile lerps slot → hero while the others stay put and recede slightly, which keeps the grid legible as a background instead of having it vanish. The caption fades in against the open progress, not the frame, so it can never appear while the tile is still thumbnail-sized.',
  tags: ['motion', 'magic move', 'shared element', 'gallery', 'grid', 'hero', 'morph', 'portfolio'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 620,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'advanced',
  checkFrame: 34,
  posterFrame: 70,
  concepts: ['single source of slot geometry', 'rect interpolation', 'z-index promotion', 'progress-gated caption'],
};
