#!/usr/bin/env python3
"""記事ごとのOGP画像（1200×630）をつくる。

  python3 ops/og.py            # 画像がない記事、またはタイトルが変わった記事だけつくる
  python3 ops/og.py --all      # 全記事をつくり直す
  python3 ops/og.py <slug> ... # 指定した記事だけつくる

出力：public/og/<slug>.png（記事ページの og:image と構造化データの image に使われる）
デザイン：黒地、左上に黄→緑のしおりとサイト名、分野名、タイトル（文節で改行）、下端に黄→緑の線。URLは入れない。
必要なもの：Pillow、budoux（pip install budoux --break-system-packages）、Noto Sans CJK
"""
import hashlib
import json
import pathlib
import re
import sys

import budoux
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
POSTS = ROOT / 'src' / 'content' / 'posts'
OUT = ROOT / 'public' / 'og'
TAX = json.loads((ROOT / 'src' / 'data' / 'taxonomy.json').read_text(encoding='utf-8'))
SITE = json.loads((ROOT / 'src' / 'data' / 'site.json').read_text(encoding='utf-8'))

W, H = 1200, 630
PAD = 80
BLACK = (22, 22, 29)
WHITE = (255, 255, 255)
SUB = (185, 185, 195)
YELLOW = (255, 230, 0)
GREEN = (134, 188, 37)
FONT_DIR = pathlib.Path('/usr/share/fonts/opentype/noto')
PARSER = budoux.load_default_japanese_parser()
VERSION = 'og-v3'  # デザインを変えたら上げる（全記事つくり直しの目印）


def font(weight, size, family='Sans'):
    # family：Sans（ゴシック）／Serif（明朝。サイトの見出しと同じ）。index 0 = JP
    return ImageFont.truetype(str(FONT_DIR / f'Noto{family}CJK-{weight}.ttc'), size, index=0)


def front(text):
    m = re.match(r'^---\n(.*?)\n---\n', text, re.S)
    fm = m.group(1) if m else ''
    get = lambda k: (re.search(rf'^{k}:\s*(.*)$', fm, re.M) or [None, ''])[1].strip().strip('"\'')
    return {'title': get('title'), 'category': get('category'), 'topic': get('topic')}


def label_of(category, topic):
    mids = {m['key']: m for m in TAX['mids']}
    owner = next((m['key'] for m in TAX['mids'] for t in m['topics'] if t['slug'] == topic), None)
    mid = mids.get(owner or category)
    if not mid:
        return ''
    pillar = next((p for p in TAX['pillars'] if p['key'] == mid['pillar']), None)
    en = (pillar or {}).get('en', mid['pillar'].upper())
    return f'{en}　{mid["label"]}'


def phrases(text):
    """文節に分ける。「｜」「／」と閉じかっこ・句読点は前につなげ、2文字以下の文節も前につなげる。"""
    out = []
    for p in PARSER.parse(text):
        if out and (len(p) <= 2 or p[0] in '｜／、。，．）」』】？！・ー'):
            out[-1] += p
        else:
            out.append(p)
    return out


def wrap(text, f, width, max_lines):
    """文節の単位で折り返す。最後の行が短すぎる（4文字未満）ときは、行の長さが揃うよう幅を詰めて組み直す。"""
    def greedy(w):
        lines, cur = [], ''
        for p in phrases(text):
            if cur and f.getlength(cur + p) > w:
                lines.append(cur)
                cur = p
            else:
                cur += p
        if cur:
            lines.append(cur)
        return lines

    lines = greedy(width)
    if len(lines) >= 2 and len(lines[-1]) < 4:
        for w in range(int(width) - 20, int(width * 0.55), -20):
            alt = greedy(w)
            if len(alt) == len(lines) and len(alt[-1]) >= 4:
                lines = alt
                break
    return lines if len(lines) <= max_lines else None


def gradient(size, horizontal=True):
    w, h = size
    g = Image.new('RGB', size)
    d = ImageDraw.Draw(g)
    n = w if horizontal else h
    for i in range(n):
        t = i / max(n - 1, 1)
        # 黄7割・緑3割：0〜0.7は黄、0.7〜1で緑へ
        k = 0 if t < 0.55 else min(1, (t - 0.55) / 0.45)
        c = tuple(round(YELLOW[j] + (GREEN[j] - YELLOW[j]) * k) for j in range(3))
        if horizontal:
            d.line([(i, 0), (i, h)], fill=c)
        else:
            d.line([(0, i), (w, i)], fill=c)
    return g


def bookmark(img, x, y, w=24, h=48):
    g = gradient((w, h), horizontal=False)
    mask = Image.new('L', (w, h), 0)
    ImageDraw.Draw(mask).polygon([(0, 0), (w, 0), (w, h), (w / 2, h * 0.78), (0, h)], fill=255)
    img.paste(g, (x, y), mask)


def render(meta, out):
    img = Image.new('RGB', (W, H), BLACK)
    d = ImageDraw.Draw(img)
    bookmark(img, PAD, 64)
    d.text((PAD + 40, 66), SITE.get('title', '税理士のしおり'), font=font('SemiBold', 30, 'Serif'), fill=WHITE)
    lab = label_of(meta['category'], meta['topic'])
    if lab:
        d.text((PAD, 150), lab, font=font('Bold', 26), fill=YELLOW)

    title = meta['title']
    main, sub = (title.split('｜', 1) + [''])[:2]
    width = W - PAD * 2
    for size in (64, 58, 52, 46, 42):
        fm = font('SemiBold', size, 'Serif')
        lines = wrap(main, fm, width, 3)
        if lines:
            break
    else:
        lines = wrap(main, fm, width, 4) or [main]
    lh = int(size * 1.42)
    fs = font('Medium', 30)
    sl = []
    if sub:
        sl = wrap(sub, fs, width, 2) or []
        if not sl:
            fs = font('Medium', 26)
            sl = wrap(sub, fs, width, 2) or []
    block = len(lines) * lh + (18 + len(sl) * 44 if sl else 0)
    top, bottom = 205, H - 60
    y = top + max(0, (bottom - top - block) // 2)
    for ln in lines:
        # 行頭の始めかっこは半角分だけ左に出して、文字の頭をそろえる
        x = PAD - (size // 2 if ln[:1] in '「（【『' else 0)
        d.text((x, y), ln, font=fm, fill=WHITE)
        y += lh
    if sl:
        y += 18
        for ln in sl:
            d.text((PAD - (15 if ln[:1] in '「（【『' else 0), y), ln, font=fs, fill=SUB)
            y += 44
    img.paste(gradient((W, 8)), (0, H - 8))
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, optimize=True)


def main(argv):
    allmode = '--all' in argv
    only = [a for a in argv if not a.startswith('--')]
    stamp_file = OUT / '.stamps.json'
    stamps = json.loads(stamp_file.read_text()) if stamp_file.exists() else {}
    made = 0
    for p in sorted(POSTS.glob('*.md')):
        if p.name.startswith('_'):
            continue
        slug = p.stem
        if only and slug not in only:
            continue
        meta = front(p.read_text(encoding='utf-8'))
        key = hashlib.sha1((VERSION + meta['title'] + meta['category'] + meta['topic']).encode()).hexdigest()[:12]
        out = OUT / f'{slug}.png'
        if not allmode and not only and out.exists() and stamps.get(slug) == key:
            continue
        render(meta, out)
        stamps[slug] = key
        made += 1
    stamp_file.write_text(json.dumps(stamps, ensure_ascii=False, indent=1, sort_keys=True))
    print(f'OGP画像：{made}枚をつくりました（public/og/）')


if __name__ == '__main__':
    main(sys.argv[1:])
