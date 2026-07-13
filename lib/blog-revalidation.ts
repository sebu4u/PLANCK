import "server-only"

import { revalidatePath } from "next/cache"

export function revalidateBlogPaths(post?: { slug: string; categories?: Array<{ slug: string }> }) {
  revalidatePath("/blog")
  revalidatePath("/sitemap.xml")

  if (!post) return
  revalidatePath(`/blog/${post.slug}`)
  for (const category of post.categories ?? []) {
    revalidatePath(`/blog/categorie/${category.slug}`)
  }
}
