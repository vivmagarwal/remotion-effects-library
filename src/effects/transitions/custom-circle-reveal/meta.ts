import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'custom-circle-reveal',
  name: 'Custom Circle Reveal',
  category: 'transitions',
  tagline: 'A hand-written TransitionPresentation — any CSS becomes a transition.',
  description:
    'The recipe for writing your own transition rather than picking one off the shelf. A TransitionPresentation is just {component, props}: the component receives presentationProgress and presentationDirection and decides how to draw its children. Here the entering scene is clipped with clipPath: circle(r% at x% y%) growing to 142% — a percentage radius in circle() resolves against sqrt(w²+h²)/sqrt(2) rather than the diagonal, so even 100% leaves the corners uncovered from an off-centre origin — while the exiting scene is returned untouched. Returning children unchanged for the exiting direction is the key move: animating both sides double-counts the transition and reads as a stutter.',
  tags: ['transition', 'custom', 'presentation', 'clip-path', 'circle', 'reveal', 'api'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 138,
  packages: ['remotion', '@remotion/transitions', '@remotion/google-fonts'],
  difficulty: 'advanced',
  checkFrame: 76,
  concepts: ['TransitionPresentation', 'presentationProgress', 'presentationDirection', 'clip-path circle'],
};
