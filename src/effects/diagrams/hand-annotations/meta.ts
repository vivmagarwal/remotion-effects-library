import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'hand-annotations', name: 'Hand Annotations', category: 'diagrams',
  tagline: 'Highlights, circles and strike-throughs drawn on by hand, one by one.',
  description:
    'Six kinds of rough hand-drawn mark — highlight, circle, strike-through, underline, box and crossed-off — landing on a paragraph in sequence, using @remotion/rough-notation. The key is that every mark takes a progress prop driven by interpolate(frame, …) rather than animating itself: the library will happily auto-play, and an auto-playing annotation renders at a different point on every frame Remotion captures. Keeping the interpolate call inline also means Studio can retime each mark by dragging it. This is the entry that needs the extra package: @remotion/rough-notation. Where Headline Highlight hand-rolls one mark out of a positioned div, this gets six mark types for free and pays for them with a dependency and with the discipline of never letting the library run its own clock.',
  tags: ['annotation', 'highlight', 'hand-drawn', 'explainer', 'draw-on'],
  concepts: ['progress-driven library', 'staggered entrance', 'Easing.bezier'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 210,
  packages: ['remotion', '@remotion/rough-notation', '@remotion/google-fonts'],
  difficulty: 'starter', checkFrame: 62, posterFrame: 170,
  ground: 'light', audience: ['educator', 'youtuber'], driveMode: 'seek',
};
