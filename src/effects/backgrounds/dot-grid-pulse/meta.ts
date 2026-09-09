import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'dot-grid-pulse',
  name: 'Dot Grid Pulse',
  category: 'backgrounds',
  tagline: 'A wave travels outward through a field of a thousand dots.',
  description:
    'A 42×24 dot grid in which each dot\'s scale, colour and opacity are a function of its distance to a drifting origin: sin(t*freq*2PI - dist/3.2) gives a ring that travels outward, and a linear decay with distance keeps it local. The point is that the wave is a property of the geometry, not a per-dot animation — one formula scales to a thousand dots with no extra bookkeeping, and the origin itself drifts on a slow orbit so successive passes arrive from different angles.',
  tags: ['background', 'dots', 'grid', 'wave', 'ambient', 'tech', 'ripple', 'loop'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 240,
  packages: ['remotion'],
  difficulty: 'intermediate',
  checkFrame: 96,
  concepts: ['distance fields', 'travelling wave', 'procedural grid', 'radial decay'],
};
