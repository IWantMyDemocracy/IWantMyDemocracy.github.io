import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.iwantmydemocracy.com',
  // Pages are published as folders (/designs/), so links end in "/" and GitHub Pages
  // serves them directly instead of redirecting.
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      filter: (page) => !/\/404\/?$/.test(page),
    }),
  ],
});
