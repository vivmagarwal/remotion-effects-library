import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'karaoke-band',
  name: 'Karaoke Band',
  category: 'captions',
  tagline: 'Broadcast subtitles where the spoken words fill in progressively.',
  description:
    'A lower-third caption band in which the line is drawn twice — dim underneath, bright on top clipped to a moving width. Because both layers are the same string at the same metrics, the wipe follows the real glyph shapes instead of approximating them with per-word colour switching. Progress is computed from word boundaries plus the fraction through the active word, so the fill pauses between words the way a real read does rather than sliding at a constant rate.',
  tags: ['captions', 'karaoke', 'subtitles', 'lower third', 'broadcast', 'lyrics', 'band'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 180,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 62,
  concepts: ['duplicate-layer wipe', 'word-boundary progress', 'overflow clipping', 'lower third'],
};
