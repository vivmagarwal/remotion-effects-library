import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'text-mask-reveal',
  name: 'Text Mask Reveal',
  category: 'text',
  tagline: 'A drifting colour field shows through the letterforms and nowhere else.',
  description:
    'Heavy display type acts as a window onto a moving scene: four radial-gradient blobs drift on independent sine phases behind the word, and background-clip: text throws away everything outside the glyphs. A dark flat layer is stacked underneath the blobs so the letters never go transparent where no blob happens to be. Swap the gradient stack for a <Video> behind a text-shaped mask and the same idea gives you footage-through-type.',
  tags: ['text', 'mask', 'clip', 'gradient', 'display type', 'poster', 'kinetic'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 150,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 60,
  concepts: ['background-clip: text', 'layered gradients', 'sine drift', 'letter-spacing animation'],
};
