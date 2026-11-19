import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIES, CATEGORY_KEYS, type CategoryKey } from './consts';

// 空欄（""）は未入力として扱う（Pages CMS で空のまま保存した場合への対応）
const optDate = z.preprocess((v) => (v === '' || v === null ? undefined : v), z.coerce.date().optional());
const optStr = z.preprocess((v) => (v === '' || v === null ? undefined : v), z.string().optional());

const posts = defineCollection({
  // 先頭が _ のファイルは公開されない（下書き置き場として使える）
  loader: glob({ base: './src/content/posts', pattern: '**/[^_]*.md' }),
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: optDate,
      category: z.enum(CATEGORY_KEYS as [CategoryKey, ...CategoryKey[]]),
      topic: optStr, // 小項目（consts.ts の slug）
      tags: z.preprocess((v) => (v === null ? [] : v), z.array(z.string()).default([])),
      lawBaseDate: optDate, // 法令の基準日
      draft: z.boolean().default(false),
    })
    .refine(
      (d) => !d.topic || CATEGORIES[d.category].topics.some((x: { slug: string }) => x.slug === d.topic),
      { message: 'topic が category の小項目にありません（src/consts.ts を確認）', path: ['topic'] },
    ),
});

export const collections = { posts };
