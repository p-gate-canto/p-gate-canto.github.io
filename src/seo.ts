import { SITE_TITLE, SITE_URL, SITE_DESCRIPTION } from './consts';

const abs = (path: string) => new URL(path, SITE_URL).href;

export const websiteLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_TITLE,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: 'ja',
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
  author: { '@type': 'Person', name: `${SITE_TITLE} 筆者`, url: new URL('about/', SITE_URL).href },
  publisher: { '@type': 'Organization', name: SITE_TITLE, url: SITE_URL },
});
