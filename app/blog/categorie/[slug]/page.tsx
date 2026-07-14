import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { BlogContentLayout } from "@/components/blog/blog-content-layout"
import { BlogPostCard } from "@/components/blog/blog-post-card"
import { getPublishedBlogCategories, getPublishedPostsByCategory } from "@/lib/blog"
import { dynamicTitleSegment } from "@/lib/metadata"
import { PLATFORM_SITE_URL } from "@/lib/platform-marketing"

export const revalidate = 3600

export async function generateStaticParams() {
  const categories = await getPublishedBlogCategories()
  return categories.map((category) => ({ slug: category.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const result = await getPublishedPostsByCategory(slug)
  if (!result) return { robots: { index: false, follow: false } }

  const { category } = result
  const titleSegment = dynamicTitleSegment(
    category.meta_title || `${category.name} – ghiduri liceu`,
  )
  const description = category.meta_description || category.description || `Articole PLANCK despre ${category.name}.`
  const url = `${PLATFORM_SITE_URL}/blog/categorie/${category.slug}`
  return {
    title: titleSegment,
    description,
    alternates: { canonical: `/blog/categorie/${category.slug}` },
    openGraph: { type: "website", title: titleSegment, description, url },
    twitter: { card: "summary_large_image", title: titleSegment, description },
  }
}

export default async function BlogCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const result = await getPublishedPostsByCategory(slug)
  if (!result) notFound()

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navigation />
      <BlogContentLayout>
      <main className="pb-24">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
          <a href="/" className="hover:text-slate-900">Acasă</a> <span aria-hidden>›</span>{" "}
          <a href="/blog" className="hover:text-slate-900">Blog</a> <span aria-hidden>›</span>{" "}
          <span>{result.category.name}</span>
        </nav>
        <h1 className="mt-5 text-4xl font-bold">{result.category.name}</h1>
        {result.category.description ? <p className="mt-4 max-w-2xl text-lg text-slate-600">{result.category.description}</p> : null}
        <section className="mt-10 grid gap-6 md:grid-cols-2">
          {result.posts.map((post) => <BlogPostCard key={post.id} post={post} />)}
        </section>
        {!result.posts.length ? <p className="mt-10 text-slate-500">Nu există articole publicate în această categorie.</p> : null}
      </main>
      </BlogContentLayout>
      <div className="mobile-bottom-nav-pad bg-white">
        <Footer theme="light" backgroundColor="bg-white" borderColor="border-slate-200" />
      </div>
    </div>
  )
}
