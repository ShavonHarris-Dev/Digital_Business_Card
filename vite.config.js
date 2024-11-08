// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // Must match Netlify's publish directory
    input: path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'index.html'), // Ensure Vite uses the correct entry
  },
});
