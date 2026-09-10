import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'gradient-text-sweep', name: 'Gradient Text Sweep', category: 'type',
  tagline: 'Colour travels through the letterforms on a looping gradient pass.',
  description:
    'A six-stop linear gradient is clipped to the glyphs with background-clip: text and slid horizontally so colour appears to move through the letters. The trick is backgroundSize: 300% 100% — the gradient is three times wider than the text, and that spare width is what the animation travels across. Interpolating backgroundPosition from 0% to 200% gives one seamless pass; repeating the first colour as the last stop makes it loop without a seam. background-clip: text clips a paint, which is why this can carry a gradient and cannot carry a video — for footage inside letterforms the mask has to be a real SVG clipPath, which is what Video In Text does.',
  tags: ['text', 'title', 'gradient', 'loop', 'colour'],
  concepts: ['background-clip: text', 'seamless loop', 'layered gradients'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 90,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'starter', checkFrame: 45,
  ground: 'both', audience: ['saas', 'agency'],
};
