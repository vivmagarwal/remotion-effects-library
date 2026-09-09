import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'split-flap-board',
  name: 'Split-Flap Board',
  category: 'text',
  tagline: 'An airport departure board clatters through the alphabet to its words.',
  description:
    'Every character is a tile that flips through an ordered alphabet until it reaches its target letter, then locks and turns amber. Because the alphabet is ordered, a tile\'s flip count is simply its target\'s index — so tiles landing on late letters keep clattering after their neighbours have stopped, which is exactly how a real board behaves. A vertical squash on `scale: 1 Y` during each flip plus a hairline gradient across the tile centre sell the physical flap.',
  tags: ['text', 'split flap', 'departure board', 'retro', 'flip', 'mechanical', 'airport'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 150,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 40,
  concepts: ['index-driven state', 'per-tile stagger', 'scale squash', 'stepped animation'],
};
