import { defineCollection, z } from "astro:content"

export const blogPostDataZodSchema = z.object({
  title: z.string(),
  description: z.string().default(""),
  date: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  cover: z.object({
    image: z.string(),
    caption: z.string().optional(),
    alt: z.string().optional(),
  }),
  tags: z.array(z.string()),
  draft: z.boolean().optional(),
})

export type BlogPostData = z.infer<typeof blogPostDataZodSchema>

const blog = defineCollection({
  type: "content",
  // Type-check frontmatter using a schema
  schema: blogPostDataZodSchema,
})

export const collections = { blog }
