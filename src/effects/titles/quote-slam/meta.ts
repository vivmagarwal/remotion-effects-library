import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'quote-slam', name: 'Quote Slam', category: 'titles',
  tagline: 'A pull quote that lands rather than fades.',
  description:
    'Three things have to land on the same frame or a pull quote reads as an ordinary fade-in: the line snaps in on a spring that overshoots, the whole frame kicks a few pixels the other way, and a flash blooms behind it. The kick is a decaying impulse — Math.exp(-hit / 3.5) * Math.sin(hit * 0.9) — summed across every line rather than taken from the latest, so overlapping landings compound instead of cancelling; it is applied to a wrapper holding the quote AND its background, because moving only the text reads as a wobble rather than a hit. The flash sits outside that wrapper so it does not move with it. One typographic detail matters as much as the motion: line-height must be 1.12, not 1, or a serif at 104px clips its own descenders against the line below.',
  tags: ['quote', 'impact', 'editorial', 'spring', 'text'],
  concepts: ['spring overshoot', 'camera kick', 'decaying impulse'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 150,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 38, posterFrame: 96,
  ground: 'both', audience: ['youtuber', 'podcaster', 'educator'],
};
