import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'video-in-text', name: 'Video In Text', category: 'type',
  tagline: 'Footage inside letterforms, then the type opens up and swallows the frame.',
  description:
    'An SVG clipPath containing real <text>, applied to a layer holding the media. This is the technique that background-clip: text cannot do — that property clips a paint, so it can carry a gradient but never a video or an image element. Scaling the mask about the frame centre while the content stays put turns a text-shaped window into a full-frame reveal, which makes the same component both a title and a transition. The clipPath lives inside a zero-size <svg>: it is a definition, not a drawing, and giving it a size puts an invisible box in the layout. The media itself never moves — only the mask grows — so the footage stays framed the whole way through the reveal, and a slow independent push on the media keeps it alive behind the letterforms. The default source is a real 6-second Earth-from-orbit clip rather than a still: the whole effect depends on something bright MOVING inside the letters, and a flat plate makes it look like the mask never opened.',
  tags: ['text', 'title', 'mask', 'svg', 'transition'],
  concepts: ['SVG clipPath', 'background-clip: text', 'progress-gated reveal'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 180,
  packages: ['remotion', '@remotion/media', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 20,
  // 80, not 50: at 50 the mask is still small and the plate is on its dark limb, so the
  // card reads as grey type. 80 is the last frame before the mask starts swallowing the
  // frame — letterforms full of bright cloud, which is the thing the effect is for.
  posterFrame: 80,
  requires: ['video'], ground: 'dark', audience: ['youtuber', 'agency'],
};
