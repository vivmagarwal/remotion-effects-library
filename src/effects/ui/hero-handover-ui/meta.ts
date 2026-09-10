import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'hero-handover-ui', name: 'Hero Handover UI', category: 'ui',
  tagline: 'A hero line hands the frame over to the answer it just typed.',
  description:
    'The Gemini landing state typing a prompt and handing over to a streamed answer. The transition is the interesting part: one handover value from 0 to 1 fades and lifts the hero out while it fades and raises the answer in, so the two states can never overlap or leave a gap however the timing is retimed. The gradient-filled four-point sparkle is a single concave SVG path, and the composer swaps its mic for a blue send button the moment there is a draft. The handover is the whole entry, which is why it is not named after the product it is drawn as: one value from 0 to 1 fades and lifts the hero out while it fades and raises the answer in, so the two states can never overlap or leave a gap however the shot is retimed. For a full multi-turn conversation use ChatGPT Full UI instead.',
  tags: ['ai', 'chat', 'browser', 'mockup', 'gradient'],
  concepts: ['single driver value', 'derived schedule', 'programmable in/out'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 340,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 70, posterFrame: 250,
  ground: 'light', audience: ['saas', 'developer'],
};
