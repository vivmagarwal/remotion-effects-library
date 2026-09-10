import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'audiogram', name: 'Audiogram', category: 'sound',
  tagline: 'The podcast-clip format: cover art, live waveform, word-timed captions.',
  description:
    'A vertical podcast clip where the waveform reacts to the real audio via visualizeAudio() and the captions run off word timings from the same file — so the bars and the words can never drift apart. The cover art is a generated gradient plate rather than an image, which keeps the effect dependency-free. Bars are centred on their own axis so they grow symmetrically in both directions, which is what distinguishes a waveform from a bar chart. This is the format, not the mechanism: the bars are deliberately simple so the layout — art, caption line, waveform, in that vertical order — is what the entry teaches. FFT Bars is where the band-mapping and the perceptual correction live. useAudioData returns null on the first render while the file loads, so the zero-filled fallback is required here too.',
  tags: ['audio', 'waveform', 'music', 'captions', 'vertical', 'social'],
  concepts: ['visualizeAudio', 'useAudioData', 'word-level timing', 'null-while-loading'],
  width: 1080, height: 1920, fps: 30, durationInFrames: 180,
  packages: ['remotion', '@remotion/media', '@remotion/media-utils', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 74,
  requires: ['audio', 'transcript'], ground: 'dark', audience: ['podcaster', 'youtuber', 'agency'],
};
