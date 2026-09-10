import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'three-rotating-logo', name: 'Three.js Rotating Logo', category: 'three-d',
  tagline: 'A metallic torus knot spinning under three lights, driven by the frame.',
  description:
    'React Three Fiber inside Remotion, obeying the one rule that governs all 3D here: nothing may animate itself. useFrame() from @react-three/fiber is forbidden — it advances on the browser clock, and Remotion renders frames out of order, so it flickers. Every rotation, position and scale is computed from useCurrentFrame(). Three lights (a key, a coloured rim, and a magenta point light) are what make the metal read as metal; a single light gives you a flat grey donut. This is the smallest honest three.js entry in the library and the right one to read first: strip the lighting rig and everything left is the frame-to-transform wiring every other 3D effect here repeats.',
  tags: ['3d', 'logo', 'loop', 'title'],
  concepts: ['ThreeCanvas', 'three-point lighting', 'seamless loop'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 180,
  packages: ['remotion', '@remotion/three', 'three', '@react-three/fiber', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 110,
  ground: 'dark', audience: ['saas', 'agency'], driveMode: 'pure',
};
