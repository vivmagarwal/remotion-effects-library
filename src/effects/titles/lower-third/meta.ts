import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'lower-third', name: 'Lower Third', category: 'titles',
  tagline: 'A slanted plate unrolls out of an accent bar, then retracts the same way.',
  description:
    'The broadcast name plate. One open value from 0 to 1 drives every layer — the bar scales up on y, the plate unrolls on x out of the bar, the text slides out from behind it — and the exit simply runs that value back to 0, so the retract is the entrance in reverse rather than a fade. The assembly is skewed as a whole and the type counter-skewed inside it, which keeps the slant on the plate without italicising the words. The bar leads, the plate follows it out, the text follows the plate — one value, three delays — so the retract reverses the order for free instead of needing a second choreography. It defaults to sitting over real footage, because a lower third is never seen on black in the wild and judging one on black is how you ship a plate with too little contrast against the shot it will actually live on; the scrim it brings is under the plate only, since dimming the picture is the one thing a broadcast operator will not forgive. Set src to null, or transparent, to render it as a WebM or ProRes overlay to key over your own.',
  tags: ['lower-third', 'broadcast', 'overlay', 'title', 'text', 'footage'],
  concepts: ['single driver value', 'programmable in/out', 'skew + counter-skew'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 140,
  packages: ['remotion', '@remotion/media', '@remotion/google-fonts'],
  difficulty: 'starter', checkFrame: 16, posterFrame: 60,
  requires: ['video'], ground: 'dark', audience: ['youtuber', 'podcaster', 'agency'],
};
