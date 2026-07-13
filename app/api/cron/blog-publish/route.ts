import { NextRequest, NextResponse } from "next/server"
import { revalidateBlogPaths } from "@/lib/blog-revalidation"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get("authorization") === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Neautorizat." }, { status: 401 })

  try {
    const supabase = getServiceRoleSupabase()
    const now = new Date().toISOString()
    const { data: scheduledPosts, error: fetchError } = await supabase
      .from("blog_posts")
      .select("id, slug, blog_post_categories(blog_categories(slug))")
      .eq("status", "scheduled")
      .lte("published_at", now)
    if (fetchError) throw fetchError

    if (!scheduledPosts?.length) return NextResponse.json({ published: 0 })
    const { error: updateError } = await supabase
      .from("blog_posts")
      .update({ status: "published", updated_at: now })
      .in("id", scheduledPosts.map((post) => post.id))
    if (updateError) throw updateError

    for (const post of scheduledPosts) {
      const categories = ((post.blog_post_categories ?? []) as unknown as Array<{ blog_categories: { slug: string } | { slug: string }[] | null }>)
        .flatMap((item) => {
          const category = item.blog_categories
          return Array.isArray(category) ? category : category ? [category] : []
        })
        .filter((category): category is { slug: string } => Boolean(category))
      revalidateBlogPaths({ slug: post.slug, categories })
    }
    return NextResponse.json({ published: scheduledPosts.length })
  } catch (error) {
    logger.error("[cron/blog-publish] error:", error)
    return NextResponse.json({ error: "Nu am putut publica articolele programate." }, { status: 500 })
  }
}
