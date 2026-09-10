import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'aurora-mesh', name: 'Aurora Mesh', category: 'backgrounds',
  tagline: 'Five colour blobs drift on independent orbits into one soft field.',
  description:
    'The "expensive SaaS landing page" background, done deterministically. Five radial-gradient blobs each orbit their own centre on a different frequency and phase, with cos for x and a slower sin for y so the path is an ellipse rather than a circle. Heavy blur plus mixBlendMode: screen is what fuses them into a single mass instead of five visible circles; a vignette hides the blur\'s edges and an inline SVG feTurbulence grain at 16% overlay keeps large flat areas from banding. The frequencies are deliberately not integer multiples of one another, so the five orbits never come back into phase and the field has no visible period even over a five-hundred-frame loop.',
  tags: ['background', 'ambient', 'gradient', 'loop', 'blur'],
  concepts: ['trig orbits', 'mixBlendMode', 'seamless loop', 'SVG filter primitives'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 300,
  packages: ['remotion'],
  difficulty: 'starter', checkFrame: 150,
  ground: 'dark', audience: ['saas', 'agency'],
};
