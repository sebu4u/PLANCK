import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { BlogContentLayout } from "@/components/blog/blog-content-layout"
import { RichTextContent } from "@/components/blog/rich-text-content"
import { LatexRichText } from "@/components/classrooms/latex-rich-text"
import { StructuredData } from "@/components/structured-data"
import { getPublishedBlogPost, getPublishedBlogPosts } from "@/lib/blog"
import { dynamicTitleSegment } from "@/lib/metadata"
import { PLATFORM_SITE_URL } from "@/lib/platform-marketing"
import { articleStructuredData, breadcrumbStructuredData, faqStructuredData } from "@/lib/structured-data"

export const revalidate = 3600

export async function generateStaticParams() {
  const posts = await getPublishedBlogPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedBlogPost(slug)
  if (!post) return { robots: { index: false, follow: false } }

  const titleSegment = dynamicTitleSegment(post.meta_title || post.title)
  const description = post.meta_description || post.excerpt
  const canonical = post.canonical_path || `/blog/${post.slug}`
  const image = post.cover_image_url || undefined
  return {
    title: titleSegment,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: titleSegment,
      description,
      url: `${PLATFORM_SITE_URL}${canonical}`,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      authors: ["Planck Academy"],
      images: image ? [{ url: image, alt: post.cover_image_alt || post.title }] : undefined,
    },
    twitter: { card: "summary_large_image", title: titleSegment, description, images: image ? [image] : undefined },
  }
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPublishedBlogPost(slug)
  if (!post) notFound()

  const primaryCategory = post.categories[0]
  const canonical = post.canonical_path || `/blog/${post.slug}`
  const publishedDate = post.published_at
    ? new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long", year: "numeric" }).format(new Date(post.published_at))
    : null
  const breadcrumbs = [
    { name: "Acasă", url: PLATFORM_SITE_URL },
    { name: "Blog", url: `${PLATFORM_SITE_URL}/blog` },
    ...(primaryCategory ? [{ name: primaryCategory.name, url: `${PLATFORM_SITE_URL}/blog/categorie/${primaryCategory.slug}` }] : []),
    { name: post.title, url: `${PLATFORM_SITE_URL}${canonical}` },
  ]

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navigation />
      <StructuredData id="blog-article" data={articleStructuredData({
        title: post.title,
        description: post.excerpt,
        url: `${PLATFORM_SITE_URL}${canonical}`,
        image: post.cover_image_url ?? undefined,
        author: "Planck Academy",
        publishedDate: post.published_at ?? undefined,
        modifiedDate: post.updated_at,
      })} />
      <StructuredData id="blog-breadcrumbs" data={breadcrumbStructuredData(breadcrumbs)} />
      {post.faq_items.length ? <StructuredData id="blog-faq" data={faqStructuredData(post.faq_items)} /> : null}
      <BlogContentLayout>
      <main className="max-w-3xl pb-24">
        <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm text-slate-500">
          <a href="/" className="hover:text-slate-900">Acasă</a><span aria-hidden>›</span>
          <a href="/blog" className="hover:text-slate-900">Blog</a><span aria-hidden>›</span>
          {primaryCategory ? <><a href={`/blog/categorie/${primaryCategory.slug}`} className="hover:text-slate-900">{primaryCategory.name}</a><span aria-hidden>›</span></> : null}
          <span className="text-slate-700">{post.title}</span>
        </nav>
        <header className="mt-8">
          <div className="flex flex-wrap gap-2">
            {post.categories.map((category) => <a key={category.id} href={`/blog/categorie/${category.slug}`} className="text-sm font-semibold text-cyan-700 hover:text-cyan-900">{category.name}</a>)}
          </div>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{post.title}</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">{post.excerpt}</p>
          <p className="mt-5 text-sm text-slate-500">De Planck Academy{publishedDate ? ` · ${publishedDate}` : ""}</p>
        </header>
        {post.cover_image_url ? (
          <figure className="relative mt-10 aspect-[16/9] overflow-hidden rounded-2xl">
            <Image src={post.cover_image_url} alt={post.cover_image_alt || post.title} fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
          </figure>
        ) : null}
        <article className="mt-10">
          <RichTextContent content={post.content} />
        </article>
        {post.faq_items.length ? (
          <section className="mt-14 border-t border-slate-200 pt-10" aria-labelledby="faq-title">
            <h2 id="faq-title" className="text-2xl font-bold">Întrebări frecvente</h2>
            <div className="mt-6 space-y-5">
              {post.faq_items.map((faq) => (
                <details key={faq.question} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <summary className="cursor-pointer font-semibold">
                    <LatexRichText content={faq.question} />
                  </summary>
                  <div className="mt-3 leading-7 text-slate-600">
                    <LatexRichText content={faq.answer} className="[&_.katex]:text-slate-700" />
                  </div>
                </details>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      </BlogContentLayout>
      <div className="mobile-bottom-nav-pad bg-white">
        <Footer theme="light" backgroundColor="bg-white" borderColor="border-slate-200" />
      </div>
    </div>
  )
}
