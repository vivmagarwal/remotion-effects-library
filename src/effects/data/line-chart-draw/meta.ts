import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'line-chart-draw',
  name: 'Line Chart Draw',
  category: 'data',
  tagline: 'The line draws itself, with a value read-out riding the leading edge.',
  description:
    'A line chart that draws with the stroke-dasharray trick: set the dash to the path\'s own length and animate strokeDashoffset from that length down to zero. The gradient area beneath is revealed by an SVG clipPath rectangle whose width tracks the same progress, and a dot rides the leading edge with the interpolated value shown above the chart — so line, fill, dot and number all arrive together instead of drifting apart. Axis labels light up as the line passes them.',
  tags: ['data', 'chart', 'line chart', 'svg', 'draw', 'analytics', 'stroke-dasharray', 'graph'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 120,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 46,
  concepts: ['stroke-dasharray draw', 'clipPath wipe', 'polyline interpolation', 'synchronised cues'],
};
