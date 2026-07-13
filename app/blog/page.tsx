import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { BlogContentLayout } from "@/components/blog/blog-content-layout"
import { BlogPostCard } from "@/components/blog/blog-post-card"
import { getPublishedBlogCategories, getPublishedBlogPosts } from "@/lib/blog"
import { generateMetadata } from "@/lib/metadata"

export const revalidate = 3600

export const metadata: Metadata = generateMetadata("blog")

export default async function BlogPage() {
  const [posts, categories] = await Promise.all([getPublishedBlogPosts(), getPublishedBlogCategories()])

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navigation />
      <BlogContentLayout>
      <main className="pb-24">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Resurse pentru liceu</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Blog PLANCK</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
          Explicații clare, ghiduri pentru BAC și admitere, plus resurse utile pentru învățare.
        </p>
        {categories.length ? (
          <nav aria-label="Categorii blog" className="mt-8 flex flex-wrap gap-2">
            {categories.map((category) => (
              <a
                key={category.id}
                href={`/blog/categorie/${category.slug}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:border-cyan-300 hover:text-cyan-800"
              >
                {category.name}
              </a>
            ))}
          </nav>
        ) : null}
        <section aria-label="Articole recente" className="mt-12 grid gap-6 md:grid-cols-2">
          {posts.map((post) => <BlogPostCard key={post.id} post={post} />)}
        </section>
        {!posts.length ? <p className="mt-12 text-slate-500">Pregătim primele articole. Revino în curând.</p> : null}
      </main>
      </BlogContentLayout>
      <div className="mobile-bottom-nav-pad bg-white">
        <Footer theme="light" backgroundColor="bg-white" borderColor="border-slate-200" />
      </div>
    </div>
  )
}
