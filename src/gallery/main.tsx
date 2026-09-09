import React from 'react';
import {createRoot} from 'react-dom/client';
import {App} from './App';
import type {StaticFile} from 'remotion';
import {publicAssets} from '../registry.generated';
import './styles.css';

/**
 * Teach Remotion's staticFile() about the deploy base path.
 *
 * staticFile('plate-1.svg') returns a ROOT-absolute '/plate-1.svg' and offers no
 * way to prefix a base, so every asset 404s when the gallery is served from a
 * subpath — which is exactly what a GitHub Pages *project* site is
 * (https://user.github.io/repo/). Remotion checks window.remotion_staticFiles
 * first, so seeding it here remaps them before anything renders.
 *
 * At the root base ('/') this is a no-op, so local dev is unaffected.
 */
const base = import.meta.env.BASE_URL;
if (base && base !== '/') {
  // Remotion declares this global as StaticFile[]; only name and src are read
  // by staticFile(), but the shape has to match.
  window.remotion_staticFiles = publicAssets.map(
    (name): StaticFile => ({
      name,
      src: `${base.replace(/\/$/, '')}/${name}`,
      sizeInBytes: 0,
      lastModified: 0,
    }),
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
