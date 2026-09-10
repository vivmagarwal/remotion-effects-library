import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'fft-bars', name: 'FFT Bars', category: 'sound',
  tagline: 'Real FFT bars reacting to the actual audio file, not a fake waveform.',
  description:
    'useAudioData() plus visualizeAudio() from @remotion/media-utils read the real waveform, so the bars track the actual track rather than a sine approximation. The detail that makes it look alive: visualizeAudio returns linear amplitudes and the ear is logarithmic, so raising each band to a power around 0.42 before drawing lifts the quiet detail — without it the bars sit near zero except on the loudest peaks. useAudioData returns null on the first render while the file loads, so a zero-filled fallback is required or the component crashes. Before the gamma there is a second correction that matters more: visualizeAudio returns bins spaced linearly from 0 Hz to Nyquist, so on real music everything audible sits in the bottom eighth of the range and one bar per bin gives a tall left edge decaying into a dead zone. Re-bucketing into octave-spaced bands — taking the peak inside each band, not the mean — is what makes every bar move independently.',
  tags: ['audio', 'waveform', 'music', 'chart'],
  concepts: ['visualizeAudio', 'useAudioData', 'gamma correction', 'null-while-loading'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 180,
  packages: ['remotion', '@remotion/media', '@remotion/media-utils', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 90,
  requires: ['audio'], ground: 'dark', audience: ['podcaster', 'youtuber'],
  credit: {
    label: 'Idea from “Audio Spectrum Visualizer” in the Remotion prompt showcase',
    url: 'https://www.remotion.dev/prompts',
  },
};
