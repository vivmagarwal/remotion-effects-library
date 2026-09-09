import type {EffectMeta} from '../../../types';
export const meta: EffectMeta = {
  id: 'checklist-ticks', name: 'Checklist Ticks', category: 'ui',
  tagline: 'Rows ticked off one at a time, each check drawn on.',
  description:
    'Rows ticked off one at a time. The check is a real SVG path drawn on with stroke-dashoffset rather than a static glyph that fades in — you watch the pen stroke, which reads as a decision being made rather than a result appearing. Four beats run in sequence per row: the row springs in, the check draws, the box fills as the stroke completes, then a rule strikes through. The strike is its own element because text-decoration cannot be animated, and its wrapper must be inline-block: a block-level wrapper stretches to the full row and the rule strikes through the empty space after the label too. The dash array is rounded UP from the path\'s true length, since a dash shorter than the path never finishes.',
  tags: ['ui', 'checklist', 'svg', 'stroke-dashoffset'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 180,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 78, posterFrame: 132,
  concepts: ['stroke-dashoffset draw-on', 'animated strike-through', 'spring stagger'],
};
