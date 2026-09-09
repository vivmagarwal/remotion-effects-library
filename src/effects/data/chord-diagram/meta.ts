import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'chord-diagram',
  name: 'Chord Diagram',
  category: 'data',
  tagline: 'A ring of arcs joined by ribbons, reaching across as they arrive.',
  description:
    'The standard way to show flow between every pair in a set: a square matrix drawn as arcs around a circle, joined by ribbons whose width at each end is the flow in that direction. d3-chord is a pure function of the matrix — no simulation, no internal state — so it produces identical angles on every frame and only the reveal needs animating. The reveal itself is the interesting part: rather than fading a finished ribbon in, the ribbon generator is rebuilt each frame with a shrunken radius, so every chord literally grows out of the centre and reaches across the ring. Group arcs sweep open from their own start angle, and the labels flip past the vertical so none of them read upside down.',
  tags: ['data', 'chart', 'd3', 'chord', 'flow', 'matrix', 'svg', 'network'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 180,
  packages: ['remotion', 'd3-chord', 'd3-shape', 'd3-array', '@remotion/google-fonts'],
  difficulty: 'advanced',
  checkFrame: 62,
  concepts: ['d3-chord', 'ribbon()', 'arc()', 'polar labels', 'pure layout'],
};
