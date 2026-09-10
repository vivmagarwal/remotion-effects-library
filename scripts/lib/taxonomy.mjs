/**
 * The taxonomy, mirrored for Node.
 *
 * `src/gallery/categories.ts` is the single SOURCE (it is the only copy the
 * TypeScript compiler checks against the `Category` union). This file is its
 * literal mirror so `.mjs` scripts can read it without a TS loader.
 * `npm run check:taxonomy` fails the build the moment the two disagree — and
 * also the moment either disagrees with `src/types.ts`.
 *
 * `scripts/update-readme.mjs` used to carry a third copy as `LABEL`/`ORDER`.
 */

/** Display order of the category chips and of the README table (CONTRACT §3). */
export const CATEGORY_ORDER = Object.freeze([
  'edit',
  'grade',
  'captions',
  'sound',
  'transitions',
  'type',
  'titles',
  'diagrams',
  'charts',
  'ui',
  'social',
  'motion',
  'backgrounds',
  'looks',
  'three-d',
  'reference',
]);

export const CATEGORY_LABEL = Object.freeze({
  edit: 'Video Editing',
  grade: 'Colour & Texture',
  captions: 'Captions & Subtitles',
  sound: 'Sound & Music',
  transitions: 'Transitions',
  type: 'Text & Type',
  titles: 'Titles & Lower Thirds',
  diagrams: 'Diagrams & Sketches',
  charts: 'Data & Charts',
  ui: 'UI & Product',
  social: 'Social & Shorts',
  motion: 'Motion & Physics',
  backgrounds: 'Backgrounds',
  looks: 'Visual FX',
  'three-d': '3D',
  reference: 'Reference & Samplers',
});

export const isCategory = (c) => Object.hasOwn(CATEGORY_LABEL, c);
