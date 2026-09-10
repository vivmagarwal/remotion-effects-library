import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'claude-full-ui', name: 'Claude Full UI', category: 'ui',
  tagline: 'Claude on warm paper: sunburst, serif greeting, typed and answered.',
  description:
    'Claude\'s interface in the same type-send-stream loop as the ChatGPT and Gemini entries, but on an entirely different palette — a cream ground with a single clay accent, where every other assistant UI is white and blue. The twelve-ray sunburst is one tapered rounded rect rotated twelve times around the centre, which keeps every arm identical, and it spins only while the answer is streaming, so the motion actually means something instead of decorating. This is the palette study of the three assistant UIs: take ChatGPT Full UI when you need the multi-turn machine, Hero Handover UI when you need the landing-to-answer swap, and this one when the warm-paper look is the point.',
  tags: ['ai', 'chat', 'browser', 'mockup', 'editorial'],
  concepts: ['derived schedule', 'single driver value', 'programmable in/out', 'device chrome'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 340,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'advanced', checkFrame: 70, posterFrame: 250,
  ground: 'light', audience: ['saas', 'developer'],
};
