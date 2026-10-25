import { defineConfig } from 'astro/config';

// Change site/base together when connecting tearrpg.com.
export default defineConfig({
  site: 'https://tearrpg.github.io',
  base: '/tear-website',
  output: 'static',
});
