import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'browser-window-scroll',
  name: 'Browser Window Scroll',
  category: 'ui',
  tagline: 'A product page scrolling inside tilted browser chrome.',
  description:
    'A full landing page — hero, feature cards, stat band, CTA — scrolling inside macOS browser chrome tilted in 3D. Two structural points: the viewport div carries overflow: hidden while the page inside is translated upward, which is what turns a tall page into a scroll without any scroll container; and the perspective property must sit on the PARENT of the tilted element, not on the element itself, or rotateX and rotateY produce a flat skew instead of depth. A tracking scrollbar thumb sized to the viewport-to-page ratio completes the illusion.',
  tags: ['ui', 'browser', 'mockup', 'website', 'scroll', 'product demo', 'saas', '3d tilt'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 180,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 112,
  concepts: ['overflow scroll simulation', 'CSS perspective on parent', 'device chrome', 'derived scrollbar'],
  credit: {
    label: 'Idea from “Product Demo for Presscut” in the Remotion prompt showcase',
    url: 'https://www.remotion.dev/prompts',
  },
};
