import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'hype-captions',
  name: 'Hype Captions',
  category: 'captions',
  tagline: 'Retention-style captions stamped over footage, one keyword blown up.',
  description:
    'Three-word pages stamped in on a spring over a slowly pushing plate, with one emphasis word per page enlarged and colour-flipped. The emphasis comes from a hit flag in the script rather than being guessed at runtime — pick it by word length or position and it lands on "the", which is exactly what makes auto-captioned videos feel machine-made. A seeded per-page tilt stops consecutive pages arriving at the same angle, and the outline is a hard WebkitTextStroke with paintOrder so it survives being laid over anything.',
  tags: ['captions', 'hype', 'hormozi', 'shorts', 'reels', 'tiktok', 'retention', 'burned-in'],
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 150,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 62,
  concepts: ['authored emphasis', 'spring stamp', 'seeded page tilt', 'stroke + paintOrder'],
};
