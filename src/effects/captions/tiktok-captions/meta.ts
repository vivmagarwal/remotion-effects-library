import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'tiktok-captions',
  name: 'TikTok Captions',
  category: 'captions',
  tagline: 'Word-level karaoke captions that pop on the word being spoken.',
  description:
    'Short pages of three words with the currently-spoken word scaled up and tinted, taking word timings in exactly the shape @remotion/captions produces. Two decisions carry it: paging by word count rather than by time guarantees a readable line no matter how fast the speaker goes, and the outline is WebkitTextStroke with paintOrder: "stroke fill" rather than a soft text-shadow — a hard stroke survives being laid over any footage, which a shadow does not. Set transparent to render as an alpha overlay.',
  tags: ['captions', 'subtitles', 'tiktok', 'karaoke', 'social', 'shorts', 'reels', 'word timing'],
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 135,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 81,
  concepts: ['word-level timing', 'paging by count', 'text stroke + paintOrder', 'per-word springs'],
};
