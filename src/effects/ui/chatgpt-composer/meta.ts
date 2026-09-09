import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'chatgpt-composer',
  name: 'ChatGPT Composer',
  category: 'ui',
  tagline: 'The prompt box, typing itself out, growing and pushing in as it fills.',
  description:
    'A pixel-faithful ChatGPT prompt box that types itself, complete with blinking caret, red wavy spell-check underlines, a send button that goes from disabled grey to black the moment there is text, and a press on send. The box has auto height inside a centred column, so it grows in place as lines wrap rather than pushing the frame around, and the camera push is tied to typing progress rather than to the frame — so retiming the typing retimes the push with it. Entrance and exit are separate frame counts, so the shot drops into a longer edit.',
  tags: ['ui', 'chatgpt', 'openai', 'typewriter', 'prompt', 'ai', 'mockup', 'typing', 'composer'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 330,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 120,
  posterFrame: 250,
  concepts: ['character budget typing', 'auto-height growth', 'progress-linked camera push', 'programmable in/out'],
};
