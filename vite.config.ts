import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  // GitHub Pages serves the site under /healthy-humans/.
  base: process.env.GITHUB_ACTIONS ? '/healthy-humans/' : '/',
  plugins: [preact()],
  define: { __BUILD_TIME__: JSON.stringify(new Date().toISOString().slice(0, 16)) },
});
