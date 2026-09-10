import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'text-mask-reveal', name: 'Text Mask Reveal', category: 'type',
  tagline: 'A drifting colour field shows through the letterforms and nowhere else.',
  description:
    'Heavy display type acts as a window onto a moving scene: four radial-gradient blobs drift on independent sine phases behind the word, and background-clip: text throws away everything outside the glyphs. A dark flat layer is stacked underneath the blobs so the letters never go transparent where no blob happens to be. Swap the gradient stack for a <Video> behind a text-shaped mask and the same idea gives you footage-through-type. The letters open apart very slightly over the shot — a few thousandths of an em — which is not readable as motion but stops a held title from looking like a still frame.',
  tags: ['text', 'title', 'mask', 'gradient', 'kinetic-type'],
  concepts: ['background-clip: text', 'layered gradients', 'letter-spacing animation'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 150,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 60,
  ground: 'light', audience: ['agency', 'saas'],
};
