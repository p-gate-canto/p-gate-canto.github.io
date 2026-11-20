#!/usr/bin/env python3
"""記事の「AIが書いたように見えるリスク」を簡易に点数化する（目安。100点満点、高いほどリスクが高い）。

使い方:
  python3 ops/ai_risk.py                 # 公開キューの残りを点検
  python3 ops/ai_risk.py slug1 slug2     # 指定した記事を点検
  python3 ops/ai_risk.py --all           # 全記事を点検

見ているもの（どれも「AIっぽさ」の典型的な手がかり。機械的な判定なので、最後は人が読んで判断する）
  1. 定型句：「〜を整理します」「〜が大切です」「〜しましょう」など、どの記事にも出てくる言い回し
  2. 文末の単調さ：「です。」「ます。」が何文も続き、言い切り・問いかけ・体言止めがない
  3. 箇条書きと表の多さ：本文の地の文が少なく、表と箇条書きで埋まっている
  4. 筆者の経験の不在：「筆者」「私」「顧問先」「現場では」「相談を受け」など、一次経験を示す言葉がない
  5. 実務メモが未記入
  6. 見出しの型がほかの記事とほぼ同じ（テンプレートの量産に見える）
"""
import collections
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
POSTS = ROOT / 'src' / 'content' / 'posts'
QUEUE = ROOT / 'ops' / 'publish-queue.txt'

STOCK = ['整理します', '解説します', '紹介します', 'しましょう', 'が大切です', 'ことが大切', 'が重要です', 'ことが重要',
         '注意が必要', 'と言えるでしょう', 'でしょう。', 'いかがでしたか', 'さまざまな', '効果的', '不可欠', '欠かせません',
         'ことができます', '可能性があります', 'ことがあります', 'おすすめです', '押さえておき', 'まとめると', 'ひとことで言うと']
EXPERIENCE = ['筆者', '私は', '私が', '私の', '顧問先', '現場では', '相談を受け', '相談される', '経験上', '実際に見た', 'よく聞かれ']


def body_of(text):
    m = re.match(r'^---\n.*?\n---\n', text, re.S)
    return text[m.end():] if m else text


def analyze(slug, skeleton_counts):
    text = (POSTS / f'{slug}.md').read_text(encoding='utf-8')
    body = body_of(text)
    lines = [l for l in body.splitlines() if l.strip()]
    prose = [l for l in lines if not re.match(r'^(\||#|>|- |\d+\. |!\[|出典：)', l.strip())]
    prose_text = ''.join(prose)
    chars = max(len(re.sub(r'\s', '', body)), 1)
    reasons, score = [], 0

    stock = sum(body.count(p) for p in STOCK)
    per1k = stock / chars * 1000
    s1 = min(25, per1k * 5)
    score += s1
    if s1 >= 10:
        reasons.append(f'定型句が多い（{stock}回）')

    sents = [s for s in re.split(r'(?<=。)', prose_text) if s.strip()]
    ends = [s.strip()[-3:] for s in sents]
    if sents:
        desu_masu = sum(e.endswith(('です。', 'ます。', 'した。', 'せん。')) for e in ends) / len(sents)
        run, maxrun = 1, 1
        for a, b in zip(ends, ends[1:]):
            run = run + 1 if a == b else 1
            maxrun = max(maxrun, run)
        s2 = max(0, (desu_masu - 0.80) * 75) + max(0, maxrun - 3) * 2
        s2 = min(15, s2)
        score += s2
        if s2 >= 8:
            reasons.append(f'文末が単調（です・ます率{desu_masu:.0%}' + (f'、同じ文末が{maxrun}回連続）' if maxrun >= 3 else '）'))

    struct = sum(1 for l in lines if re.match(r'^(\||- |\d+\. )', l.strip()))
    ratio = struct / max(len(lines), 1)
    s3 = min(20, max(0, (ratio - 0.35) * 60))
    score += s3
    if s3 >= 8:
        reasons.append(f'表と箇条書きが多い（全行の{ratio:.0%}）')

    exp = sum(body.count(w) for w in EXPERIENCE)
    s4 = 20 if exp == 0 else (10 if exp <= 2 else 0)
    score += s4
    if s4:
        reasons.append('筆者の経験・意見が見えない' if exp == 0 else '筆者の経験・意見が少ない')

    if '筆者記入欄' in body:
        score += 10
        reasons.append('実務メモが未記入')

    sk = tuple(re.findall(r'^## (.+)$', body, re.M))
    same = skeleton_counts.get(frozenset(sk), 0)
    if same >= 5:
        score += 10
        reasons.append(f'見出しの型がほかの記事とほぼ同じ（{same}本）')

    level = '高' if score >= 60 else ('中' if score >= 40 else '低')
    return round(score), level, reasons


def skeletons():
    c = collections.Counter()
    for p in POSTS.glob('*.md'):
        sk = re.findall(r'^## (.+)$', body_of(p.read_text(encoding='utf-8')), re.M)
        # 固有の見出しを除いた「型」で数える
        generic = frozenset(h for h in sk if h in ('結論', '比較表', '実務での使い方', '試験対策のポイント', 'よくある誤解', 'よくある間違い', '実務メモ', 'ひとことで言うと', '参考資料'))
        c[generic] += 1
    return c


def main():
    args = sys.argv[1:]
    if args == ['--all']:
        slugs = sorted(p.stem for p in POSTS.glob('*.md'))
    elif args:
        slugs = args
    else:
        slugs = []
        for line in QUEUE.read_text(encoding='utf-8').splitlines():
            s = line.split('#', 1)[0].strip()
            s = s[len('保留'):].strip() if s.startswith('保留') else s
            if s and re.search(r'^draft:\s*true', (POSTS / f'{s}.md').read_text(encoding='utf-8'), re.M):
                slugs.append(s)
    sk = skeletons()
    # 見出しの型の比較は「型」の見出しだけで行う
    def generic_key(slug):
        heads = re.findall(r'^## (.+)$', body_of((POSTS / f'{slug}.md').read_text(encoding='utf-8')), re.M)
        return frozenset(h for h in heads if h in ('結論', '比較表', '実務での使い方', '試験対策のポイント', 'よくある誤解', 'よくある間違い', '実務メモ', 'ひとことで言うと', '参考資料'))
    rows = []
    for s in slugs:
        score, level, reasons = analyze(s, {frozenset(re.findall(r'^## (.+)$', body_of((POSTS / f'{s}.md').read_text(encoding='utf-8')), re.M)): sk[generic_key(s)] - 1})
        rows.append((score, level, s, reasons))
    for score, level, s, reasons in sorted(rows, reverse=True):
        print(f'{level} {score:3d}  {s}　' + '／'.join(reasons))


if __name__ == '__main__':
    main()
