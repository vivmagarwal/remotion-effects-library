import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'subtitle-band', name: 'Subtitle Band', category: 'captions',
  tagline: 'Broadcast subtitles where the spoken words fill in progressively.',
  description:
    'A lower-third caption band in which the line is drawn twice — dim underneath, bright on top clipped to a moving width. Because both layers are the same string at the same metrics, the wipe follows the real glyph shapes instead of approximating them with per-word colour switching. Progress is computed from word boundaries plus the fraction through the active word, so the fill pauses between words the way a real read does rather than sliding at a constant rate. Which line is current comes from a reduce over the cue list rather than findLastIndex(), which needs lib: ES2023 in tsconfig and will fail a copy-paste into a default project. It sits over real footage by default: a subtitle judged on black is judged against nothing, because the opacity of the band is the only thing between the words and whatever the shot does, and on black that decision costs nothing. Set src to null, or transparent, to render the band as an alpha overlay over your own edit.',
  tags: ['captions', 'broadcast', 'overlay', 'text', 'footage'],
  concepts: ['word-level timing', 'overflow clipping', 'text stroke + paintOrder'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 180,
  packages: ['remotion', '@remotion/media', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 62,
  // 150 is mid-wipe on the second line, where the bright fill has crossed about
  // two thirds of the words — the one frame that shows the wipe is per-glyph.
  posterFrame: 150,
  requires: ['transcript', 'video'], ground: 'dark', audience: ['youtuber', 'educator', 'agency'],
};
