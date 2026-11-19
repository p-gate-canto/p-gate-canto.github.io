// 記事本文の後処理
// 1. 「> ポイント：」「> 注意：」「> 結論：」「> 補足：」で始まる引用を、色付きの要点ボックスにする
// 2. 画像を遅延読み込みにする
const TYPES = { 結論: 'conclusion', ポイント: 'point', 注意: 'caution', 補足: 'note' };
const RE = /^\s*(結論|ポイント|注意|補足)\s*[：:]\s*/;

function firstText(node) {
  if (node.type === 'text') return node.value.trim() ? node : null;
  for (const c of node.children ?? []) {
    const t = firstText(c);
    if (t) return t;
  }
  return null;
}

function walk(node, fn) {
  fn(node);
  for (const c of node.children ?? []) walk(c, fn);
}

export default function rehypeShiori() {
  return (tree) => {
    walk(tree, (node) => {
      if (node.type !== 'element') return;
      if (node.tagName === 'img') {
        node.properties = { loading: 'lazy', decoding: 'async', ...node.properties };
      }
      if (node.tagName === 'blockquote') {
        const t = firstText(node);
        const m = t && t.value.match(RE);
        if (!m) return;
        t.value = t.value.replace(RE, '');
        node.tagName = 'aside';
        node.properties = { ...node.properties, className: ['callout', `callout-${TYPES[m[1]]}`] };
        node.children.unshift({
          type: 'element',
          tagName: 'p',
          properties: { className: ['callout-label'] },
          children: [{ type: 'text', value: m[1] }],
        });
      }
    });
  };
}
