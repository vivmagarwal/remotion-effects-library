import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'gemini-full-ui',
  name: 'Gemini Full UI',
  category: 'ui',
  tagline: 'Google Gemini: sparkle, hero line, pill composer — typed and answered.',
  description:
    'The Gemini landing state typing a prompt and handing over to a streamed answer. The transition is the interesting part: one handover value from 0 to 1 fades and lifts the hero out while it fades and raises the answer in, so the two states can never overlap or leave a gap however the timing is retimed. The gradient-filled four-point sparkle is a single concave SVG path, and the composer swaps its mic for a blue send button the moment there is a draft.',
  tags: ['ui', 'gemini', 'google', 'browser', 'typewriter', 'mockup', 'ai', 'assistant', 'demo'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 340,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'advanced',
  checkFrame: 70,
  posterFrame: 250,
  concepts: ['single handover value', 'gradient SVG mark', 'state-driven composer', 'programmable in/out'],
};
