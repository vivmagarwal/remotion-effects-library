import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'subscribe-button',
  name: 'Subscribe Button',
  category: 'ui',
  tagline: 'A cursor flies in, presses subscribe, and the button confirms with a burst.',
  description:
    'A channel card with a cursor that arcs in and lands exactly on the click frame. What sells the press is simultaneity: on that single frame the button squashes to 0.93, a white ripple starts expanding inside the button\'s overflow:hidden clip, the label swaps to Subscribed, and twelve confetti chips radiate outward. Stagger any of those and it stops reading as one causal event. Set transparent to leave the background clear for rendering a WebM or ProRes overlay to composite over real footage.',
  tags: ['ui', 'subscribe', 'youtube', 'button', 'click', 'cta', 'overlay', 'social'],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 120,
  packages: ['remotion', '@remotion/google-fonts'],
  difficulty: 'intermediate',
  checkFrame: 50,
  concepts: ['simultaneous cues', 'ripple via overflow clip', 'radial burst', 'transparent overlay'],
  credit: {
    label: 'Idea from “Transparent Call-To-Action overlay” in the Remotion prompt showcase',
    url: 'https://www.remotion.dev/prompts',
  },
};
