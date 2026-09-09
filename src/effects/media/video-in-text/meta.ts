import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'video-in-text',
  name: 'Video In Text',
  category: 'media',
  tagline: 'Footage inside letterforms, then the type opens up and swallows the frame.',
  description:
    'An SVG clipPath containing real <text>, applied to a layer holding the media. This is the technique that background-clip: text cannot do — that property clips a paint, so it can carry a gradient but never a video or an image element. Scaling the mask about the frame centre while the content stays put turns a text-shaped window into a full-frame reveal, which makes the same component both a title and a transition.',
  tags: ['media', 'text mask', 'clip-path', 'svg', 'video in text', 'title', 'reveal', 'transition'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 180,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 20,
  posterFrame: 50,
  concepts: ['SVG clipPath of text', 'userSpaceOnUse', 'mask-scale reveal', 'clip vs background-clip'],
};
