import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'transition-sampler',
  name: 'Transition Sampler',
  category: 'transitions',
  tagline: 'Six @remotion/transitions presentations back to back, each labelled.',
  description:
    'A reference card as much as an effect: seven colour cards separated by fade, slide, wipe, clockWipe, iris and flip, with each card naming the exact call that produced the cut before it. Note that a transition shortens the timeline — two 42-frame scenes joined by an 18-frame transition occupy 66 frames, not 84 — so the composition duration has to subtract every transition length. clockWipe and iris additionally need width and height passed in from useVideoConfig().',
  tags: ['transition', 'fade', 'slide', 'wipe', 'clock wipe', 'iris', 'flip', 'reference', 'scenes'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 300,
  packages: ['remotion', '@remotion/transitions', '@remotion/google-fonts'],
  difficulty: 'starter',
  checkFrame: 170,
  concepts: ['TransitionSeries', 'presentation + timing', 'springTiming', 'duration arithmetic'],
};
