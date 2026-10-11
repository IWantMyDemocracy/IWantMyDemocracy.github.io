import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.iwantmydemocracy.com',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
