import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { execSync } from 'node:child_process';

const commit = (process.env.GITHUB_SHA ?? execSync('git rev-parse HEAD').toString()).slice(0, 7);

export default defineConfig({
  // GitHub Pages serves the site under /healthy-humans/.
  base: process.env.GITHUB_ACTIONS ? '/healthy-humans/' : '/',
  plugins: [preact()],
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')),
    __COMMIT__: JSON.stringify(commit),
  },
});
