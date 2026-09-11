import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  root: '.',
  // A GitHub Pages *project* site is served from /<repo>/, not /. Set
  // GALLERY_BASE at build time to match; local dev stays at the root.
  base: process.env.GALLERY_BASE ?? '/',
  server: {port: 5177, open: true},
  preview: {port: 5178},
  build: {
    outDir: 'dist-gallery',
    // The registry statically imports every effect, so three.js and the eleven
    // d3 packages otherwise land in the same chunk as the shell and a visitor
    // who only wants a text effect downloads all of it before the first card
    // paints. Splitting them lets the browser cache the heavy libraries
    // separately and start on the UI sooner.
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(three|@react-three)\//.test(id)) return 'three';
          if (/node_modules\/(d3-|topojson|world-atlas)/.test(id)) return 'd3';
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react';
          return undefined;
        },
      },
    },
  },
});
