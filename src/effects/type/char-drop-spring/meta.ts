import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'char-drop-spring', name: 'Character Drop (Spring)', category: 'type',
  tagline: 'Letters fall in one by one, overshoot, and settle.',
  description:
    'Each letter of a word gets its own spring(), delayed a few frames from the last, and drops in from above with a slight rotation that unwinds as it lands. The detail that matters: the spring value is multiplied by the travel distance rather than fed into interpolate(). interpolate() clamps at 1, which throws away the overshoot — and the overshoot past the resting position, then back, is the entire reason to reach for a spring instead of an ease. Damping is the one knob worth understanding here: at 200 the spring is effectively an ease and the whole point is gone, while below about 8 the letters visibly ring for half a second after they should have settled.',
  tags: ['text', 'title', 'spring', 'stagger', 'kinetic-type'],
  concepts: ['spring()', 'spring overshoot', 'per-character stagger'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 90,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'starter', checkFrame: 20, posterFrame: 34,
  ground: 'both', audience: ['youtuber', 'educator'],
};
