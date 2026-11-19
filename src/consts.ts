export const SITE_TITLE = '税理士のしおり';
export const SITE_SUBTITLE = '経営・財務・税務を横断する税理士のブログ';
export const SITE_URL = 'https://p-gate-canto.github.io/';
export const SITE_TAGLINE = '数字の外側に、そっと挟んでおく覚え書き。';
export const SITE_DESCRIPTION =
  '経営・財務・税務・人事・DX。実務と勉強の途中で考えたことを、しおりのように書き留めるブログ。';

type Topic = { slug: string; label: string };
type Category = { label: string; en: string; topics: Topic[] };

const t = (slug: string, label: string): Topic => ({ slug, label });

// 目次（大分類 → 小項目）
export const CATEGORIES = {
  strategy: {
    label: '経営戦略',
    en: 'Corporate Strategy',
    topics: [
      t('vision', '経営理念・ビジョン策定'),
      t('midterm-plan', '中期経営計画策定'),
      t('corporate-strategy', '経営戦略策定'),
      t('portfolio', '事業ポートフォリオ戦略'),
      t('restructuring', '事業再構築戦略'),
      t('resource-allocation', '経営資源配分戦略'),
      t('management-system', '経営管理体制構築'),
      t('succession', '経営承継戦略'),
    ],
  },
  finance: {
    label: '財務・会計戦略',
    en: 'Financial Strategy',
    topics: [
      t('financial-strategy', '財務戦略策定'),
      t('fundraising', '資金調達戦略'),
      t('cash-flow', '資金繰り改善戦略'),
      t('capital-policy', '資本政策'),
      t('management-accounting', '管理会計導入'),
      t('budgeting', '予算管理体制構築'),
      t('profit-improvement', '利益改善戦略'),
      t('cost-management', '原価管理戦略'),
      t('financial-health', '財務体質改善'),
      t('investment', '投資判断支援'),
    ],
  },
  tax: {
    label: '税務戦略',
    en: 'Tax Strategy',
    topics: [
      t('tax-planning', '節税戦略'),
      t('corporate-tax', '法人税最適化'),
      t('income-allocation', '所得配分戦略'),
      t('group-tax', 'グループ税務戦略'),
      t('entity-design', '法人設計戦略'),
      t('executive-pay', '役員報酬戦略'),
      t('succession-tax', '事業承継税務戦略'),
      t('ma-tax', 'M&A税務戦略'),
      t('international-tax', '国際税務戦略'),
      t('tax-risk', '税務リスク管理'),
    ],
  },
  bizdev: {
    label: '事業開発戦略',
    en: 'Business Development',
    topics: [
      t('new-business', '新規事業開発'),
      t('commercialization', '事業化支援'),
      t('business-model', 'ビジネスモデル構築'),
      t('market-entry', '市場参入戦略'),
      t('product-development', '商品・サービス開発'),
      t('pricing', '価格戦略'),
      t('alliance', '事業提携戦略'),
      t('diversification', '多角化戦略'),
      t('turnaround', '事業再生戦略'),
      t('exit', '撤退戦略'),
    ],
  },
  ma: {
    label: 'M&A・組織再編戦略',
    en: 'M&A Strategy',
    topics: [
      t('ma-strategy', 'M&A戦略策定'),
      t('target-screening', 'M&A候補先選定'),
      t('financial-dd', '財務デューデリジェンス'),
      t('tax-dd', '税務デューデリジェンス'),
      t('valuation', '企業価値評価'),
      t('ma-scheme', 'M&Aスキーム検討'),
      t('pmi', 'PMI'),
      t('reorganization', '組織再編'),
      t('succession-ma', '事業承継M&A'),
    ],
  },
  marketing: {
    label: 'マーケティング・営業戦略',
    en: 'Marketing & Sales Strategy',
    topics: [
      t('marketing-strategy', 'マーケティング戦略'),
      t('market-analysis', '市場分析'),
      t('customer-analysis', '顧客分析'),
      t('branding', 'ブランド戦略'),
      t('web-marketing', 'Webマーケティング'),
      t('lead-generation', '集客戦略'),
      t('sales-strategy', '営業戦略'),
      t('sales-organization', '営業組織構築'),
      t('crm', 'CRM戦略'),
      t('sales-promotion', '販売促進戦略'),
    ],
  },
  hr: {
    label: '組織・人事戦略',
    en: 'Organization & HR Strategy',
    topics: [
      t('organization', '組織戦略'),
      t('workforce-planning', '人員計画'),
      t('recruiting', '採用戦略'),
      t('evaluation', '人事評価制度'),
      t('compensation', '賃金制度'),
      t('development', '人材育成戦略'),
      t('retention', '人材定着戦略'),
      t('labor-management', '労務管理体制'),
      t('culture', '組織風土改革'),
      t('successor-development', '後継者育成'),
    ],
  },
  dx: {
    label: 'DX・IT・AI戦略',
    en: 'Digital Transformation Strategy',
    topics: [
      t('dx-strategy', 'DX戦略策定'),
      t('it-strategy', 'IT戦略'),
      t('bpr', '業務改革（BPR）'),
      t('automation', '業務自動化'),
      t('ai', 'AI導入戦略'),
      t('data', 'データ活用戦略'),
      t('system-implementation', 'システム導入支援'),
      t('internal-control-dx', '内部統制DX'),
      t('digital-marketing', 'デジタルマーケティング'),
      t('productivity', '生産性改善'),
    ],
  },
  risk: {
    label: 'リスク・ガバナンス戦略',
    en: 'Risk & Governance',
    topics: [
      t('risk-management', 'リスクマネジメント'),
      t('internal-control', '内部統制構築'),
      t('compliance', 'コンプライアンス'),
      t('governance', 'ガバナンス構築'),
      t('internal-audit', '内部監査体制'),
      t('fraud-prevention', '不正防止対策'),
      t('bcp', 'BCP策定'),
      t('security', '情報セキュリティ'),
    ],
  },
  work: { label: '仕事術・理念', en: 'Work & Philosophy', topics: [] },
  tools: { label: 'ツール', en: 'Tools', topics: [] },
} satisfies Record<string, Category>;

export type CategoryKey = keyof typeof CATEGORIES;
export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];
/** 目次の本体（9分野） */
export const MAIN_KEYS = CATEGORY_KEYS.filter((k) => k !== 'work' && k !== 'tools');

export const topicLabel = (cat: CategoryKey, slug?: string) =>
  (CATEGORIES[cat].topics as Topic[]).find((x) => x.slug === slug)?.label;

/** サイト内のURLを作る */
export const url = (path = '') =>
  `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

export const catUrl = (cat: CategoryKey, topic?: string) =>
  cat === 'tools' ? url('/tools/') : url(topic ? `/category/${cat}/${topic}/` : `/category/${cat}/`);

/** 日付を YYYY/MM/DD で表示 */
export const fmtDate = (d: Date) =>
  `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;

/** <time datetime> 用に YYYY-MM-DD を返す */
export const isoDate = (d: Date) => fmtDate(d).replaceAll('/', '-');
