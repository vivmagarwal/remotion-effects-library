import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'mask-reveal-kit', name: 'Mask Reveal Kit', category: 'reference',
  tagline: 'Six reveals from one mechanism: a CSS mask gradient driven by progress.',
  description:
    'Wipe, soft wipe, diagonal stripes, iris, barn door and stair step — all from a single exported maskFor(pattern, p) function returning a CSS mask-image string. Where the gradient is opaque the layer shows; where it is transparent it is cut away. Because the whole family is one function of progress, adding a seventh reveal is one more case rather than a new component, and any of them works over any content. The stripes widen rather than travel, which fills the picture in between them instead of sliding it under them. Both maskImage and WebkitMaskImage have to be set — Chrome still wants the prefixed form — and a multi-layer mask needs its per-layer size and position honoured or every band renders at full frame size.',
  tags: ['reference', 'mask', 'transition', 'photo'],
  concepts: ['CSS mask-image', 'multi-keyframe interpolate', 'progress-gated reveal'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 330,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 28, posterFrame: 92,
  requires: ['image'], ground: 'dark', audience: ['developer', 'agency'],
  credit: {
    label: 'Reveal family inspired by the mask-* effects in cssanimation.io',
    url: 'https://cssanimation.io/',
  },
};
