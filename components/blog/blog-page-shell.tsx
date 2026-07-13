"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight, Menu, SlidersHorizontal } from "lucide-react"
import type { BlogCategory, BlogPost } from "@/lib/blog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

type BlogPageShellProps = {
  categories: BlogCategory[]
  posts: BlogPost[]
  children: ReactNode
}

export function BlogPageShell({ categories, posts, children }: BlogPageShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    () => Object.fromEntries(categories.map((category) => [category.id, true])),
  )

  const navigation = (
    <nav aria-label="Capitole blog" className="space-y-2">
      <Link
        href="/blog"
        className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
        onClick={() => setIsMobileOpen(false)}
      >
        Toate articolele
      </Link>
      {categories.map((category) => {
        const categoryPosts = posts.filter((post) =>
          post.categories.some((postCategory) => postCategory.id === category.id),
        )
        const isOpen = expandedCategories[category.id]
        return (
          <div key={category.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() =>
                  setExpandedCategories((current) => ({ ...current, [category.id]: !current[category.id] }))
                }
                className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50"
                aria-expanded={isOpen}
              >
                {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                <span className="truncate">{category.name}</span>
              </button>
              <Link
                href={`/blog/categorie/${category.slug}`}
                onClick={() => setIsMobileOpen(false)}
                className="mr-3 text-xs font-medium text-cyan-700 hover:text-cyan-900"
              >
                Vezi
              </Link>
            </div>
            {isOpen ? (
              <div className="max-h-72 space-y-1 overflow-y-auto border-t border-slate-200 px-2 py-2">
                {categoryPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    onClick={() => setIsMobileOpen(false)}
                    className="block rounded-lg px-2 py-1.5 text-xs leading-5 text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  >
                    {post.title}
                  </Link>
                ))}
                {!categoryPosts.length ? (
                  <p className="px-2 py-1 text-xs text-slate-400">Niciun articol publicat.</p>
                ) : null}
              </div>
            ) : null}
          </div>
        )
      })}
    </nav>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 sm:px-6">
      <div className="mb-5 lg:hidden">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsMobileOpen(true)}
          className="w-full justify-between rounded-full border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Capitole și articole
          </span>
          <Menu className="h-4 w-4 text-slate-500" />
        </Button>
      </div>

      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent
          side="left"
          className="flex w-[min(22rem,88vw)] flex-col overflow-hidden border-r border-slate-200 bg-slate-50 p-0"
        >
          <SheetHeader className="border-b border-slate-200 bg-white px-5 py-4">
            <SheetTitle className="text-left text-sm font-semibold text-slate-950">Capitole și articole</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{navigation}</div>
        </SheetContent>
      </Sheet>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Capitole</p>
            {navigation}
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
