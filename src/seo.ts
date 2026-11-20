import { SITE_TITLE, SITE_URL, SITE_DESCRIPTION } from './consts';

const abs = (path: string) => new URL(path, SITE_URL).href;

/** サイトの発行者（ロゴは Google の推奨どおり 112px 以上の正方形） */
const publisherLd = () => ({
  '@type': 'Organization',
  name: SITE_TITLE,
  url: SITE_URL,
  logo: { '@type': 'ImageObject', url: abs('apple-touch-icon.png'), width: 180, height: 180 },
  publishingPrinciples: abs('policy/'),
});

/** 筆者（公開する肩書きは「税理士・会社役員」まで） */
const authorLd = () => ({
  '@type': 'Person',
  name: `${SITE_TITLE} 筆者`,
  url: abs('about/'),
  jobTitle: '税理士・会社役員',
  knowsAbout: ['税務', '会計', '財務', '経営戦略', '事業承継', '人事・労務'],
});

export const websiteLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_TITLE,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: 'ja',
  publisher: publisherLd(),
});

/** パンくず：[['目次', '/contents/'], ...] */
export const breadcrumbLd = (items: [string, string][]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [['ホーム', SITE_URL] as [string, string], ...items].map(([name, path], i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name,
    item: path.startsWith('http') ? path : abs(path),
  })),
});

export const articleLd = (a: { title: string; description: string; path: string; published: Date; modified?: Date }) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: a.title,
  description: a.description,
  url: abs(a.path),
  mainEntityOfPage: abs(a.path),
  datePublished: a.published.toISOString(),
  dateModified: (a.modified ?? a.published).toISOString(),
  inLanguage: 'ja',
  image: new URL('og.png', SITE_URL).href,
  author: authorLd(),
  publisher: publisherLd(),
});
