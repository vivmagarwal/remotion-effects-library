import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'effects-catalogue', name: 'Effects Catalogue', category: 'reference',
  tagline: 'A contact sheet of @remotion/effects — one plate, fifteen treatments.',
  description:
    'The same source through fifteen different effects, each labelled with the call that produced it, then a spotlight walks the grid naming each one. The package ships 71 effects and almost nothing documents them visually, so this is a reference first and a piece of motion second. Two things it teaches by construction: every effect takes a params object (none are zero-argument), and the parameter ranges are not uniform across the package — brightness takes a signed offset in [-1,1] while saturation is a multiplier — so each one\'s own type definition is the only reliable guide. Filed under Reference rather than Visual FX: nobody cuts a fifteen-up contact sheet into a video, and leaving it in the shot categories makes the catalogue look larger than it is. Fifteen simultaneous WebGL passes need the ANGLE renderer or the whole sheet comes back blank.',
  tags: ['reference', 'shader', 'colour', 'grid'],
  concepts: ['effects array ordering', 'animated effect params', 'staggered entrance'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 380,
  packages: ['remotion', '@remotion/effects', '@remotion/google-fonts'],
  difficulty: 'advanced', checkFrame: 40, posterFrame: 200,
  requires: ['image'], ground: 'dark', audience: ['developer', 'agency'],
};
