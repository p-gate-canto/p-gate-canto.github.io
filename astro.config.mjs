// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 公開URL：https://p-gate-canto.github.io/zeirishi-shiori/
export default defineConfig({
  site: 'https://p-gate-canto.github.io',
  base: '/zeirishi-shiori',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
