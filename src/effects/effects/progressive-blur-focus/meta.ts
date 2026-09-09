import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'progressive-blur-focus',
  name: 'Progressive Blur Focus',
  category: 'effects',
  tagline: 'A rack focus built from a blur that is sharp at a point and soft outward.',
  description:
    'A camera pulling focus, using radialProgressiveBlur() rather than a uniform blur faded up and down. That distinction is the effect: a real lens is sharp at one plane and softens away from it, so a progressive blur reads as a camera while a uniform one reads as a filter being switched on. A second linearProgressiveBlur at 90° adds the vertical falloff of a shallow depth of field, and the focus pull uses a multi-keyframe interpolate with an accelerate-and-settle easing, because a linear pull reads as mechanical.',
  tags: ['effects', 'blur', 'focus', 'rack focus', 'depth of field', 'cinematic', 'lens', 'webgl'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 165,
  packages: ['remotion', '@remotion/effects', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 45,
  concepts: ['progressive vs uniform blur', 'stacked falloffs', 'multi-keyframe rack', 'lens easing'],
};
