import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'notification-stack',
  name: 'Notification Stack',
  category: 'ui',
  tagline: 'Phone notifications slide in and push the stack down beneath them.',
  description:
    'Four iOS-style notification cards arriving on staggered springs. The detail that makes it a stack rather than four independent cards: each card\'s vertical offset is the sum of the heights of the cards above it, each weighted by that card\'s own entrance progress. So while card two is still springing in, card three is only partway pushed — the whole column settles as one system. Set transparent to render it as an alpha overlay to composite over a screen recording.',
  tags: ['ui', 'notification', 'ios', 'phone', 'toast', 'stack', 'overlay', 'social'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 150,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 58,
  concepts: ['coupled layout', 'cumulative offsets', 'staggered springs', 'transparent overlay'],
};
