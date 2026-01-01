import { getCollection } from "astro:content"

export async function getPosts() {
  return await getCollection("blog").then((posts) =>
    posts
      .filter(({ data }) => import.meta.env.DEV || !data.draft)
      .sort((a, b) => {
        const ad = a.data.updatedDate ?? a.data.date
        const bd = b.data.updatedDate ?? b.data.date
        return bd.valueOf() - ad.valueOf()
      }),
  )
}
