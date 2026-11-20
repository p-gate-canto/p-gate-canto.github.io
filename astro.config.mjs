// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import rehypeShiori from './src/rehype-shiori.mjs';
import { readdirSync, readFileSync, existsSync } from 'node:fs';

// 記事のある分野・項目だけをサイトマップに載せる（記事のないページは noindex）
function usedSections() {
  // 小カテゴリー → 中カテゴリー → 大分類 の対応表（src/data/taxonomy.json から読む）
  const tax = JSON.parse(readFileSync('./src/data/taxonomy.json', 'utf8'));
  const owner = {};
  const pillar = {};
  for (const m of tax.mids) {
    pillar[m.key] = m.pillar;
    for (const t of m.topics) owner[t.slug] = m.key;
  }
  const dir = './src/content/posts';
  const used = new Set();
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.md') || f.startsWith('_')) continue;
    const fm = readFileSync(`${dir}/${f}`, 'utf8').split('---')[1] ?? '';
    if (/^draft:\s*true/m.test(fm)) continue;
    const pick = (k) => fm.match(new RegExp(`^${k}:\\s*["']?([\\w-]+)`, 'm'))?.[1];
    const topic = pick('topic');
    let mid = owner[topic] ?? pick('category');
    if (!pillar[mid]) mid = 'mindset';
    used.add(`${pillar[mid]}/${mid}`);
    if (owner[topic]) used.add(`${pillar[mid]}/${mid}/${topic}`);
    used.add(`types/${pick('type') ?? 'explainer'}`);
  }
  return { used };
}
const { used } = usedSections();
const sitemapFilter = (page) => {
  const path = new URL(page).pathname.replace(/^\/|\/$/g, '');
  if (/^(drafts|tags|search)(\/|$)/.test(path)) return false;
  if (/^(work|learning|life)\/[\w-]+/.test(path) || /^types\/[\w-]+/.test(path)) return used.has(path);
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
              let src = await readFile(p, 'utf8');
              // 転送専用ページは、文字を一切出さずに即座に移動させる（「ページが見つかりません」も英語の案内も見せない）
              const to = src.includes('http-equiv="refresh"') && src.match(/url=([^"]+)"/)?.[1];
              if (to) {
                const abs = new URL(to, 'https://p-gate-canto.github.io/').href;
                src = `<!doctype html><html lang="ja" style="background:#f3f4f6"><head><meta charset="utf-8"><title>移動しています</title><meta http-equiv="refresh" content="0;url=${to}"><meta name="robots" content="noindex"><link rel="canonical" href="${abs}"><script>location.replace(${JSON.stringify(to)}+location.hash)</script></head><body></body></html>`;
              }
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
  // 旧URL → 新URL。404ページを経由せず、旧URLの場所に転送専用の軽いページを置く
  redirects: {
    '/zeirishi-shiori': '/',
    '/zeirishi-shiori/about': '/about/',
    '/zeirishi-shiori/contents': '/work/',
    '/zeirishi-shiori/posts/hello-shiori': '/posts/hello-shiori/',
    '/contents': '/work/',
    '/tools': '/types/tool/',
    '/category/self': '/life/',
    '/category/self/mindset': '/life/mindset/',
    '/category/work': '/life/',
    '/category/tax': '/work/corporate-tax/',
    '/category/strategy': '/work/corporate-strategy/',
  },
  build: { assets: 'assets' },
  compressHTML: false,
  vite: {
    build: {
      cssMinify: true, // 公開するCSSからコメントを除く
      rollupOptions: { output: { assetFileNames: 'assets/style[extname]' } },
    },
  },
  markdown: { rehypePlugins: [rehypeShiori] },
  integrations: [sitemap({ filter: sitemapFilter }), formatOutput()],
});
