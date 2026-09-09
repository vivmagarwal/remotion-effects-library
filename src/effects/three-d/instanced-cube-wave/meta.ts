import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'instanced-cube-wave',
  name: 'Instanced Cube Wave',
  category: 'three-d',
  tagline: '4,096 boxes rising in a radial wave — one draw call, not 4,096.',
  description:
    'A field of cubes animated through THREE.InstancedMesh, which shares one geometry and one material across every copy and reads each cube position out of a matrix buffer. Heights and colours are written in a useLayoutEffect keyed on the frame, not a useFrame — useFrame advances on the browser clock, which Remotion overwrites with performance.now(), so anything reading it desynchronises from the timeline. Two gotchas are load-bearing: instanceMatrix.needsUpdate and instanceColor.needsUpdate must be set or the buffers never reach the GPU and the field is frozen, and the scratch Object3D and Color must be allocated once outside the loop or naive instancing ends up slower than plain meshes.',
  tags: ['3d', 'three.js', 'instancing', 'instancedMesh', 'wave', 'grid', 'performance'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 180,
  packages: ['remotion', '@remotion/three', 'three', '@react-three/fiber', '@remotion/google-fonts'],
  difficulty: 'advanced',
  checkFrame: 96,
  concepts: ['InstancedMesh', 'setMatrixAt', 'setColorAt', 'useLayoutEffect', 'useThree camera'],
};
