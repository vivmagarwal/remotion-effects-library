import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'shader-blob',
  name: 'Shader Blob',
  category: 'three-d',
  tagline: 'A liquid-metal sphere breathing under a custom GLSL material.',
  description:
    'The canonical safe way to animate 3D in Remotion: a custom ShaderMaterial whose time arrives as a uTime uniform computed from useCurrentFrame(), so the shader never reads a clock. This matters because drei MeshDistortMaterial and MeshWobbleMaterial both read state.clock.elapsedTime internally — which Remotion sets to performance.now() in milliseconds — and therefore cannot be used here at all, at any speed setting. The vertex shader pushes each point along its normal by a product of sines, which gives soft overlapping lobes and is identical on every GPU (a hash-based noise is not). The fragment shader is a fresnel rim term: surfaces facing away from the camera glow at the silhouette, which is the single thing that makes an untextured blob read as a solid object. An icosahedron is used rather than a sphere because its near-equilateral triangles have no pole to pinch when displaced.',
  tags: ['3d', 'three.js', 'shader', 'glsl', 'fresnel', 'displacement', 'blob'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 180,
  packages: ['remotion', '@remotion/three', 'three', '@react-three/fiber', '@remotion/google-fonts'],
  difficulty: 'advanced',
  checkFrame: 100,
  concepts: ['ShaderMaterial', 'uniforms as props', 'vertex displacement', 'fresnel', 'IcosahedronGeometry'],
};
