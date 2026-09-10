import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'donut-progress', name: 'Donut Progress', category: 'charts',
  tagline: 'Concentric rings sweeping to their values, with a matching legend.',
  description:
    'Three nested progress rings built from SVG circles with strokeDasharray rather than a conic-gradient — a stroked arc gives round caps, a proper dim track underneath, and exact control over where the sweep begins. Rotating the whole svg by -90deg is what puts 0% at twelve o\'clock instead of three. The legend percentages are driven by the same interpolation as the arcs, so the number and the ring can never disagree. The dash pattern is one dash exactly as long as the swept arc and one gap for the remainder, so the arc length is the value rather than an approximation of it — and the rings are staggered a few frames apart so three simultaneous sweeps do not read as one thick ring.',
  tags: ['chart', 'svg', 'progress', 'dashboard'],
  concepts: ['stroke-dashoffset draw', 'staggered entrance', 'multi-keyframe interpolate'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 120,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'starter', checkFrame: 44,
  ground: 'dark', audience: ['saas', 'data'],
};
