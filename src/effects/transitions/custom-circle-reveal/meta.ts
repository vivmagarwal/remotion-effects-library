import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'custom-circle-reveal', name: 'Custom Circle Reveal', category: 'transitions',
  tagline: 'A hand-written TransitionPresentation — any CSS becomes a transition.',
  description:
    'The recipe for writing your own transition rather than picking one off the shelf. A TransitionPresentation is just {component, props}: the component receives presentationProgress and presentationDirection and decides how to draw its children. Here the entering scene is clipped with clipPath: circle(r% at x% y%) growing to 142% — a percentage radius in circle() resolves against sqrt(w²+h²)/sqrt(2) rather than the diagonal, so even 100% leaves the corners uncovered from an off-centre origin — while the exiting scene is returned untouched. Returning children unchanged for the exiting direction is the key move: animating both sides double-counts the transition and reads as a stutter. The scenes are yours — pass a list of {src, title, body} to reveal between your own clips, or leave src out of one and it draws a typographic card. Softness is applied on the first reveal only, because a blurred edge sells the technique once and starts to read as a rendering fault when it repeats.',
  tags: ['transition', 'clip-path', 'mask', 'css', 'footage'],
  concepts: ['TransitionPresentation', 'TransitionSeries', 'clip-path reveal'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 154,
  packages: ['remotion', '@remotion/media', '@remotion/transitions', '@remotion/google-fonts'],
  // 42 is four frames into the first reveal: the circle is a clean dark punch
  // in the daylight limb and both titles are still intact. Later than ~46 and
  // the clip edge crosses the headline, which on a card reads as a typo.
  difficulty: 'intermediate', checkFrame: 76, posterFrame: 42,
  requires: ['video'], ground: 'dark', audience: ['developer'],
};
