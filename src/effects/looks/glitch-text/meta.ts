import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'glitch-text', name: 'Glitch Text', category: 'looks',
  tagline: 'RGB channels tear apart and slices displace, in short bursts.',
  description:
    'Three stacked copies of the word — cyan, magenta and white, the coloured ones in screen blend mode — sit in perfect register until a burst pulls them apart, while three clip-path slices of a fourth copy shift sideways. The restraint is what makes it work: bursts occupy only the first 7 frames of each 26-frame cycle, so the glitch reads as an interruption rather than permanent noise. Offsets come from random(seed) keyed on the frame, so they are violent but reproducible. Scanlines stay on between bursts, which is what ties the calm state to the violent one — remove them and the word looks like two unrelated pieces of design cutting back and forth.',
  tags: ['glitch', 'text', 'retro', 'colour'],
  concepts: ['mixBlendMode', 'clip-path reveal', 'random(seed)'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 120,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 28,
  ground: 'dark', audience: ['youtuber', 'developer'],
};
