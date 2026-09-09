import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'sunburst-rings',
  name: 'Sunburst Rings',
  category: 'data',
  tagline: 'A hierarchy opening outward, one concentric ring per level.',
  description:
    'A sunburst is a treemap in polar coordinates. d3-hierarchy partition() lays a tree into a rectangle where x is the span and y is the depth, so sizing that rectangle [2π, radius] turns every rectangle straight into an arc — that one substitution is the whole technique. Each ring opens a beat after the ring inside it, and each wedge does two things at once: it sweeps open from its own start angle while also growing outward from its inner radius, which reads as the level unfolding rather than merely appearing. Colour is inherited by walking up to the nearest ancestor that declares one, so adding a branch never means restating a palette. Labels are suppressed on any wedge too narrow to hold them.',
  tags: ['data', 'chart', 'd3', 'sunburst', 'hierarchy', 'partition', 'radial', 'svg'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 180,
  packages: ['remotion', 'd3-hierarchy', 'd3-shape', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 54,
  concepts: ['d3-hierarchy', 'partition()', 'polar arcs', 'inherited colour', 'staggered depth'],
};
