import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'pixel-dissolve-reveal', name: 'Pixel Dissolve Reveal', category: 'looks',
  tagline: 'An image materialises as its mosaic resolves and a dissolve fills in.',
  description:
    'Two @remotion/effects passes driven by one progress in opposite directions: pixelate() goes from 64px blocks down to 1 while pixelDissolve() fills the frame from empty to complete, so the picture arrives once rather than twice. The order in the effects array is load-bearing — mosaic first, then dissolve the mosaic. Reversed, the dissolve\'s own hard block edges get re-blocked by the pixelate and the whole thing reads as noise rather than as an image resolving. Block size is clamped at 1: below that pixelate() is a no-op, and an unclamped value spends the last few frames doing nothing while the dissolve carries the shot alone. Needs the ANGLE renderer.',
  tags: ['transition', 'glitch', 'photo', 'shader'],
  concepts: ['effects array ordering', 'animated effect params', 'single driver value'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 150,
  packages: ['remotion', '@remotion/effects', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 48, posterFrame: 96,
  requires: ['image'], ground: 'dark', audience: ['youtuber', 'agency'],
};
