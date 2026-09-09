import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'kinetic-word-reveal',
  name: 'Kinetic Word Reveal',
  category: 'text',
  tagline: 'Words push up from behind a hard edge, one after another.',
  description:
    'Each word sits inside its own overflow-hidden wrapper and slides up from 110% to 0 on a staggered ease-out curve, so it reads as being pushed out from behind a solid edge rather than fading in. A hairline rule draws itself underneath once the last word lands. The masking wrapper is the whole trick — without it this is just a fade.',
  tags: ['text', 'kinetic typography', 'mask', 'stagger', 'reveal', 'title'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 70,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'starter',
  checkFrame: 6,
  posterFrame: 34,
  concepts: ['interpolate', 'stagger', 'clip mask', 'Easing.bezier', 'translate shorthand'],
};
