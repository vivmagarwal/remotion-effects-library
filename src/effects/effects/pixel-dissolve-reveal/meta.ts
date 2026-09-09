import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'pixel-dissolve-reveal',
  name: 'Pixel Dissolve Reveal',
  category: 'effects',
  tagline: 'An image materialises as its mosaic resolves and a dissolve fills in.',
  description:
    'Two @remotion/effects passes driven by one progress in opposite directions: pixelate() goes from 64px blocks down to 1 while pixelDissolve() fills the frame from empty to complete, so the picture arrives once rather than twice. The order in the effects array is load-bearing — mosaic first, then dissolve the mosaic. Reversed, the dissolve\'s own hard block edges get re-blocked by the pixelate and the whole thing reads as noise rather than as an image resolving.',
  tags: ['effects', 'pixel', 'dissolve', 'mosaic', 'reveal', 'glitch', 'decode', 'webgl'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 150,
  packages: ['remotion', '@remotion/effects', '@remotion/google-fonts'],
  difficulty: 'starter',
  checkFrame: 48,
  posterFrame: 96,
  concepts: ['effects array ordering', 'opposed progress', 'animated effect params', 'clamped block size'],
};
