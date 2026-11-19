import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  // 先頭が _ のファイルは公開されない（下書き置き場として使える）
  loader: glob({ base: './src/content/posts', pattern: '**/[^_]*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.enum(['tax', 'labor', 'management', 'work', 'tools']),
    tags: z.array(z.string()).default([]),
    lawBaseDate: z.coerce.date().optional(), // 法令の基準日（税務・労務記事で記入）
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
