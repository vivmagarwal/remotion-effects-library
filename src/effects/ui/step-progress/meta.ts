import type {EffectMeta} from '../../../types';
export const meta: EffectMeta = {
  id: 'step-progress', name: 'Step Progress', category: 'ui',
  tagline: 'A numbered process advancing along a rail like a playhead.',
  description:
    'A numbered process advancing along a rail. The one idea worth taking is that no step carries a boolean \'done\' flag — every piece of state is derived from a single continuous playhead in step space, where 0 is the first node and steps.length - 1 is the last. That is what lets the rail fill sit believably between two nodes instead of snapping, and it means the node highlight, the label opacity and the bar width can never disagree with each other. Each node lights when the playhead crosses it (with half a step of lead-in) and pops on a spring whose undershoot is clamped at 0, so the scale never dips below 1.',
  tags: ['ui', 'progress', 'steps', 'process'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 180,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 60,
  concepts: ['continuous playhead', 'derived node state', 'spring pop'],
};
