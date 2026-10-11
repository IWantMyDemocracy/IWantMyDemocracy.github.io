import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Fields written by the online editor (Pages CMS) can come back empty or missing,
// so every optional value is forgiving here and cleaned up in src/lib/catalog.ts.
const text = z.string().nullish().transform((v) => (v ?? '').trim());
const flag = z.boolean().nullish().transform((v) => v ?? false);

const causes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/causes' }),
  schema: z.object({
    name: z.string(),
    description: text,
    order: z.coerce.number().nullish().transform((v) => v ?? 100),
    cover: text,
    redbubbleCollection: text,
    teepublicAlbum: text,
    hidden: flag,
  }),
});

const designs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/designs' }),
  schema: z.object({
    title: z.string(),
    image: z.string(),
    causes: z
      .union([z.array(z.string()), z.string()])
      .nullish()
      .transform((v) => (v == null ? [] : Array.isArray(v) ? v : [v])),
    redbubbleUrl: text,
    teepublicUrl: text,
    description: text,
    featured: flag,
    hidden: flag,
    position: z.coerce.number().nullish(),
    dateAdded: z.coerce.date().nullish(),
    colorways: z
      .array(
        z.object({
          name: text,
          image: text,
          redbubbleUrl: text,
          teepublicUrl: text,
        })
      )
      .nullish()
      .transform((v) => v ?? []),
  }),
});

export const collections = { causes, designs };
