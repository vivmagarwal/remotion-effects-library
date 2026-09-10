import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'halftone-print', name: 'Halftone Print', category: 'looks',
  tagline: 'Two inks and a dot screen that resolves from coarse to fine.',
  description:
    'A risograph / newsprint treatment: duotone() flattens the source to two inks first, then halftone() breaks the result into a dot screen at a 25° angle. Flattening before screening is what keeps it clean — screening a full-colour image gives muddy overlapping dots. The dot size animates 34→9 over 2.6s so the picture appears to resolve, and the headline carries a 9px offset second ink, which is the misregistration tell of a real two-colour press. The headline sits on a solid paper band rather than over the screen: set over the ink it disappears into the dots, and a band across the lower third is how a real two-colour poster is laid out anyway. Needs the ANGLE renderer.',
  tags: ['print', 'retro', 'colour', 'photo'],
  concepts: ['effects array ordering', 'animated effect params', 'SVG filter primitives'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 120,
  packages: ['remotion', '@remotion/effects', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 40,
  requires: ['image'], ground: 'light', audience: ['agency', 'educator'],
};
