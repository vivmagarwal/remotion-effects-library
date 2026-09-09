import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'infinite-tunnel',
  name: 'Infinite Tunnel',
  category: 'three-d',
  tagline: 'A camera hurtling through a twisting tube that loops with no seam.',
  description:
    'A closed CatmullRomCurve3 is swept into a TubeGeometry and rendered with side: THREE.BackSide, so only the inside faces draw and the camera can sit within the tube instead of being culled out of it. The camera is placed by sampling the same curve with getPointAt(t) and aimed at getPointAt(t + 0.006) — looking a little further along is what makes the tunnel bend toward you rather than slide sideways. Because the curve is closed, frame 0 and the final frame are the same place and the flight loops forever. The whole sense of speed comes from a single point light travelling with the camera: the wall lights up ahead and falls into black behind. Ring transforms are precomputed with a quaternion that maps +Z onto the curve tangent; only their brightness depends on the frame.',
  tags: ['3d', 'three.js', 'tunnel', 'camera', 'TubeGeometry', 'curve', 'loop', 'wormhole'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 180,
  packages: ['remotion', '@remotion/three', 'three', '@react-three/fiber', '@remotion/google-fonts'],
  difficulty: 'advanced',
  checkFrame: 90,
  concepts: ['CatmullRomCurve3', 'TubeGeometry', 'BackSide', 'camera on a curve', 'setFromUnitVectors'],
};
