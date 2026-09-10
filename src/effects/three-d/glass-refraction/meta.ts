import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'glass-refraction', name: 'Glass Refraction', category: 'three-d',
  tagline: 'Thick glass bending the scene behind it and splitting it into colour.',
  description:
    'MeshPhysicalMaterial with transmission: 1 renders whatever is behind the object into a buffer and refracts through it. The consequence is the thing most people get wrong: glass against an empty background is invisible, because there is nothing there to bend — so this scene puts a field of unlit emissive bars behind the knot purely to give the refraction something to distort. dispersion offsets the R, G and B refractions slightly, which is what produces the prism fringing along the edges; ior sets how hard the bend is (window glass 1.5, sapphire 1.77, diamond 2.42). metalness must be 0, since metal does not transmit and any non-zero value quietly kills the whole effect.',
  tags: ['3d', 'shader', 'colour', 'loop'],
  concepts: ['ThreeCanvas', 'MeshPhysicalMaterial', 'three-point lighting'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 180,
  packages: ['remotion', '@remotion/three', 'three', '@react-three/fiber', '@remotion/google-fonts'],
  difficulty: 'advanced', checkFrame: 104,
  ground: 'dark', audience: ['agency', 'saas'], driveMode: 'pure',
};
