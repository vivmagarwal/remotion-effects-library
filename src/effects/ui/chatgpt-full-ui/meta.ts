import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'chatgpt-full-ui', name: 'ChatGPT Full UI', category: 'ui',
  tagline: 'The whole window running a real conversation: type, send, reply, repeat.',
  description:
    'Browser chrome, icon rail, thread and composer, playing a full multi-turn loop — a message types into the composer, the send button goes black, the bubble springs out of the composer\'s corner into the thread, a breathing dot thinks, the reply types itself out, and the next turn begins. The whole timeline is derived from the script: each turn\'s duration comes from its own character count, so editing the text retimes the shot instead of desynchronising it. The thread is bottom-anchored so it grows upward like a real scroll. Set composerOnly to drop the chrome, the rail and the thread and keep just the prompt box, centred on a plain ground — the same typing, the same camera push tied to typing progress, the same send press, held after the send instead of clearing into a thread that is not there. That is the shot for "someone is writing a prompt"; the default is the shot for "someone is having a conversation".',
  tags: ['ai', 'chat', 'browser', 'mockup', 'typing'],
  concepts: ['derived schedule', 'character budget typing', 'programmable in/out', 'device chrome'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 520,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'advanced', checkFrame: 60, posterFrame: 330,
  ground: 'light', audience: ['saas', 'developer', 'educator'],
};
