import type {EffectMeta} from '../../../types';
export const meta: EffectMeta = {
  id: 'metaball-goo', name: 'Metaball Goo', category: 'effects',
  tagline: 'Circles merging with liquid necks, from two SVG filter primitives.',
  description:
    'The classic gooey filter, and it is only two steps. feGaussianBlur bleeds neighbouring shapes into each other; feColorMatrix then multiplies the ALPHA channel by a large number and subtracts a bias, which snaps the soft bleed back to a hard edge — everything above the cutoff becomes opaque, everything below vanishes, and wherever two blurs overlapped their sum crosses the cutoff, which is exactly the neck between two blobs. Only the last row of the matrix is touched; the colour rows are identity. Two numbers govern the look: raise stdDeviation and necks form from further apart, and the alpha multiplier needs to be above roughly 30 or the edge stays soft. The filter region has to be expanded past the default 110% or the blur is clipped at the bounding box.',
  tags: ['effects', 'svg', 'filter', 'metaball', 'gooey', 'feColorMatrix', 'blobs'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 180,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 88,
  concepts: ['feGaussianBlur', 'feColorMatrix alpha contrast', 'feBlend', 'filter region'],
};
