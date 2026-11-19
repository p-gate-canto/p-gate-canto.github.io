// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';

// 出力したHTML・CSSを読みやすく整形する
function formatOutput() {
  return {
    name: 'format-output',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const walk = async (d) => {
          for (const e of await readdir(d, { withFileTypes: true })) {
            const p = join(d, e.name);
            if (e.isDirectory()) await walk(p);
            else if (/\.(html|css)$/.test(e.name)) {
              const src = await readFile(p, 'utf8');
              const parser = e.name.endsWith('.css') ? 'css' : 'html';
              await writeFile(p, await prettier.format(src, { parser, printWidth: 120 }));
            }
          }
        };
        await walk(fileURLToPath(dir));
      },
    },
  };
}

export default defineConfig({
  site: 'https://p-gate-canto.github.io',
  base: '/zeirishi-shiori',
  trailingSlash: 'always',
  build: { assets: 'assets' },
  compressHTML: false,
  vite: {
    build: {
      cssMinify: false,
      rollupOptions: { output: { assetFileNames: 'assets/style[extname]' } },
    },
  },
  integrations: [sitemap(), formatOutput()],
});
