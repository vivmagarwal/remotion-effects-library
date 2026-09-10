import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'whip-pan', name: 'Whip Pan', category: 'transitions',
  tagline: 'A camera whips between shots, smeared along the axis of travel.',
  description:
    'A custom TransitionPresentation rather than a built-in one, which means it is plain DOM and renders anywhere — half of @remotion/transitions draws through HtmlInCanvas and WebGL2 and produces a blank frame where that is unavailable. Both scenes translate together, one frame apart, which is what reads as a camera rather than as one card sliding over another, and the blur peaks at the midpoint via sin(progress * PI) and is gone at both ends — zero at both ends by construction, so no frame of either shot is ever delivered soft. The blur is applied on the axis of travel only, because a real whip smears in one direction and blurring both axes reads as a focus pull. The shots are yours: pass a list of {src, kicker, line} and it whips between your clips, or leave src out of a shot and it draws a typographic card instead. The final shot carries one extra transition\'s worth of frames, because a TransitionSeries subtracts every transition from the total and a composition that ends mid-whip ends on a smear.',
  tags: ['transition', 'camera', 'blur', 'impact', 'footage'],
  concepts: ['TransitionPresentation', 'directional blur', 'single driver value'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 184,
  packages: ['remotion', '@remotion/media', '@remotion/transitions', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 46, posterFrame: 100,
  requires: ['video'], ground: 'dark', audience: ['youtuber', 'agency'],
};
