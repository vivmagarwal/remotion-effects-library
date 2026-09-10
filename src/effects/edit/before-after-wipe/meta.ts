import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'before-after-wipe', name: 'Before / After Wipe', category: 'edit',
  tagline: 'A split comparison whose handle sweeps across the frame.',
  description:
    'A before/after comparison built the only way that stays honest: both versions are drawn full-frame at identical geometry, one stacked on the other, and only the top layer is clipped with clip-path inset. Nothing is scaled or cropped, so the two halves stay in perfect registration wherever the handle sits — which is what most comparison wipes get wrong. The handle sweeps through a multi-keyframe interpolate that overshoots and settles, and each label fades out as the handle closes in on its side. Both layers are the same real clip with two different grades, which is the only version of this comparison that proves anything: a wipe between two treatments of a vector plate shows the wipe working and says nothing about the grade. The clip is on the wrapper, so the media underneath never learns it is being cropped.',
  tags: ['comparison', 'transition', 'photo', 'overlay'],
  concepts: ['clip-path reveal', 'layer sandwich', 'multi-keyframe interpolate'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 165,
  packages: ['remotion', '@remotion/media', '@remotion/effects', '@remotion/google-fonts'],
  difficulty: 'starter', checkFrame: 45,
  requires: ['video'], ground: 'dark', audience: ['youtuber', 'agency', 'saas'],
};
