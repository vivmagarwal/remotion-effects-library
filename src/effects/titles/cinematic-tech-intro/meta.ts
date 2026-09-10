import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'cinematic-tech-intro', name: 'Cinematic Tech Intro', category: 'titles',
  tagline: 'Light streaks collide at centre and leave a wordmark in the flash.',
  description:
    'Fourteen light streaks race in from alternating sides on seeded, slightly different speeds, meet at the centre around frame 33, and a two-frame white flash hands off to the wordmark. Two details carry it: the title\'s letter-spacing opens from 0.02em to 0.22em over two seconds as it settles, which is what reads as expensive rather than merely animated; and letterbox bars grow in over the first 0.8s, which costs nothing and instantly says "cinematic". The streaks overshoot past the centre rather than stopping on it, so the collision is something that happened rather than something that is being posed — and the flash lands on the frame they cross, not after it.',
  tags: ['title', 'logo', 'cinematic', 'impact'],
  concepts: ['impact stacking', 'random(seed)', 'letter-spacing animation'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 150,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 40,
  ground: 'dark', audience: ['youtuber', 'agency'],
  credit: {
    label: 'Idea from “Cinematic Tech Intro” in the Remotion prompt showcase',
    url: 'https://www.remotion.dev/prompts',
  },
};
