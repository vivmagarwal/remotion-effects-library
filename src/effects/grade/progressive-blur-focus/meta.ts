import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'progressive-blur-focus', name: 'Progressive Blur Focus', category: 'grade',
  tagline: 'A rack focus built from a blur that is sharp at a point and soft outward.',
  description:
    'A camera pulling focus, using radialProgressiveBlur() rather than a uniform blur faded up and down. That distinction is the effect: a real lens is sharp at one plane and softens away from it, so a progressive blur reads as a camera while a uniform one reads as a filter being switched on. A second linearProgressiveBlur at 90° adds the vertical falloff of a shallow depth of field, and the focus pull uses a multi-keyframe interpolate with an accelerate-and-settle easing, because a linear pull reads as mechanical. The type sits above the lens rather than in front of it, so the title stays sharp through the whole pull — putting it inside the effect stack blurs the one element the viewer is meant to read. Needs Chromium’s ANGLE renderer, which remotion.config.ts already sets; without it the frame renders blank rather than erroring.',
  tags: ['blur', 'cinematic', 'photo', 'shader'],
  concepts: ['effects array ordering', 'animated effect params', 'multi-keyframe interpolate'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 165,
  packages: ['remotion', '@remotion/effects', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 45,
  requires: ['image'], ground: 'dark', audience: ['youtuber', 'agency'],
};
