import { getCollection, type CollectionEntry } from 'astro:content';
import { midOf } from './consts';

type Post = CollectionEntry<'posts'>;
const byDate = (a: Post, b: Post) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf();

/** 公開記事を新しい順に取得（draft: true は除外） */
export async function getPosts() {
  return (await getCollection('posts', ({ data }) => !data.draft)).sort(byDate);
}

/** 下書き（draft: true）を新しい順に取得 */
export async function getDrafts() {
  return (await getCollection('posts', ({ data }) => data.draft)).sort(byDate);
}

/** 記事が属する大分類 */
export const pillarOfPost = (p: Post) => midOf(p.data.category)?.pillar ?? 'growth';

/** 件数の集計（中カテゴリー・小カテゴリー・大分類・タグ・記事タイプ） */
export function countBy(posts: Post[]) {
  const c: Record<string, number> = {};
  const inc = (k?: string) => k && (c[k] = (c[k] ?? 0) + 1);
  for (const p of posts) {
    inc(p.data.category);
    inc(p.data.topic);
    inc(`pillar:${pillarOfPost(p)}`);
    inc(`type:${p.data.type}`);
    p.data.tags.forEach((t) => inc(`tag:${t}`));
  }
  return c;
}

/** 関連記事：同じ小カテゴリー → 同じ中カテゴリー → 同じタグ → 同じ大分類の順に最大 n 本 */
export function relatedPosts(post: Post, all: Post[], n = 3) {
  const score = (p: Post) =>
    (post.data.topic && p.data.topic === post.data.topic ? 100 : 0) +
    (p.data.category === post.data.category ? 20 : 0) +
    p.data.tags.filter((t) => post.data.tags.includes(t)).length * 5 +
    (pillarOfPost(p) === pillarOfPost(post) ? 1 : 0);
  return all
    .filter((p) => p.id !== post.id)
    .map((p) => ({ p, s: score(p) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || byDate(a.p, b.p))
    .slice(0, n)
    .map((x) => x.p);
}

/** 読了時間（日本語 1 分 500 字で概算） */
export const readingMinutes = (body = '') =>
  Math.max(1, Math.round(body.replace(/```[\s\S]*?```|<[^>]+>|[#>*_|`\-\s]/g, '').length / 500));

/** 法令の基準日から 1 年以上たっているか */
export const isStale = (d?: Date) => !!d && Date.now() - d.valueOf() > 365 * 24 * 60 * 60 * 1000;

// 見出し・タイトル用：BudouX で文節に区切り、区切りに <wbr> を入れる（CSS の word-break: keep-all と組み合わせて、単語の途中で改行させない）
// 2文字以下の区切りは前の文節につなげ、行末に1〜2文字だけ残る「泣き別れ」を防ぐ
import { loadDefaultJapaneseParser } from 'budoux';
const budoux = loadDefaultJapaneseParser();
// 11文字以上の長い文節は、カタカナ語の切れ目と、中黒・読点・閉じかっこの後でも改行できるようにする（例：ネットワーク｜外部性などを整理）
export function splitLong(seg: string): string[] {
  if (seg.length <= 10) return [seg];
  const parts = seg.split(/(?<=[ァ-ヴー])(?=[^ァ-ヴー・])|(?<=[・、」』）])(?=[^・、」』）])/);
  const out: string[] = [];
  for (const p of parts) {
    if (out.length && (p.length < 3 || out[out.length - 1].length < 3)) out[out.length - 1] += p;
    else out.push(p);
  }
  return out;
}
export function phrases(text: string): string[] {
  const out: string[] = [];
  let carry = '';
  // 「｜」「／」の後は必ず区切る（タイトルの前半と後半を1つの文節にしない）
  for (let seg of budoux.parse(text).flatMap((s) => s.split(/(?<=[｜|／])/)).flatMap(splitLong)) {
    // 区切り記号（｜／）と、行頭に置けない記号（・：、。閉じかっこなど）は前の文節に付ける（行頭禁則）
    const lead = seg.match(/^[｜|／・：；、。，．）」』】〉》〕］｝”’)\]]+/);
    if (lead && out.length) { out[out.length - 1] += lead[0]; seg = seg.slice(lead[0].length); if (!seg) continue; }
    seg = carry + seg; carry = '';
    if (out.length && seg.length <= 2) {
      // 2文字以下は前につなげる。ただし前が「｜」「／」で終わるときは、次の文節の頭につける
      if (/[｜|／]$/.test(out[out.length - 1])) carry = seg;
      else out[out.length - 1] += seg;
    } else out.push(seg);
  }
  if (carry) { if (out.length) out[out.length - 1] += carry; else out.push(carry); }
  return carryOpen(out);
}
// 開きかっこ（「『（など）は次の文節に送り、行末に残らないようにする（行末禁則）
export const OPEN_TAIL = /[「『（【〈《〔［｛“‘([]+$/;
export function carryOpen(out: string[]): string[] {
  for (let i = 0; i < out.length - 1; i++) {
    const m = out[i].match(OPEN_TAIL);
    if (m && m[0].length < out[i].length) { out[i] = out[i].slice(0, -m[0].length); out[i + 1] = m[0] + out[i + 1]; }
  }
  return out;
}
// 文節の中では改行させない：10文字以下の文節は <span class="ph">（white-space: nowrap）で包む。
// word-break: keep-all だけでは、かっこの前後（例：「の直後、」の直後）でブラウザが改行してしまうため。
// 11文字以上の文節は、狭い画面ではみ出さないよう包まない
export const PH_MAX = 10;
const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
export function phraseHtml(text: string): string {
  return phrases(text).map((p) => (p.length <= PH_MAX ? `<span class="ph">${esc(p)}</span>` : esc(p))).join('<wbr>');
}

// シリーズ（読む順番）：src/data/series.json。記事の末尾に「次に読む」を出す。下書きは飛ばす
import seriesData from './data/series.json';
export function nextInSeries(post: Post, all: Post[]) {
  const published = new Set(all.map((p) => p.id));
  for (const s of seriesData as { name: string; posts: string[] }[]) {
    const list = s.posts.filter((id) => published.has(id) || id === post.id);
    const i = list.indexOf(post.id);
    if (i < 0) continue;
    const nextId = list[i + 1] ?? (list.length > 1 ? list[0] : undefined);
    const next = nextId && nextId !== post.id ? all.find((p) => p.id === nextId) : undefined;
    if (next) return { name: s.name, index: i + 1, total: list.length, next, wrapped: i + 1 >= list.length };
  }
  return undefined;
}
