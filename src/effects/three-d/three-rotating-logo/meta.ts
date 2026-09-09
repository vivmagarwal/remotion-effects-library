import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'three-rotating-logo',
  name: 'Three.js Rotating Logo',
  category: 'three-d',
  tagline: 'A metallic torus knot spinning under three lights, driven by the frame.',
  description:
    'React Three Fiber inside Remotion, obeying the one rule that governs all 3D here: nothing may animate itself. useFrame() from @react-three/fiber is forbidden — it advances on the browser clock, and Remotion renders frames out of order, so it flickers. Every rotation, position and scale is computed from useCurrentFrame(). Three lights (a key, a coloured rim, and a magenta point light) are what make the metal read as metal; a single light gives you a flat grey donut.',
  tags: ['3d', 'three.js', 'react-three-fiber', 'logo', 'metallic', 'torus knot', 'lighting'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 180,
  packages: ['remotion', '@remotion/three', 'three', '@react-three/fiber', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 110,
  concepts: ['ThreeCanvas', 'frame-driven 3D', 'three-point lighting', 'meshStandardMaterial'],
};
