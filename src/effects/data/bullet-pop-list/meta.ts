import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'bullet-pop-list',
  name: 'Bullet Pop List',
  category: 'data',
  tagline: 'A titled list whose items fly in one at a time, along a drawn spine.',
  description:
    'The workhorse of explainer video, built so it does not misbehave: rows sit at fixed absolute slots and animate only within them, so the block never reflows as items arrive and the list stays put instead of creeping up the frame while it fills. The marker overshoots slightly more than its row, which makes it read as the thing that arrived and pulled the text along, and a spine draws down behind the markers only as far as the last item that has landed.',
  tags: ['data', 'list', 'bullets', 'explainer', 'slide', 'agenda', 'stagger', 'points'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 165,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'starter',
  checkFrame: 44,
  posterFrame: 110,
  concepts: ['fixed slots, no reflow', 'staggered springs', 'differential overshoot', 'progressive spine'],
};
