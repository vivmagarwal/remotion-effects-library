import type {EffectMeta} from '../../../types';
export const meta: EffectMeta = {
  id: 'chapter-divider', name: 'Chapter Divider', category: 'openers',
  tagline: 'The card between sections — in, hold, and fully out.',
  description:
    'The card that sits between sections of a longer video, built as a complete in-hold-out so it clears the frame before the composition ends — which means it drops into a Series or TransitionSeries without trimming, and the shot after it starts clean. Two panels slide in to meet on the centre line and part again on the way out, both solved from a single progress value so they stay exactly symmetrical. Every piece of text is one four-stop interpolate rather than a pair of entrance and exit animations, so there is no second set of numbers to keep in sync; the exit delays are scaled to 0.4 of the entrance delays, which makes leaving read as decisive rather than reluctant.',
  tags: ['opener', 'divider', 'chapter', 'title card'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 150,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'starter', checkFrame: 40, posterFrame: 76,
  concepts: ['symmetric bands', 'four-stop interpolate', 'self-clearing'],
};
