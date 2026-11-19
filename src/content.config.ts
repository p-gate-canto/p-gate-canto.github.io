import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIES, CATEGORY_KEYS, type CategoryKey } from './consts';

const posts = defineCollection({
  // 先頭が _ のファイルは公開されない（下書き置き場として使える）
  loader: glob({ base: './src/content/posts', pattern: '**/[^_]*.md' }),
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      category: z.enum(CATEGORY_KEYS as [CategoryKey, ...CategoryKey[]]),
      topic: z.string().optional(), // 小項目（consts.ts の slug）
      tags: z.array(z.string()).default([]),
      lawBaseDate: z.coerce.date().optional(), // 法令の基準日
      draft: z.boolean().default(false),
    })
    .refine(
      (d) => !d.topic || CATEGORIES[d.category].topics.some((x: { slug: string }) => x.slug === d.topic),
      { message: 'topic が category の小項目にありません（src/consts.ts を確認）', path: ['topic'] },
    ),
});

export const collections = { posts };
