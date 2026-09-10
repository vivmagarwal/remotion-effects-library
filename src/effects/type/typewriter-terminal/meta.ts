import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'typewriter-terminal', name: 'Typewriter Terminal', category: 'type',
  tagline: 'Commands type themselves into a macOS terminal, cursor blinking.',
  description:
    'A window-chrome terminal in which several lines type out in sequence, then a block cursor blinks at the end. Both behaviours are derived from the frame: character count is floor(frame / fps * charsPerSecond) spent across the lines in order, and the blink is floor(frame / blinkFrames) % 2. That is the whole point — a setInterval blink looks fine in the browser and freezes or strobes at random in a render. The character budget is spent across the lines in order, with four characters’ worth of pause charged between them, so a multi-line block types at one steady rate rather than needing a start frame per line. That is the whole point: a setInterval blink looks fine in the browser and freezes or strobes at random in a render, because Remotion renders frames out of order and across parallel tabs.',
  tags: ['terminal', 'code', 'typing', 'text'],
  concepts: ['character budget typing', 'frame-derived state', 'device chrome'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 180,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'starter', checkFrame: 96,
  ground: 'dark', audience: ['developer', 'educator'],
};
