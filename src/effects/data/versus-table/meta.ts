import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'versus-table',
  name: 'Versus Table',
  category: 'data',
  tagline: 'Two columns arrive from opposite edges, interleaved row by row.',
  description:
    'The comparison slide, with one scheduling decision that changes how it reads: rows are ordered i * 2 + (isLeft ? 0 : 1), so left row 1, right row 1, left row 2 arrive in that sequence and the eye is pulled across each pair. Stagger the columns independently and the viewer reads all the way down one side before the other exists, which is the opposite of what a comparison is for. The losing column\'s rows land already struck through, so the verdict is delivered by the arrival rather than after it.',
  tags: ['data', 'comparison', 'versus', 'table', 'pros cons', 'explainer', 'slide', 'debate'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 180,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'starter',
  checkFrame: 62,
  posterFrame: 130,
  concepts: ['interleaved stagger', 'directional entry', 'fixed slots', 'verdict on arrival'],
};
