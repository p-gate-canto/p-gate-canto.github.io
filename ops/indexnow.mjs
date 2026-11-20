#!/usr/bin/env node
// IndexNow で、公開した記事を Bing などの検索エンジンへすぐ知らせる（Bing・Yahoo!（米国）・DuckDuckGo・ChatGPTの検索などが使う）
// 公開（GitHub Actions の deploy）のあとに自動で動く。鍵は public/<鍵>.txt に置いてあり、サイトの持ち主であることの証明になる
// 使い方：node ops/indexnow.mjs [changed|all]
//   changed（既定）：サイトマップの lastmod が直近2日以内のURL（＝新しく公開・更新した記事）とトップ・記事一覧
//   all：サイトマップのURLをすべて
const SITE = 'https://p-gate-canto.github.io';
const KEY = '68f2cfe3df57439ba49dceb2d348be1c';
const mode = process.argv[2] === 'all' ? 'all' : 'changed';

const xml = await (await fetch(`${SITE}/sitemap-0.xml?v=${Date.now()}`, { cache: 'no-store' })).text();
const entries = [...xml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?/g)].map((m) => ({ loc: m[1], lastmod: m[2] }));
const since = Date.now() - 2 * 24 * 60 * 60 * 1000;
const always = new Set([`${SITE}/`, `${SITE}/posts/`]);
const urls = mode === 'all' ? entries.map((e) => e.loc) : entries.filter((e) => always.has(e.loc) || (e.lastmod && Date.parse(e.lastmod) >= since)).map((e) => e.loc);
if (!urls.length) {
  console.log('知らせるURLはありません');
  process.exit(0);
}
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls }),
});
console.log(`IndexNow（${mode}）：${urls.length}件を送信 → HTTP ${res.status}`);
// 200・202 は受付済み。403 は鍵のファイルがまだ公開されていないとき（公開の反映待ち）
if (![200, 202].includes(res.status)) {
  console.log(await res.text());
  process.exit(1);
}
