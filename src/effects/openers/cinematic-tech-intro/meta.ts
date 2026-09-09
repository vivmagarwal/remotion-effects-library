import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'cinematic-tech-intro',
  name: 'Cinematic Tech Intro',
  category: 'openers',
  tagline: 'Light streaks collide at centre and leave a wordmark in the flash.',
  description:
    'Fourteen light streaks race in from alternating sides on seeded, slightly different speeds, meet at the centre around frame 33, and a two-frame white flash hands off to the wordmark. Two details carry it: the title\'s letter-spacing opens from 0.02em to 0.22em over two seconds as it settles, which is what reads as expensive rather than merely animated; and letterbox bars grow in over the first 0.8s, which costs nothing and instantly says "cinematic".',
  tags: ['opener', 'intro', 'cinematic', 'light streaks', 'flash', 'logo', 'title', 'tech'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 150,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 40,
  concepts: ['seeded variation', 'impact flash', 'letter-spacing animation', 'letterboxing'],
  credit: {
    label: 'Idea from “Cinematic Tech Intro” in the Remotion prompt showcase',
    url: 'https://www.remotion.dev/prompts',
  },
};
