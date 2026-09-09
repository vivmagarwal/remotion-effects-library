import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'chat-conversation',
  name: 'Chat Conversation',
  category: 'ui',
  tagline: 'A message thread that types itself, dots and all.',
  description:
    'An iMessage-style thread where each message springs in from the corner it belongs to. The typing indicator is what makes it feel real rather than pasted: an incoming message is preceded by three dots bouncing on one phase-shifted sine, and the same bubble then swaps its content in place, so the reply appears to be composed. transformOrigin set to the bubble\'s own corner means it grows out of the sender\'s side instead of inflating from its centre — a one-line detail that carries most of the credibility.',
  tags: ['ui', 'chat', 'imessage', 'conversation', 'typing', 'social', 'sms', 'dialogue'],
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 200,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 130,
  concepts: ['typing indicator', 'transformOrigin', 'phase-shifted sine', 'conditional mount'],
};
