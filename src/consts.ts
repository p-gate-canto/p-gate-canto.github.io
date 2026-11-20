import site from './data/site.json';
import taxonomy from './data/taxonomy.json';

// サイト名・説明文などは src/data/site.json（Pages CMS の「サイト設定」）で編集する
export const SITE_TITLE = site.title;
export const SITE_SUBTITLE = site.subtitle;
export const SITE_URL = 'https://p-gate-canto.github.io/';
export const SITE_TAGLINE = site.tagline;
export const SITE_DESCRIPTION = site.description;
export const FOOTER_NOTE = site.footerNote;
export const AUTHOR_NAME = site.authorName;
export const AUTHOR_BIO = site.authorBio;
export const SITE_KEYWORDS: string[] = (site as { keywords?: string[] }).keywords ?? [];
// トップの「まず読む3本」（記事のスラッグ）。下書きや存在しないものは飛ばす
export const SITE_FEATURED: string[] = (site as { featured?: string[] }).featured ?? [];

// 分類（大分類・中カテゴリー・小カテゴリー・タグ・記事タイプ）は src/data/taxonomy.json で定義する
export type Topic = { slug: string; label: string };
export type Mid = { key: string; pillar: string; layer: string | null; label: string; topics: Topic[] };

export const PILLARS = taxonomy.pillars;
export const LAYERS = taxonomy.layers;
export const MIDS = taxonomy.mids as Mid[];
export const TAG_GROUPS = taxonomy.tagGroups;
export const ALL_TAGS = TAG_GROUPS.flatMap((g) => g.tags);
export const READERS = taxonomy.readers;
export const TYPES = taxonomy.types;

export const MID_KEYS = MIDS.map((m) => m.key);
export const midOf = (key?: string) => MIDS.find((m) => m.key === key);
export const pillarOf = (key?: string) => PILLARS.find((p) => p.key === key);
export const typeOf = (key?: string) => TYPES.find((t) => t.key === key);
export const topicLabel = (mid?: string, slug?: string) => midOf(mid)?.topics.find((t) => t.slug === slug)?.label;
/** 小カテゴリーがどの中カテゴリーに属するか */
export const topicOwner = (slug?: string) => (slug ? MIDS.find((m) => m.topics.some((t) => t.slug === slug))?.key : undefined);

/** サイト内のURLを作る */
export const url = (path = '') => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
export const pillarUrl = (pillar: string) => url(`/${pillar}/`);
export const midUrl = (mid: string, topic?: string) => {
  const m = midOf(mid);
  return m ? url(topic ? `/${m.pillar}/${m.key}/${topic}/` : `/${m.pillar}/${m.key}/`) : url('/');
};
export const tagUrl = (tag: string) => url(`/tags/${encodeURIComponent(tag)}/`);
export const typeUrl = (type: string) => url(`/types/${type}/`);

/** 日付を YYYY/MM/DD で表示 */
export const fmtDate = (d: Date) =>
  `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
/** <time datetime> 用に YYYY-MM-DD を返す */
export const isoDate = (d: Date) => fmtDate(d).replaceAll('/', '-');
