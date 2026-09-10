import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'music-duck', name: 'Music Duck', category: 'sound',
  tagline: 'A bed getting out of the way of a voice, driven by the transcript.',
  description:
    'Working from word timings instead of from a sidechain compressor is the whole trick. A compressor reacts to what it has already heard, so it is always late by its own attack time, and it cannot tell a breath from a word or a cough from a sentence. Word timings are exact, they come free with any ASR, and they are known in ADVANCE — which is the one thing a real-time compressor can never have. Four numbers, each a specific mistake if you get it wrong. Look-ahead 150ms: the duck starts BEFORE the first word, because starting it on the word puts the first syllable on top of full-level music. Release 450ms, longer than the attack: a fast release pumps, surging into every gap between sentences. Hold 800ms: gaps shorter than that never un-duck at all, and without a hold the bed rises into every comma, which is the loudest possible signal that a mix was automated. And the interpolation happens in dB rather than in amplitude, because loudness is logarithmic and a linear ramp from 1.0 to 0.2 spends most of its travel in the first third and then crawls — heard as a lurch followed by a hang. Ramp 0 to −14 dB linearly and convert once at the end with 10 ** (dB / 20). All of it is a pure function of the transcript, so the envelope is computed once in a useMemo and volume is a closure over it; volume accepts (frame) => number, and that frame is the one inside the media\'s own sequence. The music waveform is drawn scaled BY the envelope, so the picture is the mix rather than a diagram of it.',
  tags: ['audio', 'music', 'ducking', 'waveform', 'transcript', 'interview'],
  concepts: ['look-ahead duck', 'dB-domain interpolation', 'useAudioData', 'null-while-loading'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 360,
  packages: ['remotion', '@remotion/media', '@remotion/media-utils', '@remotion/google-fonts'],
  // 160 sits in the 3.36s pause: the envelope has climbed back to 0 dB and the
  // music lane is drawn at full height, which is the one frame that shows the
  // duck releasing rather than just being down.
  difficulty: 'advanced', checkFrame: 60, posterFrame: 160,
  requires: ['audio', 'transcript'], ground: 'dark', audience: ['youtuber', 'educator', 'agency'],
};
