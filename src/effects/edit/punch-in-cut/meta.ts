import type {EffectMeta} from '../../../types';

export const meta: EffectMeta = {
  id: 'punch-in-cut', name: 'Punch-In Cut', category: 'edit',
  tagline: 'Hard framing steps on every cut, so jump cuts stop reading as cuts.',
  description:
    'The retention edit, done properly: on each cut the framing changes by an untweened step of 2-5 %, and the brain reads the new framing as a second camera rather than as a splice. Three decisions carry it. The step is NOT animated — an eased zoom on a cut announces the cut, which is the opposite of the job — so the level comes from `cuts.filter(c => c.at <= frame).at(-1)` rather than from an interpolate. The band is 2-5 % because below 2 % the eye files it as an encode wobble and above about 8 % it reads as a zoom and draws attention to the edit. And no two consecutive levels repeat, so the shot never ratchets one way. The push is anchored on the subject with transformOrigin rather than scaled about the centre and nudged back: one move that keeps the eyes still, instead of two moves fighting on the frame edges.',
  tags: ['footage', 'punch-in', 'camera', 'cut-list', 'interview', 'transcript'],
  concepts: ['untweened scale step', 'subject-anchored origin', 'trimBefore cut list', 'frame-derived state'],
  width: 1920, height: 1080, fps: 30, durationInFrames: 240,
  packages: ['remotion', '@remotion/media', '@remotion/google-fonts'],
  difficulty: 'starter', checkFrame: 130, posterFrame: 130,
  requires: ['video'], ground: 'dark', audience: ['youtuber', 'educator', 'agency'],
};
