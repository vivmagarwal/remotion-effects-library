import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'css-card-flip',
  name: 'CSS Card Flip',
  category: 'three-d',
  tagline: 'A two-sided card flipping in real 3D — three CSS properties, no library.',
  description:
    'A card rotating on its Y axis to reveal a second face. Three properties do all the work and each is load-bearing: perspective on the PARENT establishes the vanishing point, transformStyle: preserve-3d on the rotating element stops the browser flattening its children into the parent plane, and backfaceVisibility: hidden on each face hides the mirrored side. Drop any one and the card squashes horizontally instead of turning. The back face is pre-rotated 180° so it faces away at rest.',
  tags: ['3d', 'css', 'flip', 'card', 'perspective', 'reveal', 'backface', 'transform'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 165,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'starter',
  checkFrame: 30,
  concepts: ['CSS perspective', 'preserve-3d', 'backface-visibility', 'multi-keyframe rotation'],
};
