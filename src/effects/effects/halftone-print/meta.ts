import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'halftone-print',
  name: 'Halftone Print',
  category: 'effects',
  tagline: 'Two inks and a dot screen that resolves from coarse to fine.',
  description:
    'A risograph / newsprint treatment: duotone() flattens the source to two inks first, then halftone() breaks the result into a dot screen at a 25° angle. Flattening before screening is what keeps it clean — screening a full-colour image gives muddy overlapping dots. The dot size animates 34→9 over 2.6s so the picture appears to resolve, and the headline carries a 9px offset second ink, which is the misregistration tell of a real two-colour press.',
  tags: ['effects', 'halftone', 'duotone', 'print', 'risograph', 'newsprint', 'poster', 'retro'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 120,
  packages: ['remotion', '@remotion/effects', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 40,
  concepts: ['duotone before halftone', 'animated effect params', 'print misregistration', 'paper grain'],
};
