#!/usr/bin/env python3
"""ビルド後の dist を使って、公開前の表示チェックをする。

使い方:  npm run build && python3 ops/check.py
- dist を一時サーバーで配信し、全ページ種類と全記事・全下書きを PC（1280px）とスマホ（390px）で開く
- 横スクロール、表のはみ出し、記事本文の画像ファイルの有無、記事へのリンク切れ、ページの読み込み失敗を調べる
- 問題が1つでもあれば終了コード1で止まる
必要なもの: pip install playwright（ブラウザは /usr/bin/google-chrome、なければ playwright 同梱の chromium）
"""
import functools
import http.server
import os
import pathlib
import sys
import threading
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'


def pages():
    fixed = ['/', '/posts/', '/types/', '/tags/', '/search/', '/about/', '/drafts/', '/404.html']
    out = list(fixed)
    for d in ('posts', 'drafts', 'types', 'tags'):
        base = DIST / d
        if base.is_dir():
            for sub in sorted(base.iterdir()):
                if (sub / 'index.html').exists():
                    out.append(f'/{d}/{sub.name}/')
    # 柱・分野・小カテゴリーは、トップ直下のディレクトリから代表を拾う
    for sub in sorted(DIST.iterdir()):
        if sub.is_dir() and sub.name not in ('posts', 'drafts', 'types', 'tags', 'search', 'about', 'figures', '_astro', 'pagefind') and (sub / 'index.html').exists():
            out.append(f'/{sub.name}/')
            for mid in sorted(p for p in sub.iterdir() if (p / 'index.html').exists())[:3]:
                out.append(f'/{sub.name}/{mid.name}/')
                for top in sorted(p for p in mid.iterdir() if (p / 'index.html').exists())[:1]:
                    out.append(f'/{sub.name}/{mid.name}/{top.name}/')
    return list(dict.fromkeys(out))


def main():
    if not DIST.is_dir():
        sys.exit('エラー：dist がありません。先に npm run build を実行してください')
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a, **k):
            pass
    handler = functools.partial(Quiet, directory=str(DIST))
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()

    from playwright.sync_api import sync_playwright
    exe = '/usr/bin/google-chrome' if os.path.exists('/usr/bin/google-chrome') else None
    problems = []
    urls = pages()
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=exe) if exe else p.chromium.launch()
        for w in (1280, 390):
            pg = b.new_page(viewport={'width': w, 'height': 900})
            for u in urls:
                r = pg.goto(f'http://127.0.0.1:{port}' + urllib.parse.quote(u))
                if r is None or (r.status >= 400 and u != '/404.html'):
                    problems.append(f'{w}px {u}：読み込み失敗（{r.status if r else "応答なし"}）')
                    continue
                v = pg.evaluate("""() => [
                  document.documentElement.scrollWidth > innerWidth,
                  [...document.querySelectorAll('.prose table')].filter(t => t.scrollWidth - t.clientWidth > 2).length,
                  [...document.querySelectorAll('.prose img')].map(i => i.getAttribute('src')),
                  [...document.querySelectorAll('a[href^="/posts/"]')].map(a => a.getAttribute('href'))
                ]""")
                if v[0]:
                    problems.append(f'{w}px {u}：横スクロールが出ている')
                if v[1]:
                    problems.append(f'{w}px {u}：はみ出している表が{v[1]}個')
                dead = sorted({h for h in v[3] if not (DIST / urllib.parse.unquote(h.split('#')[0]).lstrip('/') / 'index.html').exists()})
                if dead and w == 1280 and not u.startswith('/drafts/'):  # 下書きプレビューは対象外
                    problems.append(f'{u}：リンク先の記事がない（未公開・削除）{dead}')
                broken = [s for s in v[2] if s and s.startswith('/') and not (DIST / urllib.parse.unquote(s).lstrip('/')).exists()]
                if broken:
                    problems.append(f'{w}px {u}：画像ファイルがない {broken}')
        b.close()
    srv.shutdown()
    print(f'確認したページ：{len(urls)}（PC・スマホ）')
    if problems:
        print('問題あり：')
        for x in problems:
            print(' - ' + x)
        sys.exit(1)
    print('問題なし')


if __name__ == '__main__':
    main()
