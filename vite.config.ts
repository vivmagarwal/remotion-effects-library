import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  root: '.',
  // A GitHub Pages *project* site is served from /<repo>/, not /. Set
  // GALLERY_BASE at build time to match; local dev stays at the root.
  base: process.env.GALLERY_BASE ?? '/',
  server: {port: 5177, open: true},
  build: {outDir: 'dist-gallery'},
});
