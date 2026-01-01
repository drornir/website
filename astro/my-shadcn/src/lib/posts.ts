import { getCollection } from "astro:content"

export async function getPosts({ tag }: { tag?: string } = {}) {
  return await getCollection("blog").then((posts) =>
    posts
      .filter(({ data }) => (tag ? data.tags.includes(tag) : true))
      .filter(({ data }) => import.meta.env.DEV || !data.draft)
      .sort((a, b) => {
        const ad = a.data.updatedDate ?? a.data.date
        const bd = b.data.updatedDate ?? b.data.date
        return bd.valueOf() - ad.valueOf()
      }),
  )
}

export async function getTags() {
  const posts = await getPosts()
  const tags = posts.flatMap((post) => post.data.tags)
  return [...new Set(tags)].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase(), "en", { sensitivity: "base" }))
}
