# 税理士のしおり

公開URL：https://p-gate-canto.github.io/

## 記事の書き方（GitHubの画面だけで完結）

1. GitHubで `p-gate-canto/p-gate-canto.github.io` を開く
2. `src/content/posts` フォルダを開き、「Add file」→「Create new file」
3. ファイル名を `英数字とハイフン.md` にする（例：`invoice-basics.md`）。これが記事のURLになる
4. `templates/template.md` の中身を貼り付けて書き換える
5. `draft: false` にして「Commit changes」を押す
6. 1〜2分で自動的にサイトに反映される（進み具合は「Actions」タブで確認できる）

### ルール

| 項目 | 書き方 |
|---|---|
| 段落 | 1段落を1行で書く。途中で改行すると、表示時に余計なすき間が入る |
| 段落の区切り | 空行を1つ入れる |
| 見出し | `## 大見出し`、`### 小見出し` |
| 表 | `\| 項目 \| 内容 \|` の形式 |
| 下書き | `draft: true` のままにするか、ファイル名の先頭に `_` を付ける |
| 法令の基準日 | 税務・労務の記事は `lawBaseDate` を必ず書く（記事の冒頭に表示される） |

### 分野（category に書く値）

| 柱 | 値 |
|---|---|
| 仕事 | strategy / finance / tax / bizdev / ma / marketing / hr / dx / risk |
| 学び | study |
| 自己管理 | self |
| ツール | tools |

項目（topic）の値は `src/consts.ts` を参照。ブラウザで編集する場合は https://app.pagescms.org からプルダウンで選べる。

## ツールを載せる

1. HTMLツールを `public/tools/フォルダ名/index.html` に置く
2. `src/pages/tools/index.astro` の `tools` に1行追加する

## ファイル構成

| 場所 | 中身 |
|---|---|
| src/content/posts/ | 記事（.md） |
| templates/ | 記事テンプレート |
| public/tools/ | 自作ツール |
| src/consts.ts | サイト名・キャッチコピー・カテゴリ |
| src/styles/global.css | デザイン（色・文字） |
| .github/workflows/deploy.yml | 自動公開の設定（触らない） |
