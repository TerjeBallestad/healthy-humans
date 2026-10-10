import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { execSync } from 'node:child_process';

const commit = (process.env.GITHUB_SHA ?? execSync('git rev-parse HEAD').toString()).slice(0, 7);
// Norwegian local time: GMT+2 in summer, GMT+1 in winter. The sv-SE locale gives YYYY-MM-DD HH:MM.
const osloTime = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Oslo',
  dateStyle: 'short',
  timeStyle: 'short',
});

export default defineConfig({
  // GitHub Pages serves the site under /healthy-humans/. itch.io serves it from a CDN path we
  // do not know, so the itch build uses relative paths.
  base: process.env.ITCH ? './' : process.env.GITHUB_ACTIONS ? '/healthy-humans/' : '/',
  plugins: [preact()],
  define: {
    __BUILD_TIME__: JSON.stringify(osloTime.format(new Date())),
    __COMMIT__: JSON.stringify(commit),
  },
});
