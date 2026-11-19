import { getCollection } from 'astro:content';
/** 公開記事を新しい順に取得（draft: true は除外） */
export async function getPosts() {
  const all = await getCollection('posts', ({ data }) => !data.draft);
  return all.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
