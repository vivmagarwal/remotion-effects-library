import type {EffectMeta} from '../../../types';

/** poster: frame 196 — the whole thread is on screen; earlier frames show two bubbles in a tall empty frame. */
export const meta: EffectMeta = {
  id: 'imessage-thread', name: 'iMessage Thread', category: 'social',
  tagline: 'A message thread that types itself, dots and all.',
  description:
    'An iMessage-style thread where each message springs in from the corner it belongs to. The typing indicator is what makes it feel real rather than pasted: an incoming message is preceded by three dots bouncing on one phase-shifted sine, and the same bubble then swaps its content in place, so the reply appears to be composed. transformOrigin set to the bubble\'s own corner means it grows out of the sender\'s side instead of inflating from its centre — a one-line detail that carries most of the credibility. This is the replay: a finished conversation playing back, with no composer and nothing to type into. iMessage Live is the same thread with the composer loop on top, which is the harder shot and the longer one.',
  tags: ['chat', 'social', 'vertical', 'mockup', 'typing'],
  concepts: ['derived schedule', 'transformOrigin', 'phase-shifted sine'],
  width: 1080, height: 1920, fps: 30, durationInFrames: 200,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'starter', checkFrame: 130, posterFrame: 196,
  ground: 'dark', audience: ['youtuber', 'agency'],
};
