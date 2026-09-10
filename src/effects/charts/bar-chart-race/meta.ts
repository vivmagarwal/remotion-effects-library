import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'bar-chart-race', name: 'Bar Chart Race', category: 'charts',
  tagline: 'Bars grow, overtake and re-sort as the series advances.',
  description:
    'The classic data-race format. A continuous cursor (frame / framesPerStep) interpolates between adjacent data points so values glide rather than step, and rows are positioned by translate from their current rank rather than reordered in the DOM — which is what makes an overtake a visible slide past a rival instead of a teleport. The period label sits behind everything at 150px in 6% white, and a progress rail tracks the series. The bar track is flex:1 so a percentage is measured against the space left after the label gutter rather than against the whole row — measure against the row and every bar is short by the width of its own label.',
  tags: ['chart', 'counter', 'dashboard', 'explainer'],
  concepts: ['continuous cursor', 'rank-based positioning', 'value interpolation', 'tabular-nums'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 200,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 124,
  ground: 'dark', audience: ['data', 'youtuber', 'educator'],
};
