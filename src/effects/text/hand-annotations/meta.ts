import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'hand-annotations',
  name: 'Hand Annotations',
  category: 'text',
  tagline: 'Highlights, circles and strike-throughs drawn on by hand, one by one.',
  description:
    'Six kinds of rough hand-drawn mark — highlight, circle, strike-through, underline, box and crossed-off — landing on a paragraph in sequence, using @remotion/rough-notation. The key is that every mark takes a progress prop driven by interpolate(frame, …) rather than animating itself: the library will happily auto-play, and an auto-playing annotation renders at a different point on every frame Remotion captures. Keeping the interpolate call inline also means Studio can retime each mark by dragging it.',
  tags: ['text', 'annotation', 'highlight', 'circle', 'underline', 'hand drawn', 'marker', 'explainer'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 210,
  packages: ['remotion', '@remotion/rough-notation', '@remotion/google-fonts'],
  difficulty: 'starter',
  checkFrame: 62,
  posterFrame: 170,
  concepts: ['rough-notation', 'progress-driven library', 'sequenced marks', 'inline interpolate'],
};
