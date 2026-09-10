import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'versus-table', name: 'Versus Table', category: 'charts',
  tagline: 'Two columns arrive from opposite edges, interleaved row by row.',
  description:
    'The comparison slide, with one scheduling decision that changes how it reads: rows are ordered i * 2 + (isLeft ? 0 : 1), so left row 1, right row 1, left row 2 arrive in that sequence and the eye is pulled across each pair. Stagger the columns independently and the viewer reads all the way down one side before the other exists, which is the opposite of what a comparison is for. The losing column\'s rows land already struck through, so the verdict is delivered by the arrival rather than after it. Each column arrives from its own edge, so direction of travel encodes which side a row belongs to before the reader has processed a word of it.',
  tags: ['comparison', 'table', 'explainer', 'stagger'],
  concepts: ['staggered entrance', 'fixed slots without reflow', 'progress-gated reveal'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 180,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'starter', checkFrame: 62, posterFrame: 130,
  ground: 'both', audience: ['educator', 'saas', 'youtuber'],
};
