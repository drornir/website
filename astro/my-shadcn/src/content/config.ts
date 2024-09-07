import { defineCollection, z } from "astro:content"

const blog = defineCollection({
  type: "content",
  // Type-check frontmatter using a schema
  schema: z.object({
    title: z.string(),
    description: z.string().default(""),
    date: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    cover: z.object({
      image: z.string(),
    }),
    tags: z.array(z.string()),
  }),
})

export const collections = { blog }
