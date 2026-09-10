import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'transition-sampler', name: 'Transition Sampler', category: 'reference',
  tagline: 'Six @remotion/transitions presentations back to back, each labelled.',
  description:
    'A reference card as much as an effect: seven colour cards separated by fade, slide, wipe, clockWipe, iris and flip, with each card naming the exact call that produced the cut before it. Note that a transition shortens the timeline — two 42-frame scenes joined by an 18-frame transition occupy 66 frames, not 84 — so the composition duration has to subtract every transition length. clockWipe and iris additionally need width and height passed in from useVideoConfig(). Every card has to outlive the transitions on both of its sides, or two cuts overlap and three cards sit on screen at once with two labels superimposed — the hold here is 56 frames against a worst case of 20 + 18, leaving each card at least 18 solo frames.',
  tags: ['reference', 'transition', 'explainer', 'title'],
  concepts: ['TransitionSeries', 'springTiming', 'timeline length semantics'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 300,
  packages: ['remotion', '@remotion/transitions', '@remotion/google-fonts'],
  difficulty: 'starter', checkFrame: 170,
  ground: 'dark', audience: ['developer', 'educator'],
};
