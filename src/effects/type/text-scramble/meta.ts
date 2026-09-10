import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'text-scramble', name: 'Text Scramble', category: 'type',
  tagline: 'Letters churn through random glyphs and lock into place, left to right.',
  description:
    'Each character cycles through a pool of symbols and capitals before settling on its real glyph, staggered so the word resolves left to right. Scrambling characters are tinted green and slightly transparent, which reads as "still resolving". Two details make it work: every character sits in a fixed-width slot so glyph swaps do not reflow the line, and the glyph choice comes from Remotion\'s deterministic random(seed) rather than Math.random(), so the churn is identical on every render instead of boiling. Spaces never churn: a space cycling through glyphs reads as a stray letter and destroys the word shape the eye is using to anticipate the result. The slot width is sized to the typeface — 0.92em fits Space Grotesk 700’s widest caps — because a slot sized by eye lets M and W overflow into their neighbours.',
  tags: ['text', 'glitch', 'typing', 'stagger'],
  concepts: ['random(seed)', 'per-character stagger', 'fixed slots without reflow'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 105,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 24,
  ground: 'both', audience: ['developer', 'youtuber'],
};
