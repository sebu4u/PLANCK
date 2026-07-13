import Image from "next/image"
import Link from "next/link"
import type { BlogPost } from "@/lib/blog"

export function BlogPostCard({ post }: { post: BlogPost }) {
  const publishedDate = post.published_at
    ? new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long", year: "numeric" }).format(new Date(post.published_at))
    : null

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-lg">
      {post.cover_image_url ? (
        <Link href={`/blog/${post.slug}`} className="relative block aspect-[16/8] overflow-hidden">
          <Image
            src={post.cover_image_url}
            alt={post.cover_image_alt || post.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition duration-300 hover:scale-[1.02]"
          />
        </Link>
      ) : null}
      <div className="p-6">
        <div className="mb-3 flex flex-wrap gap-2">
          {post.categories.map((category) => (
            <Link key={category.id} href={`/blog/categorie/${category.slug}`} className="text-xs font-semibold text-cyan-700 hover:text-cyan-900">
              {category.name}
            </Link>
          ))}
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          <Link href={`/blog/${post.slug}`} className="hover:text-cyan-800">{post.title}</Link>
        </h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{post.excerpt}</p>
        {publishedDate ? <p className="mt-5 text-xs text-slate-500">{publishedDate}</p> : null}
      </div>
    </article>
  )
}
