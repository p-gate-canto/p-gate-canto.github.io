#!/usr/bin/env python3
"""記事が狙う検索語（ops/keywords.tsv）に、タイトル・説明文・冒頭が合っているかを点検する。

  python3 ops/seo_check.py           # 全記事
  python3 ops/seo_check.py <slug>... # 指定した記事

見ること：
  1. keywords.tsv に行があるか（新しい記事を足したら、主検索語を1行足す）
  2. 主検索語の各語が、タイトルに入っているか（最初の語はタイトルの前半＝先頭24文字以内）
  3. 主検索語の各語が、説明文に入っているか
  4. 主検索語の最初の語が、本文の冒頭（最初の400文字）に入っているか
  5. タイトルが長すぎないか（70文字超）、説明文が短すぎ・長すぎないか（60〜200文字）
比べるときは、全角・半角、中黒（・）、空白の違いを無視する。
"""
import pathlib
import re
import sys
import unicodedata

ROOT = pathlib.Path(__file__).resolve().parent.parent
POSTS = ROOT / 'src' / 'content' / 'posts'
KW = ROOT / 'ops' / 'keywords.tsv'


def norm(s):
    s = unicodedata.normalize('NFKC', s).lower()
    return re.sub(r'[・\s「」『』（）()]', '', s)


def main(argv):
    rows = {}
    for line in KW.read_text(encoding='utf-8').splitlines()[1:]:
        if line.strip():
            c = line.split('\t')
            rows[c[0]] = c[1].split()
    issues = 0
    for p in sorted(POSTS.glob('*.md')):
        if p.name.startswith('_') or (argv and p.stem not in argv):
            continue
        t = p.read_text(encoding='utf-8')
        m = re.match(r'^---\n(.*?)\n---\n(.*)$', t, re.S)
        fm, body = m.group(1), m.group(2)
        title = re.search(r'^title:\s*(.*)$', fm, re.M).group(1).strip().strip('"\'')
        desc = (re.search(r'^description:\s*(.*)$', fm, re.M) or [None, ''])[1].strip().strip('"\'')
        head = re.sub(r'[#>*|]', '', body)[:400]
        msgs = []
        kws = rows.get(p.stem)
        if not kws:
            msgs.append('keywords.tsv に主検索語がない')
        else:
            nt, nd, nh = norm(title), norm(desc), norm(head)
            for i, k in enumerate(kws):
                nk = norm(k)
                if nk not in nt:
                    msgs.append(f'タイトルに「{k}」がない')
                elif i == 0 and nt.index(nk) > 24:
                    msgs.append(f'「{k}」がタイトルの後ろのほうにある')
                if nk not in nd:
                    msgs.append(f'説明文に「{k}」がない')
            if norm(kws[0]) not in nh:
                msgs.append(f'冒頭400文字に「{kws[0]}」がない')
        if len(title) > 70:
            msgs.append(f'タイトルが長い（{len(title)}文字）')
        if not 60 <= len(desc) <= 200:
            msgs.append(f'説明文の長さ（{len(desc)}文字）')
        if msgs:
            issues += 1
            print(f'{p.stem}：' + '／'.join(msgs))
    print(f'点検した記事：{len(list(POSTS.glob("*.md")))}本、要確認：{issues}本')


if __name__ == '__main__':
    main(sys.argv[1:])
