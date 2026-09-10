import type {EffectMeta} from '../../../types';
import {VIZ_VARIANTS, VIZ_TEMPLATE_COUNT} from './variants.generated';

export const meta: EffectMeta = {
  id: 'viz-gallery', name: 'Viz Gallery', category: 'diagrams',
  tagline: 'Every edododraw visualization template, drawn on stroke by stroke.',
  description:
    `One diagram template drawn on stroke by stroke — and the same file ships as all ${VIZ_TEMPLATE_COUNT} of edododraw's usable templates, one variant each, generated from the package's own demo catalogue so a template added upstream appears here on the next version bump. Four are excluded because they draw edododraw's character figures, which are broken. The frame-driven contract is the whole lesson: compileEdd is pure and synchronous so it runs once in a useMemo; render() touches the DOM so it runs once in a useLayoutEffect; and per frame nothing happens but a handful of style writes on elements measured at mount. The measurement is per GROUP rather than per path, which is the detail that makes it read as drawing rather than as typing: a filled shape's fill polygon carries no stroke, so dashing the outline alone leaves every box on screen from frame 0 and only the labels reveal. Each group fades over the first 35 % of its own share and its label waits until 70 %. Every path is rewritten every frame including the finished ones, because skipping them leaves a stale dash the moment a frame is drawn out of order — which Remotion does routinely, and which only shows up in a parallel render. SvgRenderer runs with static: true, which strips the CSS transitions and the animated-arrow keyframes that would otherwise be captured mid-flight, and with nonScalingStroke, because rough.js perturbs geometry in world units so a camera push magnifies the jitter along with everything else.`,
  tags: ['diagram', 'hand-drawn', 'draw-on', 'explainer', 'reference', 'stroke'],
  concepts: ['viz template catalogue', 'stroke-dashoffset draw', 'total function of frame', 'octave-quantised roughness'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 130,
  packages: ['remotion', 'edododraw', '@remotion/google-fonts'],
  difficulty: 'advanced', checkFrame: 52, posterFrame: 108,
  ground: 'light', audience: ['educator', 'saas', 'developer'],
  driveMode: 'step',
  variants: VIZ_VARIANTS,
};
