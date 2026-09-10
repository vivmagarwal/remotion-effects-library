import React from 'react';
import {createRoot} from 'react-dom/client';
import {App, FrameHarness, PlayHarness, frameIdFromHash, playIdFromHash} from './App';
import {promptComposerReady, promptFor, sourceOf} from './sources';
import {effects} from '../registry.generated';
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

/**
 * `#/frame/<id>` is the smoke-test route — one composition, alone, at 1:1.
 *
 * Chosen HERE rather than inside <App>, because branching inside a component
 * that calls hooks means returning before them, and a route change would then
 * render fewer hooks than the previous pass. It is a different page, so it gets
 * a different root. StrictMode is off for it: the double-invoke would mount and
 * measure every composition twice, and this route exists to be screenshotted.
 */
/**
 * The compositions this gallery can actually render, for `check:browser`.
 *
 * The gate needs the EXPANDED list — 181 rows, not the 96 effect folders — and
 * that expansion lives in the registry. Re-deriving it in a script means
 * reimplementing it, and the first attempt silently produced 99 rows because
 * `viz-gallery`'s variants arrive as an imported identifier a meta parser
 * cannot evaluate. Publishing it from the page that does the rendering is the
 * only version that cannot drift from what a viewer sees.
 */
(window as unknown as {__compositions?: unknown}).__compositions = effects.map((e) => ({
  id: e.meta.id,
  parentId: e.parentId ?? null,
  width: e.meta.width,
  height: e.meta.height,
  frame: e.meta.posterFrame ?? e.meta.checkFrame,
  // What "Copy code" and "Copy prompt" would actually put on the clipboard.
  // Both resolve through a Vite glob keyed by the registry's path, and a key
  // that does not match returns a placeholder rather than throwing — so the
  // only way to know the buttons are wired is to measure what they hold.
  srcBytes: sourceOf(e.file).length,
  promptBytes: promptComposerReady ? promptFor(e.meta, e.file).length : 0,
}));

const smokeId = frameIdFromHash(location.hash) ?? playIdFromHash(location.hash);
const playing = playIdFromHash(location.hash) !== null;
const smokeEntry = smokeId ? effects.find((e) => e.meta.id === smokeId) : undefined;

createRoot(document.getElementById('root')!).render(
  smokeId ? (
    smokeEntry ? (
      playing ? (
        <PlayHarness entry={smokeEntry} />
      ) : (
        <FrameHarness entry={smokeEntry} />
      )
    ) : (
      <div data-smoke-error>no such id: {smokeId}</div>
    )
  ) : (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ),
);
