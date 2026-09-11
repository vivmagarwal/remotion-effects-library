import type {EffectMeta} from '../../../types';
import {VIZ_VARIANTS, VIZ_TEMPLATE_COUNT} from './variants.generated';

export const meta: EffectMeta = {
  id: 'viz-gallery', name: 'Viz Gallery', category: 'diagrams',
  tagline: 'Every edododraw visualization template, drawn on stroke by stroke.',
  description:
    `One diagram template drawn on stroke by stroke — and the same file ships as all ${VIZ_TEMPLATE_COUNT} of edododraw's usable templates, one variant each, generated from the package's own demo catalogue so a template added upstream appears here on the next version bump. One is left out: tug-of-war, whose figures' hands do not reach the rope that is the whole point of it. The frame-driven contract is the whole lesson: compileEdd is pure and synchronous so it runs once in a useMemo; render() touches the DOM so it runs once in a useLayoutEffect; and per frame nothing happens but a handful of style writes on elements measured at mount. The draw is by data ITEM in the order the template emitted it, which is the detail that makes it read as drawing: edododraw renders by z-layer, so a sweep in document order draws the whole skeleton empty and pops every word in at the end, title last. Gathering each item's elements through their data-viz-item tags lets a label arrive with its own box, and the title draws first. Each outline draws at full strength with its fill fading in behind it; labels wait until their outline is 70% drawn; authored opacity (a heatmap cell's intensity, a radar series at 60%) is multiplied, never overwritten; and every stroke-only path is split per subpath, because a dash pattern restarts at each one and rough.js draws the four sides of a box as four. Every path is rewritten every frame including the finished ones, because skipping them leaves a stale dash the moment a frame is drawn out of order — which Remotion does routinely, and which only shows up in a parallel render. Dash lengths are measured in screen pixels (the element's CTM), because a non-scaling stroke dashes on screen: measured in user units, every circle closed halfway round on the finished frame. SvgRenderer runs with static: true, which strips the CSS transitions and the animated-arrow keyframes that would otherwise be captured mid-flight, and with nonScalingStroke, strokeScale from the theme's stroke weight and roughnessScale from the fitted camera's zoom, because rough.js perturbs geometry in world units so the fit itself magnifies the jitter along with everything else. The theme reaches the diagram through a style preset built from it: paperSeries, paper ink, the hand typeface, corners and roughness.`,
  tags: ['diagram', 'hand-drawn', 'draw-on', 'explainer', 'reference', 'stroke'],
  concepts: ['viz template catalogue', 'stroke-dashoffset draw', 'total function of frame', 'draw by data item', 'zoom-scaled roughness'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 130,
  packages: ['remotion', 'edododraw', '@remotion/google-fonts'],
  difficulty: 'advanced', checkFrame: 52, posterFrame: 108,
  ground: 'light', audience: ['educator', 'saas', 'developer'],
  driveMode: 'step',
  variants: VIZ_VARIANTS,
};
