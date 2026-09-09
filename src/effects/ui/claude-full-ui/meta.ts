import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'claude-full-ui',
  name: 'Claude Full UI',
  category: 'ui',
  tagline: 'Claude on warm paper: sunburst, serif greeting, typed and answered.',
  description:
    'Claude\'s interface in the same type-send-stream loop as the ChatGPT and Gemini entries, but on an entirely different palette — a cream ground with a single clay accent, where every other assistant UI is white and blue. The twelve-ray sunburst is one tapered rounded rect rotated twelve times around the centre, which keeps every arm identical, and it spins only while the answer is streaming, so the motion actually means something instead of decorating.',
  tags: ['ui', 'claude', 'anthropic', 'browser', 'typewriter', 'mockup', 'ai', 'assistant', 'demo'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 340,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'advanced',
  checkFrame: 70,
  posterFrame: 250,
  concepts: ['rotated-ray mark', 'single handover value', 'state-meaning motion', 'programmable in/out'],
};
