import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'speed-ramp', name: 'Speed Ramp', category: 'edit',
  tagline: 'Real time into slow motion into over-crank, on one continuous clip.',
  description:
    'playbackRate alone does not do this: it is read once when the clip mounts, so animating it changes nothing on screen. A ramp is a remap — at every output frame you sum the speed so far to get how deep into the source you have travelled, and seek there. Two things everyone gets wrong. <Sequence from={frame}> is not a typo: it resets the child\'s internal clock to zero every frame so trimBefore is the only thing moving the playhead, and without it the child\'s own clock advances as well and the clip accelerates away. And the cumulative sum belongs in a useMemo rather than inline, where it is O(frame) per frame — O(n²) over a render — and where it also pretends to depend on the frame when it is a pure function of the ramp. Three numbers make it read as a directing choice: the ramp out is longer than the ramp in (8 frames down, 14 back up) because nothing physical accelerates and decelerates at the same rate; the slow section starts four to six frames BEFORE the moment, since by the time the audience registers the change the moment has begun; and 0.4× is the floor for 30fps source, below which each source frame is held three or more output frames and the shot stutters. Remotion has no optical flow and no frame blending, so there is no software fix — slowing to 0.2× honestly requires 150fps in the camera. A ramp is also a budget on the source: the sum of the speeds is how much of the file you spend, and overspending renders as a held final frame with no error, so it is clamped and metered on screen.',
  tags: ['editorial', 'footage', 'speed-ramp', 'b-roll', 'explainer'],
  concepts: ['remapSpeed accumulator', 'frame blending', 'trimBefore cut list', 'tabular-nums'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 189,
  packages: ['remotion', '@remotion/media', '@remotion/google-fonts'],
  // 80 is inside the 0.4x hold, where the curve is flat below the 1x line and
  // the spend meter has visibly stopped moving — the whole argument in one frame.
  difficulty: 'advanced', checkFrame: 80, posterFrame: 80,
  requires: ['video'], ground: 'dark', audience: ['youtuber', 'agency'],
};
