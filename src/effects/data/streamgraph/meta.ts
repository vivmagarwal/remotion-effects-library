import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'streamgraph',
  name: 'Streamgraph',
  category: 'data',
  tagline: 'Stacked bands flowing like a river around a wandering baseline.',
  description:
    'Two d3-shape choices are what make this a streamgraph rather than a stacked area chart. stackOffsetWiggle floats the baseline to minimise how much the bands have to wobble, which is why the shape looks like a current instead of a pile; stackOrderInsideOut puts the series that peak earliest on the outside, so the eye follows the flow. curveBasis gives organic edges — with the default linear curve the same data looks like cut paper. One gotcha follows from the wiggle offset: the baseline is signed, so the y extent has to be read back out of the stacked output rather than assumed to start at zero. The river draws itself left to right behind an SVG clipPath with a bright leading edge, which reads as a playhead rather than a wipe.',
  tags: ['data', 'chart', 'd3', 'streamgraph', 'stack', 'area', 'time series', 'svg'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 180,
  packages: ['remotion', 'd3-shape', 'd3-scale', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 64,
  concepts: ['stackOffsetWiggle', 'stackOrderInsideOut', 'curveBasis', 'clipPath wipe', 'random(seed)'],
};
