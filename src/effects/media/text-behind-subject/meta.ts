import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'text-behind-subject',
  name: 'Text Behind Subject',
  category: 'media',
  tagline: 'Type sandwiched between a scene and its foreground, so the subject cuts it off.',
  description:
    'Three layers in one order: the whole scene, the type, then the same scene\'s foreground with real transparency. The third layer is the effect — it has to be a genuine cutout with alpha, not a copy of the plate, or there is nothing for the words to disappear behind. All three share one push value so the parallax stays coherent, with the type drifting 35% faster to separate it from both plates without breaking the sandwich. For real footage, produce the cutout with a matting tool and drop it in as the subject layer.',
  tags: ['media', 'text behind', 'depth', 'occlusion', 'layers', 'title', 'parallax', 'cutout'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 180,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'starter',
  checkFrame: 30,
  posterFrame: 120,
  concepts: ['layer sandwich', 'alpha cutout', 'shared push', 'differential parallax'],
};
