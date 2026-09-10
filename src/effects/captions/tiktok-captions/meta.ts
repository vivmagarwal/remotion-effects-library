import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'tiktok-captions', name: 'TikTok Captions', category: 'captions',
  tagline: 'Karaoke captions from a real Deepgram response, over the clip it transcribed.',
  description:
    'Three-word pages with the currently-spoken word scaled and tinted, driven by an unmodified Deepgram nova-3 words[] array over the clip that response was transcribed from — so what you see is real sync rather than hand-tuned keyframes. Four decisions carry it. Paging by word count rather than by a time window guarantees a readable line no matter how fast the speaker goes; a fixed window gives one word during a pause and nine during a fast run. The active-word test is half-open (frame >= start && frame < end) — a closed interval makes two words active on the shared boundary frame and the caption flickers for exactly one frame. The outline is WebkitTextStroke at 15% of the font size with paintOrder: "stroke fill" rather than a soft shadow, because you cannot compute a contrast ratio against moving footage and a blurred shadow fails exactly when the shot gets busy. And the page clears 12 frames after the last word ends instead of sitting over the silence. Emphasis is authored as data (hits) rather than derived from word length or position — derived emphasis lands on "the". Times are seconds and are noisy floats, so they are only ever compared after Math.round(t * fps); set src to null to render as a transparent overlay.',
  tags: ['captions', 'social', 'vertical', 'overlay', 'spring', 'footage'],
  concepts: ['word-level timing', 'text stroke + paintOrder', 'half-open interval', 'safe area'],
  width: 1080, height: 1920, fps: 30, durationInFrames: 190,
  packages: ['remotion', '@remotion/media', '@remotion/google-fonts'],
  // 100 is inside "natural" (2.88-3.76 s), which is both the active word and an
  // authored hit — the one frame that shows all three colour states at once.
  difficulty: 'intermediate', checkFrame: 100, posterFrame: 100,
  requires: ['transcript', 'video'], ground: 'dark', audience: ['youtuber', 'agency'],
};
