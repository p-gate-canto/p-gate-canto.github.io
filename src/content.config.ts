import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { MID_KEYS, ALL_TAGS, TYPES, topicOwner } from './consts';

// 空欄（""）は未入力として扱う（Pages CMS で空のまま保存した場合への対応）
const blank = (v: unknown) => (v === '' || v === null ? undefined : v);
const optDate = z.preprocess(blank, z.coerce.date().optional());
const optStr = z.preprocess(blank, z.string().optional());
const TYPE_KEYS = TYPES.map((t) => t.key);

const posts = defineCollection({
  // 先頭が _ のファイルは公開されない（下書き置き場として使える）
  loader: glob({ base: './src/content/posts', pattern: '**/[^_]*.md' }),
  schema: z
    .object({
      title: z.string(),
      description: z.preprocess(blank, z.string().default('')),
      pubDate: z.coerce.date(),
      updatedDate: optDate,
      category: optStr, // 中カテゴリー（taxonomy.json の mids[].key）
      topic: optStr, // 小カテゴリー（taxonomy.json の topics[].slug）
      type: optStr, // 記事タイプ（taxonomy.json の types[].key）
      tags: z.preprocess(
        (v) => (v === null || v === '' ? [] : typeof v === 'string' ? v.split(/[,、]\s*/) : v),
        z.array(z.string()).default([]),
      ),
      // 受験生向けの記事だけに付ける：試験科目名。読者タグ（税理士・社労士・診断士受験生向け）に応じて、冒頭に「〇〇試験の「科目」で問われる内容です。」と表示する
      exam: z.preprocess(
        (v) => (v === null || v === '' || v === undefined ? [] : typeof v === 'string' ? v.split(/[,、]\s*/) : v),
        z.array(z.string()).default([]),
      ),
      lawBaseDate: optDate, // 法令の基準日
      draft: z.boolean().default(false),
    })
    // 入力ミスがあってもビルドを止めない：小カテゴリーから中カテゴリーを決め、合わないものは外す
    .transform((d) => {
      const warn = (msg: string) => console.warn(`[しおり] 「${d.title}」：${msg}`);
      const owner = topicOwner(d.topic);
      let category = d.category;
      let topic = d.topic;
      if (owner && owner !== category) {
        if (category) warn(`小カテゴリー ${topic} に合わせて中カテゴリーを ${category} → ${owner} に補正しました`);
        category = owner;
      } else if (topic && !owner) {
        warn(`小カテゴリー ${topic} は存在しないため外しました`);
        topic = undefined;
      }
      if (!category || !MID_KEYS.includes(category)) {
        warn('中カテゴリーが未設定または不正のため「考え方・理念」に入れました');
        category = 'mindset';
      }
      let type = d.type;
      if (!type || !TYPE_KEYS.includes(type)) {
        if (type) warn(`記事タイプ ${type} は存在しないため「解説」にしました`);
        type = 'explainer';
      }
      const tags = [...new Set(d.tags)].filter((t) => ALL_TAGS.includes(t) || (warn(`タグ ${t} は一覧にないため外しました`), false));
      if (tags.length > 6) warn('タグが6個を超えたため、先頭の6個だけを使います');
      return { ...d, category, topic, type, tags: tags.slice(0, 6) };
    }),
});

export const collections = { posts };
