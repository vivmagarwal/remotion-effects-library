import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'bullet-pop-list', name: 'Bullet Pop List', category: 'diagrams',
  tagline: 'A titled list whose items fly in one at a time, along a drawn spine.',
  description:
    'The workhorse of explainer video, built so it does not misbehave: rows sit at fixed absolute slots and animate only within them, so the block never reflows as items arrive and the list stays put instead of creeping up the frame while it fills. The marker overshoots slightly more than its row, which makes it read as the thing that arrived and pulled the text along, and a spine draws down behind the markers only as far as the last item that has landed. The note under each row trails its own row by a frame or two, which is enough to read as one object arriving with a caption attached rather than two things arriving together.',
  tags: ['list', 'explainer', 'stagger', 'diagram'],
  concepts: ['fixed slots without reflow', 'staggered entrance', 'spring overshoot', 'stroke-dashoffset draw'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 165,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'starter', checkFrame: 44, posterFrame: 110,
  ground: 'both', audience: ['educator', 'saas', 'agency'],
};
