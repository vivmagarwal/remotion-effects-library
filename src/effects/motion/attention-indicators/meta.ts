import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'attention-indicators',
  name: 'Attention Indicators',
  category: 'motion',
  tagline: 'Four ways to point at something on screen, borrowed from Manim.',
  description:
    'Circumscribe draws a rounded box on with stroke-dashoffset; Indicate swells and recolours in place; Flash fires rays out of a point; FocusOn dims the frame through an SVG mask whose hole closes onto the target. All four run on Manim\'s own rate functions — smooth (3t²−2t³) and there_and_back — which is why they settle rather than stop. Every one takes a rect, so they can be pointed at anything, and the panel here is only a subject to demonstrate on.',
  tags: ['motion', 'attention', 'indicate', 'circumscribe', 'flash', 'focus', 'explainer', 'manim', 'callout'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 280,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'advanced',
  checkFrame: 40,
  posterFrame: 200,
  concepts: ['Manim rate functions', 'stroke-dashoffset draw', 'SVG mask spotlight', 'rect-addressed effects'],
  credit: {
    label: 'Indication vocabulary borrowed from Manim (3Blue1Brown)',
    url: 'https://github.com/3b1b/manim',
  },
};
