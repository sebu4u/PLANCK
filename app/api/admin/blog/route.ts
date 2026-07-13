import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAccessTokenFromRequest, isAdminFromDB } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { revalidateBlogPaths } from "@/lib/blog-revalidation"
import { slugify } from "@/lib/slug"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"
import { logger } from "@/lib/logger"

const faqSchema = z.object({
  question: z.string().trim().min(1).max(300),
  answer: z.string().trim().min(1).max(5000),
})

const postSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().max(180).optional(),
  title: z.string().trim().min(3).max(180),
  excerpt: z.string().trim().min(1, "Rezumatul este obligatoriu.").max(320),
  content: z.record(z.string(), z.unknown()),
  faq_items: z.array(faqSchema).max(20).default([]),
  cover_image_url: z.string().url().nullable().optional(),
  cover_image_alt: z.string().trim().max(300).nullable().optional(),
  meta_title: z.string().trim().max(60).nullable().optional(),
  meta_description: z.string().trim().max(160).nullable().optional(),
  canonical_path: z.string().trim().regex(/^\/blog\/[a-z0-9-]+$/).nullable().optional(),
  status: z.enum(["draft", "review", "scheduled", "published"]),
  published_at: z.string().datetime().nullable().optional(),
  category_ids: z.array(z.string().uuid()).min(1),
})

const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().max(100).optional(),
  description: z.string().trim().max(320).nullable().optional(),
  meta_title: z.string().trim().max(60).nullable().optional(),
  meta_description: z.string().trim().max(160).nullable().optional(),
})

async function verifyAdmin(req: NextRequest) {
  const token = getAccessTokenFromRequest(req.headers.get("authorization"))
  if (!token) return { error: NextResponse.json({ error: "Necesită autentificare." }, { status: 401 }) }
  if (isJwtExpired(token)) return { error: NextResponse.json({ error: "Sesiune expirată." }, { status: 401 }) }

  const client = createServerClientWithToken(token)
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) return { error: NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 }) }
  if (!(await isAdminFromDB(client, data.user))) {
    return { error: NextResponse.json({ error: "Acces interzis. Doar adminii pot administra blogul." }, { status: 403 }) }
  }
  return { user: data.user }
}

function normalizedSlug(value: string | undefined, fallback: string) {
  return slugify(value || fallback)
}

function publishedAtFor(status: z.infer<typeof postSchema>["status"], value: string | null | undefined) {
  if (status === "published") return value ?? new Date().toISOString()
  if (status === "scheduled") return value ?? null
  return value ?? null
}

async function getPostCategories(postId: string) {
  const supabase = getServiceRoleSupabase()
  const { data } = await supabase
    .from("blog_post_categories")
    .select("blog_categories(slug)")
    .eq("post_id", postId)
  return (data ?? [])
    .flatMap((row) => {
      const category = (row as unknown as { blog_categories: { slug: string } | { slug: string }[] | null }).blog_categories
      return Array.isArray(category) ? category : category ? [category] : []
    })
    .filter((category): category is { slug: string } => Boolean(category))
}

export async function GET(req: NextRequest) {
  const auth = await verifyAdmin(req)
  if ("error" in auth) return auth.error

  try {
    const supabase = getServiceRoleSupabase()
    const [categoriesResult, postsResult] = await Promise.all([
      supabase.from("blog_categories").select("*").order("name"),
      supabase
        .from("blog_posts")
        .select("*, blog_post_categories(category_id)")
        .order("updated_at", { ascending: false }),
    ])
    if (categoriesResult.error || postsResult.error) throw categoriesResult.error ?? postsResult.error
    return NextResponse.json({ categories: categoriesResult.data ?? [], posts: postsResult.data ?? [] })
  } catch (error) {
    logger.error("[admin/blog] GET error:", error)
    return NextResponse.json({ error: "Nu am putut încărca blogul." }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdmin(req)
  if ("error" in auth) return auth.error

  try {
    const body = await req.json()
    const type = body?.type
    const supabase = getServiceRoleSupabase()

    if (type === "category") {
      const input = categorySchema.parse(body)
      const { data, error } = await supabase
        .from("blog_categories")
        .insert({
          name: input.name,
          slug: normalizedSlug(input.slug, input.name),
          description: input.description ?? null,
          meta_title: input.meta_title ?? null,
          meta_description: input.meta_description ?? null,
        })
        .select()
        .single()
      if (error) throw error
      revalidateBlogPaths()
      return NextResponse.json({ category: data }, { status: 201 })
    }

    if (type !== "post") return NextResponse.json({ error: "Tip de conținut invalid." }, { status: 400 })
    const input = postSchema.parse(body)
    if (input.status === "scheduled" && !input.published_at) {
      return NextResponse.json({ error: "Alege data programată pentru publicare." }, { status: 400 })
    }
    if ((input.status === "published" || input.status === "scheduled") && input.excerpt.length < 20) {
      return NextResponse.json({ error: "Rezumatul trebuie să aibă cel puțin 20 de caractere înainte de publicare." }, { status: 400 })
    }
    const publishAt = publishedAtFor(input.status, input.published_at)
    const { data: post, error } = await supabase
      .from("blog_posts")
      .insert({
        slug: normalizedSlug(input.slug, input.title),
        title: input.title,
        excerpt: input.excerpt,
        content: input.content,
        faq_items: input.faq_items,
        cover_image_url: input.cover_image_url ?? null,
        cover_image_alt: input.cover_image_alt ?? null,
        meta_title: input.meta_title ?? null,
        meta_description: input.meta_description ?? null,
        canonical_path: input.canonical_path ?? null,
        status: input.status,
        published_at: publishAt,
        author_id: auth.user.id,
      })
      .select()
      .single()
    if (error) throw error

    const { error: categoryError } = await supabase
      .from("blog_post_categories")
      .insert(input.category_ids.map((category_id) => ({ post_id: post.id, category_id })))
    if (categoryError) throw categoryError
    revalidateBlogPaths({ slug: post.slug, categories: await getPostCategories(post.id) })
    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Date invalide." }, { status: 400 })
    }
    logger.error("[admin/blog] POST error:", error)
    return NextResponse.json({ error: "Nu am putut salva conținutul." }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const auth = await verifyAdmin(req)
  if ("error" in auth) return auth.error

  try {
    const body = await req.json()
    const type = body?.type
    const supabase = getServiceRoleSupabase()

    if (type === "category") {
      const input = categorySchema.extend({ id: z.string().uuid() }).parse(body)
      const { data, error } = await supabase
        .from("blog_categories")
        .update({
          name: input.name,
          slug: normalizedSlug(input.slug, input.name),
          description: input.description ?? null,
          meta_title: input.meta_title ?? null,
          meta_description: input.meta_description ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .select()
        .single()
      if (error) throw error
      revalidateBlogPaths()
      return NextResponse.json({ category: data })
    }

    if (type !== "post") return NextResponse.json({ error: "Tip de conținut invalid." }, { status: 400 })
    const input = postSchema.extend({ id: z.string().uuid() }).parse(body)
    if (input.status === "scheduled" && !input.published_at) {
      return NextResponse.json({ error: "Alege data programată pentru publicare." }, { status: 400 })
    }
    if ((input.status === "published" || input.status === "scheduled") && input.excerpt.length < 20) {
      return NextResponse.json({ error: "Rezumatul trebuie să aibă cel puțin 20 de caractere înainte de publicare." }, { status: 400 })
    }
    const previousCategories = await getPostCategories(input.id)
    const { data: post, error } = await supabase
      .from("blog_posts")
      .update({
        slug: normalizedSlug(input.slug, input.title),
        title: input.title,
        excerpt: input.excerpt,
        content: input.content,
        faq_items: input.faq_items,
        cover_image_url: input.cover_image_url ?? null,
        cover_image_alt: input.cover_image_alt ?? null,
        meta_title: input.meta_title ?? null,
        meta_description: input.meta_description ?? null,
        canonical_path: input.canonical_path ?? null,
        status: input.status,
        published_at: publishedAtFor(input.status, input.published_at),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .select()
      .single()
    if (error) throw error

    const { error: deleteError } = await supabase.from("blog_post_categories").delete().eq("post_id", post.id)
    if (deleteError) throw deleteError
    const { error: categoryError } = await supabase
      .from("blog_post_categories")
      .insert(input.category_ids.map((category_id) => ({ post_id: post.id, category_id })))
    if (categoryError) throw categoryError
    revalidateBlogPaths({ slug: post.slug, categories: [...previousCategories, ...(await getPostCategories(post.id))] })
    return NextResponse.json({ post })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Date invalide." }, { status: 400 })
    }
    logger.error("[admin/blog] PUT error:", error)
    return NextResponse.json({ error: "Nu am putut actualiza conținutul." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await verifyAdmin(req)
  if ("error" in auth) return auth.error

  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")
    const id = searchParams.get("id")
    if (!id || (type !== "post" && type !== "category")) {
      return NextResponse.json({ error: "type și id sunt obligatorii." }, { status: 400 })
    }
    const supabase = getServiceRoleSupabase()
    const table = type === "post" ? "blog_posts" : "blog_categories"
    let revalidateOptions: { slug?: string; categories?: Array<{ slug: string }> } | undefined
    if (type === "post") {
      const { data: post } = await supabase.from("blog_posts").select("slug").eq("id", id).maybeSingle()
      if (post) {
        revalidateOptions = { slug: post.slug, categories: await getPostCategories(id) }
      }
    }
    const { error } = await supabase.from(table).delete().eq("id", id)
    if (error) throw error
    revalidateBlogPaths(revalidateOptions)
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("[admin/blog] DELETE error:", error)
    return NextResponse.json({ error: "Nu am putut șterge conținutul." }, { status: 500 })
  }
}
