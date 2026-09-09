import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'effects-catalogue',
  name: 'Effects Catalogue',
  category: 'effects',
  tagline: 'A contact sheet of @remotion/effects — one plate, fifteen treatments.',
  description:
    'The same source through fifteen different effects, each labelled with the call that produced it, then a spotlight walks the grid naming each one. The package ships 71 effects and almost nothing documents them visually, so this is a reference first and a piece of motion second. Two things it teaches by construction: every effect takes a params object (none are zero-argument), and the parameter ranges are not uniform across the package — brightness takes a signed offset in [-1,1] while saturation is a multiplier — so each one\'s own type definition is the only reliable guide.',
  tags: ['effects', 'catalogue', 'reference', 'contact sheet', 'webgl', 'filters', 'grid', 'lookbook'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 380,
  packages: ['remotion', '@remotion/effects', '@remotion/google-fonts'],
  difficulty: 'starter',
  checkFrame: 40,
  posterFrame: 200,
  concepts: ['effects catalogue', 'one effect per element', 'spotlight sweep', 'per-effect param ranges'],
};
