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
export const pillarOfPost = (p: Post) => midOf(p.data.category)?.pillar ?? 'life';

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
export function phrases(text: string): string[] {
  const out: string[] = [];
  for (const seg of budoux.parse(text)) {
    if (out.length && seg.length <= 2) out[out.length - 1] += seg;
    else out.push(seg);
  }
  return out;
}
const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
export function phraseHtml(text: string): string {
  return phrases(text).map(esc).join('<wbr>');
}
