import type { ReactNode } from "react"
import { BlogPageShell } from "@/components/blog/blog-page-shell"
import { getPublishedBlogCategories, getPublishedBlogPosts } from "@/lib/blog"

export async function BlogContentLayout({ children }: { children: ReactNode }) {
  const [categories, posts] = await Promise.all([getPublishedBlogCategories(), getPublishedBlogPosts()])

  return (
    <BlogPageShell categories={categories} posts={posts}>
      {children}
    </BlogPageShell>
  )
}
