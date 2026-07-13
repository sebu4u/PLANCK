import { createClient } from "@supabase/supabase-js"

export type BlogStatus = "draft" | "review" | "scheduled" | "published"

export type BlogCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  meta_title: string | null
  meta_description: string | null
  created_at: string
  updated_at: string
}

export type BlogFaqItem = {
  question: string
  answer: string
}

export type BlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string
  content: Record<string, unknown>
  faq_items: BlogFaqItem[]
  cover_image_url: string | null
  cover_image_alt: string | null
  meta_title: string | null
  meta_description: string | null
  canonical_path: string | null
  status: BlogStatus
  published_at: string | null
  author_id: string
  created_at: string
  updated_at: string
  categories: BlogCategory[]
}

type BlogPostRow = Omit<BlogPost, "categories"> & {
  blog_post_categories?: Array<{ blog_categories: BlogCategory | BlogCategory[] | null }> | null
}

function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

function normalizePost(row: BlogPostRow): BlogPost {
  return {
    ...row,
    categories: (row.blog_post_categories ?? []).flatMap((entry) => {
      const category = entry.blog_categories
      return Array.isArray(category) ? category : category ? [category] : []
    }),
  }
}

const POST_FIELDS =
  "id, slug, title, excerpt, content, faq_items, cover_image_url, cover_image_alt, meta_title, meta_description, canonical_path, status, published_at, author_id, created_at, updated_at, blog_post_categories(blog_categories(id, name, slug, description, meta_title, meta_description, created_at, updated_at))"

export async function getPublishedBlogPosts(limit?: number): Promise<BlogPost[]> {
  const supabase = getPublicClient()
  if (!supabase) return []

  let query = supabase
    .from("blog_posts")
    .select(POST_FIELDS)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })

  if (limit) query = query.limit(limit)
  const { data, error } = await query
  if (error) return []
  return ((data ?? []) as unknown as BlogPostRow[]).map(normalizePost)
}

export async function getPublishedBlogPost(slug: string): Promise<BlogPost | null> {
  const supabase = getPublicClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from("blog_posts")
    .select(POST_FIELDS)
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle()

  if (error || !data) return null
  return normalizePost(data as unknown as BlogPostRow)
}

export async function getPublishedBlogCategories(): Promise<BlogCategory[]> {
  const supabase = getPublicClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("blog_categories")
    .select("id, name, slug, description, meta_title, meta_description, created_at, updated_at")
    .order("name")

  return error ? [] : ((data ?? []) as BlogCategory[])
}

export async function getPublishedPostsByCategory(slug: string): Promise<{ category: BlogCategory; posts: BlogPost[] } | null> {
  const categories = await getPublishedBlogCategories()
  const category = categories.find((item) => item.slug === slug)
  if (!category) return null

  const posts = await getPublishedBlogPosts()
  return {
    category,
    posts: posts.filter((post) => post.categories.some((postCategory) => postCategory.id === category.id)),
  }
}
