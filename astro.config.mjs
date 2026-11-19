// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import { readdirSync, readFileSync, existsSync } from 'node:fs';

// 記事のある分野・項目だけをサイトマップに載せる（記事のないページは noindex）
function usedSections() {
  const dir = './src/content/posts';
  const used = new Set();
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.md') || f.startsWith('_')) continue;
    const fm = readFileSync(`${dir}/${f}`, 'utf8').split('---')[1] ?? '';
    if (/^draft:\s*true/m.test(fm)) continue;
    const cat = fm.match(/^category:\s*["']?([\w-]+)/m)?.[1];
    const topic = fm.match(/^topic:\s*["']?([\w-]+)/m)?.[1];
    if (cat) used.add(cat);
    if (cat && topic) used.add(`${cat}/${topic}`);
  }
  const hasTools = existsSync('./public/tools') && readdirSync('./public/tools', { withFileTypes: true }).some((e) => e.isDirectory());
  return { used, hasTools };
}
const { used, hasTools } = usedSections();
const sitemapFilter = (page) => {
  const m = page.match(/\/category\/([\w-]+)\/(?:([\w-]+)\/)?$/);
  if (m) return used.has(m[2] ? `${m[1]}/${m[2]}` : m[1]);
  if (/\/tools\/$/.test(page)) return hasTools || used.has('tools');
  return true;
};

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
            else if (/\.(html|css)$/.test(e.name) && !e.name.startsWith('google')) {
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
  trailingSlash: 'always',
  build: { assets: 'assets' },
  compressHTML: false,
  vite: {
    build: {
      cssMinify: false,
      rollupOptions: { output: { assetFileNames: 'assets/style[extname]' } },
    },
  },
  integrations: [sitemap({ filter: sitemapFilter }), formatOutput()],
});
