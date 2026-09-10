/**
 * The controlled vocabularies for `meta.tags` and `meta.concepts`.
 *
 * Before this file existed the library had 373 distinct tags across 88 effects,
 * 251 of them used exactly once, and 333 concepts of which 307 were used once.
 * A vocabulary where two thirds of the terms appear on a single entry is not a
 * vocabulary — it is free text with commas in it, and the "learn by concept"
 * index `types.ts` promises was 333 orphan pages.
 *
 * So: both lists are closed. `meta.tags` and `meta.concepts` may only draw from
 * them, and `npm run check:vocab` fails the build on anything else. Anything a
 * term cannot express belongs in `description`, which the gallery already
 * indexes for free-text search.
 *
 * Adding a term is allowed and expected — but add it because two or more effects
 * need it, not to describe one. A term used once is a description, not an index.
 */

/**
 * What an effect IS and what it is FOR: subject, medium, look, format.
 * Aim for 4-7 per effect. The technology axis is already covered by
 * `meta.packages`, which the gallery filters on separately, so tag the subject
 * rather than the library except where the library is the subject ('3d', 'd3').
 */
export const TAGS = [
  '3d', 'ai', 'ambient', 'annotation', 'audio', 'background', 'blur', 'broadcast', 'browser',
  'button', 'camera', 'captions', 'chart', 'chat', 'checklist', 'cinematic', 'clip-path',
  'code', 'colour', 'comparison', 'countdown', 'counter', 'css', 'd3', 'dashboard', 'device',
  'diagram', 'draw-on', 'editorial', 'explainer', 'footage', 'geo', 'glitch', 'gradient',
  'grid', 'hand-drawn', 'hierarchy', 'highlight', 'impact', 'kinetic-type', 'list', 'logo',
  // Editing on real footage — added with the `edit`, `grade` and `sound` sections.
  'b-roll', 'beat-sync', 'cut-list', 'ducking', 'grade', 'grain', 'handheld', 'interview',
  'keying', 'letterbox', 'picture-in-picture', 'punch-in', 'reframe', 'sfx', 'silence',
  'speed-ramp', 'split-edit', 'split-screen', 'transcript', 'vignette',
  'loop', 'lower-third', 'mask', 'mockup', 'morph', 'music', 'network', 'notification',
  'overlay', 'parallax', 'particles', 'perspective', 'photo', 'print', 'progress', 'quote',
  'reference', 'retro', 'shader', 'social', 'space', 'spring', 'stagger', 'stroke', 'svg',
  'table', 'terminal', 'text', 'title', 'transition', 'typing', 'vertical', 'waveform',
] as const;

export type Tag = (typeof TAGS)[number];

/**
 * The technique an effect teaches — the thing you would look up if you had seen
 * it once and wanted to build it. Aim for 3-5 per effect, and prefer the name a
 * reader would search for (`stroke-dashoffset draw`, `d3-force`) over a
 * description of the outcome.
 */
export const CONCEPTS = [
  'AdditiveBlending', 'CSS mask-image', 'CSS perspective', 'Easing.bezier', 'Freeze',
  'InstancedMesh', 'Manim rate functions', 'MeshPhysicalMaterial', 'SVG clipPath',
  'SVG filter primitives', 'Series', 'ShaderMaterial', 'ThreeCanvas', 'TransitionPresentation',
  'TransitionSeries', 'TubeGeometry', 'animated effect params', 'background-clip: text',
  'camera kick', 'camera on a curve', 'character budget typing', 'clip-path reveal',
  'closed-form motion', 'continuous cursor', 'coupled layout', 'd3-chord', 'd3-delaunay',
  'd3-force', 'd3-geo projection', 'd3-hierarchy', 'd3-sankey', 'd3-shape', 'decaying impulse',
  'depth-derived layout', 'derived atmospherics', 'derived schedule', 'deterministic layout',
  'device chrome', 'directional blur', 'effects array ordering', 'elliptical projection',
  'evolvePath', 'fake perspective', 'feColorMatrix alpha contrast',
  'fixed slots without reflow', 'frame-derived state', 'gamma correction', 'impact stacking',
  'interpolatePath', 'layer sandwich', 'layered gradients', 'letter-spacing animation',
  'linear camera drift', 'matched vertex counts', 'mirrored reflection', 'mixBlendMode',
  'modulo looping', 'multi-keyframe interpolate', 'null-while-loading', 'overflow clipping',
  'overflow scroll simulation', 'overscan', 'paint order', 'per-character stagger',
  'phase-shifted sine', 'polar arcs', 'pre-ticked simulation', 'preserve-3d', 'procedural grid',
  'programmable in/out', 'progress-driven library', 'progress-gated reveal', 'random(seed)',
  'rank-based positioning', 'rect interpolation', 'seamless loop', 'shared element transition',
  'single driver value', 'skew + counter-skew', 'spring overshoot', 'spring()', 'springTiming',
  'staggered entrance', 'stroke-dashoffset draw', 'stroke/fill lag', 'syntax tokenizer',
  'tabular-nums', 'tangent heading', 'text stroke + paintOrder', 'three-point lighting',
  'timeline length semantics', 'transformOrigin', 'travelling wave', 'trig orbits',
  'useAudioData', 'value interpolation', 'vertex displacement', 'visualizeAudio',
  'word-level timing',
  // Editing on real footage — added with the `edit`, `grade` and `sound` sections.
  'trimBefore cut list', 'untweened scale step', 'subject-anchored origin',
  'two-octave noise', 'lagged rotation', 'remapSpeed accumulator',
  'frame blending', 'split edit offset', 'equal-power crossfade', 'look-ahead duck',
  'dB-domain interpolation', 'gap classification', 'keep-list from word timings',
  'pause budget', 'room tone floor', 'frame-exact SFX', 'peak picking',
  'octave-banded FFT', 'effects array grade', 'seeded per-frame grain',
  'chroma key spill', 'region blur inversion', 'octave-quantised roughness',
  'total function of frame', 'viz template catalogue', 'beat-to-frame schedule',
] as const;

export type Concept = (typeof CONCEPTS)[number];
