import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'write-on-text', name: 'Write-On Text', category: 'diagrams',
  tagline: 'Manim\'s Write(): each glyph is outlined on, then its ink arrives.',
  description:
    'Two layers of the same SVG text at the same position — one stroked with an animated dash, one filled — staggered per character. The outline draws, the fill catches up a few frames later, and the outline fades as it does, so the finished line is clean ink rather than outlined ink. That small lag between stroke and fill is the entire illusion: without it you have a wipe, with it you have something being written. Both layers must share identical geometry or the fill lands outside the outline that drew it. The dash length only has to exceed each glyph’s outline — any excess simply sits off the end of the path — so one generous constant works for every character instead of a measurement per glyph.',
  tags: ['text', 'draw-on', 'stroke', 'svg', 'explainer'],
  concepts: ['stroke-dashoffset draw', 'stroke/fill lag', 'per-character stagger', 'Manim rate functions'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 180,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 46, posterFrame: 130,
  ground: 'both', audience: ['educator', 'developer'],
  credit: {
    label: 'Technique borrowed from Manim (3Blue1Brown)',
    url: 'https://github.com/3b1b/manim',
  },
};
