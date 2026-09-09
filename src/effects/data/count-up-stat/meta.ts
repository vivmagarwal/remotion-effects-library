import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'count-up-stat',
  name: 'Count-Up Stat',
  category: 'data',
  tagline: 'A number races to its target, then lands with a small punch.',
  description:
    'One big statistic ticking from zero, with a label under it. Two details separate this from a naive counter: fontVariantNumeric: "tabular-nums" makes every digit the same width so the number does not shuffle sideways as it counts, and a hard-decelerating bezier means most of the distance is covered in the first third while the last few units crawl in — which is what makes the arrival feel earned. A 4.5% scale pulse on landing punctuates it.',
  tags: ['data', 'counter', 'stat', 'number', 'kpi', 'metric', 'count up'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 120,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'starter',
  checkFrame: 18,
  concepts: ['tabular-nums', 'deceleration easing', 'toLocaleString', 'landing pulse'],
};
