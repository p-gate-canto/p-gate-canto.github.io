#!/usr/bin/env python3
"""段落の長さを点検する。話題の切れ目か約100字（PCで2〜3行）で区切るのが基準。
150字を超える段落と、60字未満の段落が3つ以上続く箇所（細切れ）を表示する。
使い方：python3 ops/paragraphs.py [slug ...]（指定しなければ全記事）"""
import glob, re, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
def clean(s):
    s = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', s)
    s = s.replace('**', '')
    return re.sub(r'^(結論|ポイント|注意|補足)[：:]', '', s)
files = [ROOT / f'src/content/posts/{s}.md' for s in sys.argv[1:]] or sorted((ROOT / 'src/content').glob('*/*.md'))
found = 0
for f in files:
    body = f.read_text(encoding='utf-8').split('---', 2)[2]
    run = []
    blocks = []
    for b in re.split(r'\n\s*\n', body):
        blocks += re.split(r'\n>\s*\n', b) if b.lstrip().startswith('>') else [b]
    for b in blocks + ['#']:
        b = b.strip()
        if b.startswith('>'): b = re.sub(r'^>\s?', '', b, flags=re.M)
        skip = (not b) or b[0] in '|#-!<' or re.match(r'^\d+\.', b) or b.startswith(('出典', '> 件名'))
        t = '' if skip else clean(re.sub(r'^>\s?', '', b, flags=re.M)).replace('\n', '')
        if t and len(t) > 150:
            print(f'長い　{len(t):>3}字  {f.stem}  {t[:40]}…'); found += 1
        if t and len(t) < 60:
            run.append(t); continue
        if len(run) >= 3:
            print(f'細切れ {len(run)}段落  {f.stem}  {run[0][:30]}…'); found += 1
        run = []
print('問題なし' if not found else f'{found}か所')
