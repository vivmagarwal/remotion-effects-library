import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'freeze-trail', name: 'Freeze Trail', category: 'edit',
  tagline: 'Motion blur made from time — twelve past copies of the same subject.',
  description:
    'The subject is drawn twelve times, each wrapped in a <Freeze> set a couple of frames further into the past, at decaying opacity. The trail is a real record of where the thing was, so it bends through curves and bunches up where the subject slows — neither of which a directional blur filter can do. The one requirement is that the subject reads useCurrentFrame() itself: a subject positioned by a prop from the parent ignores the freeze entirely and every echo lands in the same place. The echoes are painted oldest first so the live subject lands last and stays crisp; drawn the other way round, twelve semi-transparent ghosts sit on top of the thing they are meant to be trailing.',
  tags: ['footage', 'camera', 'blur', 'stagger'],
  concepts: ['Freeze', 'staggered entrance', 'paint order'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 180,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 24, posterFrame: 68,
  ground: 'dark', audience: ['youtuber', 'agency'],
};
