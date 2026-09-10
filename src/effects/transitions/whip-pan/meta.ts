import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'whip-pan', name: 'Whip Pan', category: 'transitions',
  tagline: 'A camera whips between shots, smeared along the axis of travel.',
  description:
    'A custom TransitionPresentation rather than a built-in one, which means it is plain DOM and renders anywhere — half of @remotion/transitions draws through HtmlInCanvas and WebGL2 and produces a blank frame where that is unavailable. Both scenes translate together, one frame apart, which is what reads as a camera rather than as one card sliding over another, and the blur peaks at the midpoint via sin(progress * PI) and is gone at both ends. The blur is applied on the axis of travel only, because a real whip smears in one direction.',
  tags: ['transition', 'camera', 'blur', 'impact'],
  concepts: ['TransitionPresentation', 'directional blur', 'single driver value'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 180,
  packages: ['remotion', '@remotion/transitions', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 46, posterFrame: 100,
  ground: 'dark', audience: ['youtuber', 'agency'],
};
