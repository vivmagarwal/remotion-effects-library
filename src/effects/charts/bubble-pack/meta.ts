import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'bubble-pack', name: 'Bubble Pack', category: 'charts',
  tagline: 'A circle-packing chart laid out by d3-hierarchy, growing into place.',
  description:
    'The clean division of labour for D3 in video: D3 computes the layout, React draws it. pack() is a pure function of the data — no simulation, no state — so it returns the identical packing on every frame and is safe to recompute per frame. Only the radius is animated; the positions come straight from D3 and never move, so the bubbles grow into their final packing rather than sliding into it, which is what keeps the layout readable while it builds. One node type serves both the synthetic root and the leaves: d3-hierarchy walks a single tree type, and giving the root and the leaves different shapes is what makes its generics fight you. Bubbles arrive biggest first, so the chart builds outward from its centre of mass.',
  tags: ['chart', 'd3', 'svg', 'hierarchy'],
  concepts: ['d3-hierarchy', 'deterministic layout', 'staggered entrance'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 180,
  packages: ['remotion', 'd3-hierarchy', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 46, posterFrame: 130,
  ground: 'both', audience: ['data', 'educator'], driveMode: 'pure',
};
