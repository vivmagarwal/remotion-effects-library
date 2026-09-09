import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'code-editor-typing',
  name: 'Code Editor Typing',
  category: 'ui',
  tagline: 'Code types itself into an editor, highlighted as it lands.',
  description:
    'A dark editor with window chrome, line numbers and a caret, typing a snippet out. The highlighter runs over the visible slice on every frame rather than over the finished source, so a half-typed keyword stays plain until it is complete — exactly what a real editor does, and the detail that separates this from a coloured string being revealed. Every line\'s row is reserved from frame 0 via minHeight, so the block never grows and the editor stays optically centred while it fills.',
  tags: ['ui', 'code', 'editor', 'typewriter', 'syntax highlighting', 'developer', 'tutorial', 'ide'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 300,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 90,
  posterFrame: 240,
  concepts: ['incremental highlighting', 'reserved layout height', 'tokenizer ordering', 'caret tracking'],
};
