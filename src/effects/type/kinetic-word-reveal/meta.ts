import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'kinetic-word-reveal', name: 'Kinetic Word Reveal', category: 'type',
  tagline: 'Words push up from behind a hard edge, one after another.',
  description:
    'Each word sits inside its own overflow-hidden wrapper and slides up from 110% to 0 on a staggered ease-out curve, so it reads as being pushed out from behind a solid edge rather than fading in. A hairline rule draws itself underneath once the last word lands. The masking wrapper is the whole trick — without it this is just a fade. The masking wrapper needs line-height 1.3, not 1: at 1 the line box is shorter than the font’s ascent plus descent, so g, j, p and y hang below it and get sheared flat by the mask no matter how much padding is added. The rule underneath starts the moment the last word starts moving rather than after it lands, so it grows alongside the final arrival instead of waiting through a beat of silence.',
  tags: ['text', 'title', 'kinetic-type', 'mask', 'stagger'],
  concepts: ['overflow clipping', 'staggered entrance', 'Easing.bezier'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 70,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'starter', checkFrame: 6, posterFrame: 34,
  ground: 'both', audience: ['youtuber', 'educator'],
};
