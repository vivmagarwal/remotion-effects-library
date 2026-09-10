import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'logo-path-draw', name: 'Logo Path Draw', category: 'diagrams',
  tagline: 'A mark that draws itself stroke by stroke, then fills.',
  description:
    'Self-drawing SVG done correctly. The dash offset trick only works if strokeDasharray equals the path\'s own length — hardcode a number and short paths finish early while long ones never finish at all. evolvePath(progress, d) from @remotion/paths measures the path and returns both strokeDasharray and strokeDashoffset from one call, so the two values cannot drift apart. Each stroke carries its own start frame and duration rather than sharing one global timeline, because a long curve and a short tick given the same duration make the pen appear to change speed. The fill is the same paths drawn again on top and faded in, which turns an outline into a solid mark without needing a second geometry.',
  tags: ['logo', 'svg', 'draw-on', 'stroke'],
  concepts: ['evolvePath', 'stroke/fill lag', 'staggered entrance'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 150,
  packages: ['remotion', '@remotion/paths', '@remotion/google-fonts'],
  difficulty: 'intermediate', checkFrame: 46, posterFrame: 104,
  ground: 'dark', audience: ['agency', 'saas'],
};
