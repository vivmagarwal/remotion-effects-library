import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'text-behind-subject', name: 'Text Behind Subject', category: 'type',
  tagline: 'Type sandwiched between a scene and its foreground, so the subject cuts it off.',
  description:
    'Three layers in one order: the whole scene, the type, then the same scene\'s foreground with real transparency. The third layer is the effect — it has to be a genuine cutout with alpha, not a copy of the plate, or there is nothing for the words to disappear behind. All three share one push value so the parallax stays coherent, with the type drifting 35% faster to separate it from both plates without breaking the sandwich. For real footage, produce the cutout with a matting tool and drop it in as the subject layer. Scaling only the subject layer is the obvious shortcut and it breaks the illusion immediately: the cutout stops lining up with the plate it was cut from, and the eye reads the seam before it reads the type.',
  tags: ['text', 'title', 'photo', 'overlay', 'parallax'],
  concepts: ['layer sandwich', 'depth-derived layout', 'paint order'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 180,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'starter', checkFrame: 30, posterFrame: 120,
  requires: ['image'], ground: 'dark', audience: ['youtuber', 'agency'],
};
