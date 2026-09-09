import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'before-after-wipe',
  name: 'Before / After Wipe',
  category: 'media',
  tagline: 'A split comparison whose handle sweeps across the frame.',
  description:
    'A before/after comparison built the only way that stays honest: both versions are drawn full-frame at identical geometry, one stacked on the other, and only the top layer is clipped with clip-path inset. Nothing is scaled or cropped, so the two halves stay in perfect registration wherever the handle sits — which is what most comparison wipes get wrong. The handle sweeps through a multi-keyframe interpolate that overshoots and settles, and each label fades out as the handle closes in on its side.',
  tags: ['media', 'before after', 'comparison', 'wipe', 'split', 'grade', 'reveal', 'slider'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 165,
  packages: ['remotion', '@remotion/effects', '@remotion/google-fonts'],
  difficulty: 'starter',
  checkFrame: 45,
  concepts: ['clip-path inset', 'stacked identical layers', 'multi-keyframe interpolate', 'position-driven opacity'],
};
