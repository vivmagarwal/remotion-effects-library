import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'shape-morph', name: 'Shape Morph', category: 'diagrams',
  tagline: 'One silhouette becoming another, vertex by vertex.',
  description:
    'interpolatePath(progress, a, b) from @remotion/paths blends two path strings instruction by instruction. It is more tolerant than people expect — it pads a shorter path and promotes an L to a C to match a curve rather than throwing — but tolerance is not the same as a good morph: the result only looks deliberate when both shapes carry the same number of points in the same winding order. So all four shapes here are generated as 12-gons that start at the top and wind clockwise, which makes every vertex correspond to exactly one vertex in the next shape. The vertices are drawn as dots to make that correspondence visible, and each shape is held before it morphs so it is legible as itself first.',
  tags: ['morph', 'svg', 'diagram', 'explainer'],
  concepts: ['interpolatePath', 'matched vertex counts', 'progress-gated reveal'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 180,
  packages: ['remotion', '@remotion/paths', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 34,
  ground: 'both', audience: ['educator', 'developer'],
};
