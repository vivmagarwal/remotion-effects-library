import type {Category} from '../types';

/**
 * The single source of truth for the taxonomy's user-facing names and order.
 *
 * `scripts/lib/taxonomy.mjs` mirrors this literal data for Node (which cannot
 * import a `.ts` file without a build step) and `npm run check:taxonomy` fails
 * if the two ever drift, or if either disagrees with the `Category` union in
 * `src/types.ts`. Nothing else may declare its own copy — adding a category
 * used to mean editing three files and remembering all three.
 */
export const CATEGORY_LABEL: Record<Category, string> = {
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
};

/**
 * Display order of the category filter chips, the README table and anything
 * else that lists the library.
 *
 * It runs from working with real footage, out through the layers you lay over
 * it, to the things built from nothing, and ends with the samplers — which are
 * documentation wearing an effect costume and should never compete with a
 * shippable shot for the top of the grid.
 */
export const CATEGORY_ORDER: readonly Category[] = [
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
];
