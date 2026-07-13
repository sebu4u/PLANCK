"use client"

import { type CSSProperties, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Bell, Loader2 } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"
import { getLearningPathChapterTheme } from "@/lib/learning-path-chapter-theme"
import { cn } from "@/lib/utils"

type BlogNotificationPost = {
  slug: string
  title: string
  excerpt: string
  published_at: string | null
}

type BlogNotificationsDropdownProps = {
  useLightNav: boolean
  dropdownBackground?: string
  dropdownBorder?: string
  triggerClassName?: string
}

const BLOG_CTA_THEME = getLearningPathChapterTheme(null)

function notificationsPanelClassName(useLightNav: boolean) {
  return cn(
    "z-[650] w-[min(15rem,calc(100vw-2rem))] overflow-hidden rounded-xl border px-3.5 py-2.5 text-left shadow-lg",
    useLightNav
      ? "border-gray-200 bg-white text-gray-900"
      : "border-gray-700 bg-[#161b22] text-gray-100",
  )
}

function NotificationsPanel({
  useLightNav,
  posts,
  loading,
}: {
  useLightNav: boolean
  posts: BlogNotificationPost[]
  loading: boolean
}) {
  return (
    <>
      <p className="text-sm font-semibold">Notificări</p>
      <p
        className={cn(
          "mt-1.5 text-xs leading-relaxed",
          useLightNav ? "text-gray-600" : "text-gray-300",
        )}
      >
        Articole noi de pe blog
      </p>

      <div className="mt-2.5 max-h-32 overflow-x-hidden overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className={cn("h-5 w-5 animate-spin", useLightNav ? "text-gray-400" : "text-gray-500")} />
          </div>
        ) : posts.length ? (
          <ul className="space-y-2">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className={cn(
                    "block rounded-lg px-2 py-1.5 -mx-2 transition-colors",
                    useLightNav
                      ? "active:bg-gray-100 md:hover:bg-gray-50"
                      : "active:bg-white/10 md:hover:bg-white/5",
                  )}
                >
                  <p className="text-sm font-semibold leading-5">{post.title}</p>
                  <p
                    className={cn(
                      "mt-1 line-clamp-2 text-xs leading-relaxed",
                      useLightNav ? "text-gray-600" : "text-gray-300",
                    )}
                  >
                    {post.excerpt}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={cn("py-4 text-center text-xs", useLightNav ? "text-gray-500" : "text-gray-400")}>
            Nu există articole noi momentan.
          </p>
        )}
      </div>

      {!loading && posts.length > 0 ? (
        <p
          className={cn(
            "mt-2 text-xs font-medium",
            useLightNav ? "text-emerald-700" : "text-emerald-400",
          )}
        >
          {posts.length} {posts.length === 1 ? "articol nou" : "articole noi"}
        </p>
      ) : null}

      <Link
        href="/blog"
        className={cn(
          "dashboard-start-glow mt-2.5 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_0_var(--lp-accent-dark)] transition-[transform,box-shadow,opacity]",
          "active:translate-y-0.5 active:shadow-[0_2px_0_var(--lp-accent-dark)] md:hover:translate-y-0.5 md:hover:shadow-[0_2px_0_var(--lp-accent-dark)]",
        )}
        style={
          {
            "--lp-accent-light": BLOG_CTA_THEME.accentLight,
            "--lp-accent": BLOG_CTA_THEME.accent,
            "--lp-accent-dark": BLOG_CTA_THEME.accentDark,
            "--start-glow-tint": BLOG_CTA_THEME.buttonGlowTint,
            backgroundImage: "linear-gradient(to right, var(--lp-accent-light), var(--lp-accent))",
          } as CSSProperties
        }
      >
        <span className="relative z-[1] inline-flex items-center justify-center gap-2">
          Vezi blogul
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </>
  )
}

export function BlogNotificationsDropdown({
  useLightNav,
  triggerClassName,
}: BlogNotificationsDropdownProps) {
  const isMobile = useIsMobile()
  const [posts, setPosts] = useState<BlogNotificationPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadPosts() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!url || !anonKey) {
        if (!cancelled) setLoading(false)
        return
      }

      const supabase = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const { data } = await supabase
        .from("blog_posts")
        .select("slug, title, excerpt, published_at")
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false })
        .limit(5)

      if (!cancelled) {
        setPosts((data ?? []) as BlogNotificationPost[])
        setLoading(false)
      }
    }

    void loadPosts()
    return () => {
      cancelled = true
    }
  }, [])

  const trigger = (
    <button
      type="button"
      aria-label="Notificări blog"
      className={cn(
        "relative inline-flex h-9 w-9 touch-manipulation items-center justify-center rounded-md outline-none transition-[color,opacity] focus-visible:ring-2 focus-visible:ring-violet-500/60",
        useLightNav
          ? "text-gray-700 active:opacity-80 md:hover:text-gray-900"
          : "text-gray-200 active:opacity-80 md:hover:text-white",
        triggerClassName,
      )}
    >
      <Bell className="h-5 w-5" />
      {posts.length > 0 ? (
        <span
          className={cn(
            "absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-cyan-500 ring-2",
            useLightNav ? "ring-white" : "ring-[#161b22]",
          )}
        />
      ) : null}
    </button>
  )

  const panelClassName = notificationsPanelClassName(useLightNav)

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="end"
          sideOffset={10}
          className={cn(
            panelClassName,
            "data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100",
          )}
        >
          <NotificationsPanel useLightNav={useLightNav} posts={posts} loading={loading} />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className={cn(
          panelClassName,
          "data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100",
        )}
      >
        <NotificationsPanel useLightNav={useLightNav} posts={posts} loading={loading} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
