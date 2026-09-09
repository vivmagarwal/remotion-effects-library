import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'chatgpt-full-ui',
  name: 'ChatGPT Full UI',
  category: 'ui',
  tagline: 'The whole window running a real conversation: type, send, reply, repeat.',
  description:
    'Browser chrome, icon rail, thread and composer, playing a full multi-turn loop — a message types into the composer, the send button goes black, the bubble springs out of the composer\'s corner into the thread, a breathing dot thinks, the reply types itself out, and the next turn begins. The whole timeline is derived from the script: each turn\'s duration comes from its own character count, so editing the text retimes the shot instead of desynchronising it. The thread is bottom-anchored so it grows upward like a real scroll.',
  tags: ['ui', 'chatgpt', 'openai', 'browser', 'conversation', 'typewriter', 'mockup', 'ai', 'demo'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 520,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'advanced',
  checkFrame: 60,
  posterFrame: 330,
  concepts: ['derived schedule', 'multi-turn loop', 'bottom-anchored thread', 'programmable in/out'],
};
