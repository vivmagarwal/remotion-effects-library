import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'audio-spectrum',
  name: 'Audio Spectrum',
  category: 'audio',
  tagline: 'Real FFT bars reacting to the actual audio file, not a fake waveform.',
  description:
    'useAudioData() plus visualizeAudio() from @remotion/media-utils read the real waveform, so the bars track the actual track rather than a sine approximation. The detail that makes it look alive: visualizeAudio returns linear amplitudes and the ear is logarithmic, so raising each band to a power around 0.42 before drawing lifts the quiet detail — without it the bars sit near zero except on the loudest peaks. useAudioData returns null on the first render while the file loads, so a zero-filled fallback is required or the component crashes.',
  tags: ['audio', 'spectrum', 'visualizer', 'fft', 'music', 'waveform', 'podcast', 'audiogram'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 180,
  packages: ['remotion', '@remotion/media', '@remotion/media-utils', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 90,
  concepts: ['visualizeAudio', 'useAudioData', 'gamma correction', 'null-while-loading'],
  credit: {
    label: 'Idea from “Audio Spectrum Visualizer” in the Remotion prompt showcase',
    url: 'https://www.remotion.dev/prompts',
  },
};
