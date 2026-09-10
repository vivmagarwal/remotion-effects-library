import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'subtitle-band', name: 'Subtitle Band', category: 'captions',
  tagline: 'Broadcast subtitles where the spoken words fill in progressively.',
  description:
    'A lower-third caption band in which the line is drawn twice — dim underneath, bright on top clipped to a moving width. Because both layers are the same string at the same metrics, the wipe follows the real glyph shapes instead of approximating them with per-word colour switching. Progress is computed from word boundaries plus the fraction through the active word, so the fill pauses between words the way a real read does rather than sliding at a constant rate. Which line is current comes from a reduce over the cue list rather than findLastIndex(), which needs lib: ES2023 in tsconfig and will fail a copy-paste into a default project. Set transparent to render the band as an alpha overlay over a real edit.',
  tags: ['captions', 'broadcast', 'overlay', 'text'],
  concepts: ['word-level timing', 'overflow clipping', 'text stroke + paintOrder'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 180,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 62,
  requires: ['transcript'], ground: 'transparent', audience: ['youtuber', 'educator', 'agency'],
};
