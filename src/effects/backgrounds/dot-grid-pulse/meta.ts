import type {EffectMeta} from '../../../types';

/** poster: frame 90 — the travelling wave reads as an arch here; at 40 it is a shapeless blob. */
export const meta: EffectMeta = {
  id: 'dot-grid-pulse', name: 'Dot Grid Pulse', category: 'backgrounds',
  tagline: 'A wave travels outward through a field of a thousand dots.',
  description:
    'A 42×24 dot grid in which each dot\'s scale, colour and opacity are a function of its distance to a drifting origin: sin(t*freq*2PI - dist/3.2) gives a ring that travels outward, and a linear decay with distance keeps it local. The point is that the wave is a property of the geometry, not a per-dot animation — one formula scales to a thousand dots with no extra bookkeeping, and the origin itself drifts on a slow orbit so successive passes arrive from different angles. Nothing is stored between frames, which is what makes a thousand dots cheap: there is no per-dot object to update, only a distance and a phase evaluated fresh each time the frame changes.',
  tags: ['background', 'ambient', 'grid', 'loop'],
  concepts: ['procedural grid', 'travelling wave', 'closed-form motion'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 240,
  packages: ['remotion'],
  difficulty: 'intermediate', checkFrame: 96, // 150, not 90: the pulse is a travelling ring and at 90 it has barely left the
  // origin, so the card was a field of near-black dots.
 posterFrame: 150,
  ground: 'both', audience: ['saas', 'developer'],
};
