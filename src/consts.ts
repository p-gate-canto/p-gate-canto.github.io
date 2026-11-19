export const SITE_TITLE = '税理士のしおり';
export const SITE_TAGLINE = '数字の外側に、そっと挟んでおく覚え書き。';
export const SITE_DESCRIPTION =
  '税務・労務・経営・仕事術。実務と勉強の途中で考えたことを、しおりのように書き留めるブログ。';

// カテゴリ（記事の category にはキーを書く）
export const CATEGORIES = {
  tax: { label: '税務', desc: '制度の趣旨、条文・通達、実務の論点' },
  labor: { label: '労務', desc: '社会保険・労働法まわりの勉強ノート' },
  management: { label: '経営', desc: '事業計画、財務、組織。診断士の勉強も' },
  work: { label: '仕事術・理念', desc: '行動様式、仕組み化、考え方' },
  tools: { label: 'ツール', desc: '自作の実務ツールと使い方' },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

/** base（/zeirishi-shiori/）付きのURLを作る */
export const url = (path = '') =>
  `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

/** 日付を YYYY/MM/DD で表示 */
export const fmtDate = (d: Date) =>
  `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
