#!/usr/bin/env python3
"""公開キューの先頭から、まだ下書きの記事を N 本だけ公開設定にする。

使い方:
  python3 ops/publish.py --count 10 --date 2026-11-21           # 実行（毎朝は最大10本）
  python3 ops/publish.py --count 5 --date 2026-11-21 --dry-run  # 確認だけ（ファイルは変えない）

- 対象の記事は draft: true → false、pubDate を公開日にする
- 公開した記事は ops/published.log に「日付<TAB>slug」で追記する
- キューにあるのに記事ファイルがない、frontmatter が読めない場合はエラーで止まる
- 行頭に「保留」と書いた記事は公開しない（筆者の回答待ちなど）
- 最後に「キューの残り本数」を表示する（10本を切ったら補充が必要）
"""
import argparse
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
POSTS = ROOT / 'src' / 'content' / 'posts'
QUEUE = ROOT / 'ops' / 'publish-queue.txt'
LOG = ROOT / 'ops' / 'published.log'


def read_queue():
    """キューを読む。行頭が「保留」の記事は飛ばす（順番は残したまま、公開だけ止める）。"""
    slugs = []
    for line in QUEUE.read_text(encoding='utf-8').splitlines():
        s = line.split('#', 1)[0].strip()
        if s and not s.startswith('保留'):
            slugs.append(s)
    return slugs


def split_fm(text, path):
    m = re.match(r'^---\n(.*?)\n---\n', text, re.S)
    if not m:
        sys.exit(f'エラー：frontmatter が読めません：{path.name}')
    return m.group(1), text[m.end():]


def is_draft(fm):
    m = re.search(r'^draft:\s*(\S+)\s*$', fm, re.M)
    return bool(m and m.group(1).lower() == 'true')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--count', type=int, default=5)
    ap.add_argument('--date', required=True, help='公開日 YYYY-MM-DD（日本時間）')
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', a.date):
        sys.exit('エラー：--date は YYYY-MM-DD で指定してください')

    queue = read_queue()
    pending, missing = [], []
    for slug in queue:
        p = POSTS / f'{slug}.md'
        if not p.exists():
            missing.append(slug)
            continue
        fm, _ = split_fm(p.read_text(encoding='utf-8'), p)
        if is_draft(fm):
            pending.append(slug)
    if missing:
        sys.exit('エラー：キューにあるのに記事ファイルがありません：' + ', '.join(missing))

    targets = pending[: a.count]
    for slug in targets:
        p = POSTS / f'{slug}.md'
        fm, body = split_fm(p.read_text(encoding='utf-8'), p)
        fm2 = re.sub(r'^draft:\s*true\s*$', 'draft: false', fm, flags=re.M)
        fm2 = re.sub(r'^pubDate:.*$', f'pubDate: {a.date}', fm2, flags=re.M)
        if fm2 == fm:
            sys.exit(f'エラー：書き換えられませんでした：{slug}')
        if not a.dry_run:
            p.write_text(f'---\n{fm2}\n---\n{body}', encoding='utf-8')
        print(('（確認のみ）' if a.dry_run else '') + f'公開設定：{slug}')

    if not a.dry_run and targets:
        with LOG.open('a', encoding='utf-8') as f:
            for slug in targets:
                f.write(f'{a.date}\t{slug}\n')

    rest = len(pending) - len(targets)
    print(f'公開した本数：{len(targets)}　キューの残り：{rest}本')
    if rest < 10:
        print('注意：キューの残りが10本を切りました。下書きの補充とキューへの追加（ユーザー承認）が必要です。')


if __name__ == '__main__':
    main()
