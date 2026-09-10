import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'dna-helix', name: 'DNA Helix', category: 'three-d',
  tagline: 'Two backbones and a ladder of base pairs, snapping in bottom to top.',
  description:
    'A double helix built from two swept tubes and forty rungs. The backbones come from subclassing THREE.Curve and implementing getPoint(t) — the cleanest way to get TubeGeometry to sweep any parametric path, and far simpler than assembling one from control points. Each rung is aimed with new THREE.Quaternion().setFromUnitVectors(new Vector3(0,1,0), direction), the general recipe for pointing a cylinder (whose axis is +Y) at an arbitrary vector; the same one line aligns rings, arrows, connectors or anything else axis-based. Every rung transform is precomputed in a useMemo because none of it depends on time; only the spring that pops each pair in does. The pairs are split into two coloured halves chosen by random(seed), so the ladder is deterministic across parallel render tabs.',
  tags: ['3d', 'spring', 'stagger', 'explainer'],
  concepts: ['ThreeCanvas', 'TubeGeometry', 'spring()', 'random(seed)'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 180,
  packages: ['remotion', '@remotion/three', 'three', '@react-three/fiber', '@remotion/google-fonts'],
  difficulty: 'advanced', checkFrame: 84,
  ground: 'dark', audience: ['educator', 'agency'], driveMode: 'pure',
};
