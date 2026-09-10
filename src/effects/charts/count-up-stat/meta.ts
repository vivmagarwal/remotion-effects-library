import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'count-up-stat', name: 'Count-Up Stat', category: 'charts',
  tagline: 'A number races to its target and decelerates into the last few units.',
  description:
    'The counting mechanism on its own. The impact stack — shockwave ring, camera kick, recoil — belongs to Stat Slam; all that is left here is a 4.5% scale pulse as the number lands, so the arrival is punctuated rather than staged. Two details separate this from a naive counter. fontVariantNumeric: "tabular-nums" makes every digit the same width, so the number holds still instead of shuffling sideways each time a glyph changes; without it a four-digit counter visibly wobbles for its entire run. And the value is driven through a hard-decelerating bezier rather than a linear ramp, so most of the distance is covered in the first third and the last few units crawl in — which is what makes the final number feel arrived at rather than merely reached. The label and the prefix/suffix are separate nodes so they never inherit the tabular metrics.',
  tags: ['counter', 'chart', 'text', 'dashboard'],
  concepts: ['tabular-nums', 'Easing.bezier', 'value interpolation'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 120,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'starter', checkFrame: 18,
  ground: 'both', audience: ['saas', 'data', 'youtuber'],
};
