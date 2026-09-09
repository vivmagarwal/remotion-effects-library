import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'audiogram',
  name: 'Audiogram',
  category: 'audio',
  tagline: 'The podcast-clip format: cover art, live waveform, word-timed captions.',
  description:
    'A vertical podcast clip where the waveform reacts to the real audio via visualizeAudio() and the captions run off word timings from the same file — so the bars and the words can never drift apart. The cover art is a generated gradient plate rather than an image, which keeps the effect dependency-free. Bars are centred on their own axis so they grow symmetrically in both directions, which is what distinguishes a waveform from a bar chart.',
  tags: ['audio', 'audiogram', 'podcast', 'waveform', 'captions', 'social', 'clip', 'vertical'],
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 180,
  packages: ['remotion', '@remotion/media', '@remotion/media-utils', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 74,
  concepts: ['visualizeAudio', 'word-timed captions', 'symmetric bars', 'generated cover art'],
};
