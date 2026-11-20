// 記事本文の後処理
// 1. 「> ポイント：」「> 注意：」「> 結論：」「> 補足：」で始まる引用を、色付きの要点ボックスにする
// 2. 画像を遅延読み込みにする
// 3. 未記入の「実務メモ」欄（見出し＋「筆者記入欄」を含む引用）は表示しない
// 4. 表：各セルに列見出しを data-label として付ける。4列以上の表と、長い文のある3列の表は、スマホで行ごとのカード表示にする（tbl-stack）
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

function textOf(node) {
  if (node.type === 'text') return node.value;
  return (node.children ?? []).map(textOf).join('');
}

function dropEmptyMemo(tree) {
  const kids = tree.children ?? [];
  for (let i = 0; i < kids.length; i++) {
    const h = kids[i];
    if (h.type !== 'element' || h.tagName !== 'h2' || textOf(h).trim() !== '実務メモ') continue;
    let j = i + 1;
    while (j < kids.length && kids[j].type === 'text' && !kids[j].value.trim()) j++;
    const q = kids[j];
    if (q && q.type === 'element' && q.tagName === 'blockquote' && textOf(q).includes('筆者記入欄')) {
      kids.splice(i, j - i + 1);
      i--;
    }
  }
}

function els(node, tag) {
  const out = [];
  walk(node, (n) => { if (n.type === 'element' && n.tagName === tag) out.push(n); });
  return out;
}

function tableLabels(table) {
  const head = els(table, 'thead')[0];
  const ths = head ? els(head, 'th') : [];
  const labels = ths.map((th) => textOf(th).trim());
  const cls = ['tbl'];
  // 3列の表も、文字数の多いセル（18文字以上）があればカード表示にする（スマホで列が細くなりすぎるため）
  const longest = Math.max(0, ...els(table, 'td').map((td) => textOf(td).trim().length));
  if (labels.length >= 4 || (labels.length === 3 && longest >= 18)) cls.push('tbl-stack');
  table.properties = { ...table.properties, className: cls };
  for (const body of els(table, 'tbody')) {
    for (const tr of els(body, 'tr')) {
      els(tr, 'td').forEach((td, i) => {
        if (labels[i]) td.properties = { ...td.properties, dataLabel: labels[i] };
      });
    }
  }
}

export default function rehypeShiori() {
  return (tree) => {
    dropEmptyMemo(tree);
    walk(tree, (node) => {
      if (node.type !== 'element') return;
      if (node.tagName === 'table') tableLabels(node);
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
