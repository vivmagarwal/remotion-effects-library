import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'force-network',
  name: 'Force Network',
  category: 'data',
  tagline: 'A graph settling out of its starting spiral into a readable web.',
  description:
    'd3-force is the one D3 layout that is stateful: it advances a physics integrator on its own timer, so it cannot simply be called per frame. The fix is the general recipe for any simulation in Remotion — run it ONCE inside a useMemo, record a snapshot of node positions after every tick, and index that array by the frame. What you get is the real settling motion rather than an approximation of it, and it is fully deterministic: d3-force seeds its starting positions with a phyllotaxis spiral and its jiggle with an internal LCG, never Math.random(). Two details matter in practice: call .stop() immediately, because forceSimulation() starts a timer the moment it is constructed, and remember that the link force replaces your string ids with node objects on the first tick.',
  tags: ['data', 'chart', 'd3', 'force', 'network', 'graph', 'simulation', 'deterministic'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 180,
  packages: ['remotion', 'd3-force', '@remotion/google-fonts'],
  difficulty: 'advanced',
  checkFrame: 46,
  posterFrame: 132,
  concepts: ['d3-force', 'pre-ticked snapshots', 'forceLink', 'forceManyBody', 'determinism'],
};
