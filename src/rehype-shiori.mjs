import fs from 'node:fs';
import path from 'node:path';

// 記事本文の後処理
// 7. まだ下書き（draft: true）の記事への本文中のリンクは、リンクを外して文字だけにする（公開後のビルドで自動的にリンクに戻る）
// 1. 「> ポイント：」「> 注意：」「> 結論：」「> 補足：」で始まる引用を、色付きの要点ボックスにする
// 2. 画像を遅延読み込みにする
// 3. 未記入の「実務メモ」欄（見出し＋「筆者記入欄」を含む引用）は表示しない
// 6. 日付（令和8年4月1日、2026年11月20日、2026/11/20 など）は途中で改行しない（span.nw で囲む）
// 5. 図版：画像だけの段落の直後に「出典：」で始まる段落があれば、図と出典を共通の枠（figure.fig）にまとめる
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

function isEl(n, tag) { return n && n.type === 'element' && n.tagName === tag; }

function wrapFigures(tree) {
  const kids = tree.children ?? [];
  for (let i = 0; i < kids.length; i++) {
    const p = kids[i];
    if (!isEl(p, 'p')) continue;
    const inner = p.children.filter((c) => !(c.type === 'text' && !c.value.trim()));
    if (inner.length !== 1 || !isEl(inner[0], 'img')) continue;
    let j = i + 1;
    while (j < kids.length && kids[j].type === 'text' && !kids[j].value.trim()) j++;
    const cap = kids[j];
    if (!isEl(cap, 'p') || !/^\s*出典[：:]/.test(textOf(cap))) continue;
    const img = inner[0];
    img.properties = { ...img.properties, loading: 'lazy', decoding: 'async' };
    kids.splice(i, j - i + 1, {
      type: 'element',
      tagName: 'figure',
      properties: { className: ['fig'] },
      children: [img, { type: 'element', tagName: 'figcaption', properties: {}, children: cap.children }],
    });
  }
}

const DATE_RE = /((?:令和|平成|昭和)\d{1,2}年\d{1,2}月\d{1,2}日|\d{4}年\d{1,2}月\d{1,2}日|\d{4}\/\d{1,2}\/\d{1,2})/g;

function noBreakDates(node) {
  if (node.type !== 'element' && node.type !== 'root') return;
  if (node.type === 'element' && ['code', 'pre', 'script', 'style', 'title'].includes(node.tagName)) return;
  const out = [];
  for (const c of node.children ?? []) {
    if (c.type === 'text' && DATE_RE.test(c.value)) {
      DATE_RE.lastIndex = 0;
      c.value.split(DATE_RE).forEach((part, k) => {
        if (!part) return;
        out.push(k % 2 ? { type: 'element', tagName: 'span', properties: { className: ['nw'] }, children: [{ type: 'text', value: part }] } : { type: 'text', value: part });
      });
    } else {
      noBreakDates(c);
      out.push(c);
    }
  }
  if (node.children) node.children = out;
}

let DRAFTS = null;
function draftSlugs() {
  if (DRAFTS) return DRAFTS;
  DRAFTS = new Set();
  const dir = path.resolve('src/content/posts');
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.md')) continue;
    const text = fs.readFileSync(path.join(dir, f), 'utf8');
    const fm = text.match(/^---\n([\s\S]*?)\n---/);
    if (!fm || !/^draft:\s*true\s*$/m.test(fm[1])) continue;
    const slug = (fm[1].match(/^slug:\s*(\S+)\s*$/m) || [])[1] || f.replace(/\.md$/, '');
    DRAFTS.add(slug);
  }
  return DRAFTS;
}

function unlinkDrafts(node) {
  const href = node.properties?.href;
  const m = typeof href === 'string' && href.match(/^\/posts\/([^/#?]+)\/?(?:[#?].*)?$/);
  if (m && draftSlugs().has(m[1])) {
    node.tagName = 'span';
    node.properties = {};
  }
}

export default function rehypeShiori() {
  return (tree) => {
    dropEmptyMemo(tree);
    wrapFigures(tree);
    noBreakDates(tree);
    walk(tree, (node) => {
      if (node.type !== 'element') return;
      if (node.tagName === 'a') unlinkDrafts(node);
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
