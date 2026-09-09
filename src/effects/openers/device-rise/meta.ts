import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'device-rise',
  name: 'Device Rise',
  category: 'openers',
  tagline: 'A phone rises out of the floor, tilts to face you, and wakes.',
  description:
    'The keynote move. One rise value from 0 to 1 drives the vertical travel, the tilt (26° → 4°, so the device turns toward you as it arrives) and the fade, which keeps the whole gesture coherent. The reflection is a real second copy of the device — flipped with scaleY(-1), blurred, faded to 24% and cut off with a linear-gradient mask — rising in lockstep. Faking it with a gradient rectangle is the usual shortcut and it is exactly what stops the device reading as an object standing on a surface.',
  tags: ['opener', 'device', 'phone', 'product', 'keynote', 'apple', '3d tilt', 'reflection'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 120,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 54,
  posterFrame: 70,
  concepts: ['single driver value', 'CSS perspective on parent', 'mirrored reflection', 'mask-image falloff'],
  credit: {
    label: 'Idea from “Apple-Style Device Rise Animation” in the Remotion prompt showcase',
    url: 'https://www.remotion.dev/prompts',
  },
};
