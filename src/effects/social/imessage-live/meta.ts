import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'imessage-live', name: 'iMessage Live', category: 'social',
  tagline: 'You watch each message get typed, sent, and answered.',
  description:
    'The live variant of a message thread: instead of bubbles simply appearing, you watch each outgoing message typed into the composer, the send button light up, the bubble spring out of the composer corner into the thread, three dots appear, and the reply land — then the next message starts. Every frame number comes from one pass over the script, so editing a line retimes everything downstream. The thread is bottom-anchored with min-height 0 so it grows upward without pushing the composer off screen. Hide the composer and this is iMessage Thread — the split is deliberate: take the replay when the conversation is the subject, take this one when the act of sending is.',
  tags: ['chat', 'social', 'vertical', 'typing', 'overlay'],
  concepts: ['derived schedule', 'character budget typing', 'programmable in/out', 'phase-shifted sine'],
  width: 1080, height: 1920, fps: 30, durationInFrames: 440,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'advanced', checkFrame: 40, posterFrame: 300,
  ground: 'transparent', audience: ['youtuber', 'agency'],
};
