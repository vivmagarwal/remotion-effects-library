import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'galaxy-particles',
  name: 'Galaxy Particles',
  category: 'three-d',
  tagline: '30,000 seeded points spiralling from a hot core to a cold rim.',
  description:
    'A spiral galaxy built as a single THREE.Points cloud. Every star is placed once in a useMemo from random(seed) — never Math.random(), because Remotion renders frames across parallel browser tabs and an unseeded draw produces a different galaxy on every frame. Three details do the visual work: the radius is raised to a power above 1 so stars pile into a bright core, the per-star scatter is cubed so it clusters tight against the arm rather than blurring it away, and the material uses AdditiveBlending with depthWrite off so overlapping stars sum toward white instead of punching holes in each other. Only the group rotation depends on the frame.',
  tags: ['3d', 'three.js', 'particles', 'galaxy', 'points', 'additive blending', 'seeded random'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 180,
  packages: ['remotion', '@remotion/three', 'three', '@react-three/fiber', '@remotion/google-fonts'],
  difficulty: 'advanced',
  checkFrame: 100,
  concepts: ['BufferGeometry', 'vertexColors', 'AdditiveBlending', 'random(seed)', 'useMemo'],
};
