import { defineConfig } from 'astro/config';

export default defineConfig({
  base: process.env.SITE_BASE || '/',
  vite: { server: { strictPort: true } },
  build: {
    format: 'directory',
  },
});
