import type {Category} from '../types';

export const CATEGORY_LABEL: Record<Category, string> = {
  text: 'Text & Type',
  openers: 'Openers',
  transitions: 'Transitions',
  effects: 'Visual FX',
  data: 'Data & Charts',
  motion: 'Motion',
  backgrounds: 'Backgrounds',
  ui: 'UI & Social',
  media: 'Media',
  captions: 'Captions',
  'three-d': '3D',
  audio: 'Audio',
};

/** Display order of the category filter chips. */
export const CATEGORY_ORDER: readonly Category[] = [
  'text',
  'openers',
  'transitions',
  'effects',
  'motion',
  'backgrounds',
  'data',
  'ui',
  'captions',
  'media',
  'three-d',
  'audio',
];
