"use client"

import { type CSSProperties, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Bell, Loader2 } from "lucide-react"
import { createClient as createAnonClient } from "@supabase/supabase-js"
import { useAuth } from "@/components/auth-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"
import { getLearningPathChapterTheme } from "@/lib/learning-path-chapter-theme"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type BlogNotificationPost = {
  slug: string
  title: string
  excerpt: string
  published_at: string | null
}

type InAppNotification = {
  id: string
  type: string
  title: string
  body: string
  href: string | null
  read_at: string | null
  created_at: string
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
    "z-[650] w-[min(17rem,calc(100vw-2rem))] overflow-hidden rounded-xl border px-3.5 py-2.5 text-left shadow-lg",
    useLightNav
      ? "border-gray-200 bg-white text-gray-900"
      : "border-gray-700 bg-[#161b22] text-gray-100",
  )
}

function NotificationsPanel({
  useLightNav,
  posts,
  inApp,
  loading,
}: {
  useLightNav: boolean
  posts: BlogNotificationPost[]
  inApp: InAppNotification[]
  loading: boolean
}) {
  const hasInApp = inApp.length > 0
  const hasPosts = posts.length > 0
  const empty = !loading && !hasInApp && !hasPosts

  return (
    <>
      <p className="text-sm font-semibold">Notificări</p>
      <p
        className={cn(
          "mt-1.5 text-xs leading-relaxed",
          useLightNav ? "text-gray-600" : "text-gray-300",
        )}
      >
        Teme, pregătiri și articole
      </p>

      <div className="mt-2.5 h-[4.75rem] overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-width:thin]">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className={cn("h-4 w-4 animate-spin", useLightNav ? "text-gray-400" : "text-gray-500")} />
          </div>
        ) : empty ? (
          <p
            className={cn(
              "flex h-full items-center justify-center text-center text-xs",
              useLightNav ? "text-gray-500" : "text-gray-400",
            )}
          >
            Nu ai notificări momentan.
          </p>
        ) : (
          <ul>
            {inApp.map((item) => (
              <li key={item.id} className="h-[4.75rem]">
                <Link
                  href={item.href || "/classrooms"}
                  className={cn(
                    "flex h-full flex-col justify-center rounded-lg px-2 py-1.5 -mx-2 transition-colors",
                    useLightNav
                      ? "active:bg-gray-100 md:hover:bg-gray-50"
                      : "active:bg-white/10 md:hover:bg-white/5",
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!item.read_at ? (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
                    ) : null}
                    <div className={cn("min-w-0", item.read_at && "pl-3.5")}>
                      <p className="line-clamp-1 text-sm font-semibold leading-5">{item.title}</p>
                      <p
                        className={cn(
                          "mt-1 line-clamp-2 text-xs leading-relaxed",
                          useLightNav ? "text-gray-600" : "text-gray-300",
                        )}
                      >
                        {item.body}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}

            {posts.map((post) => (
              <li key={post.slug} className="h-[4.75rem]">
                <Link
                  href={`/blog/${post.slug}`}
                  className={cn(
                    "flex h-full flex-col justify-center rounded-lg px-2 py-1.5 -mx-2 transition-colors",
                    useLightNav
                      ? "active:bg-gray-100 md:hover:bg-gray-50"
                      : "active:bg-white/10 md:hover:bg-white/5",
                  )}
                >
                  <p className="line-clamp-1 text-sm font-semibold leading-5">{post.title}</p>
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
        )}
      </div>

      {!loading && (hasInApp || hasPosts) ? (
        <p
          className={cn(
            "mt-2 text-xs font-medium",
            useLightNav ? "text-emerald-700" : "text-emerald-400",
          )}
        >
          {[
            hasInApp
              ? `${inApp.length} ${inApp.length === 1 ? "notificare" : "notificări"}`
              : null,
            hasPosts
              ? `${posts.length} ${posts.length === 1 ? "articol" : "articole"}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      ) : null}

      <Link
        href={hasInApp ? inApp[0]?.href || "/classrooms" : "/blog"}
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
          {hasInApp ? "Deschide" : "Vezi blogul"}
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
  const { user } = useAuth()
  const [posts, setPosts] = useState<BlogNotificationPost[]>([])
  const [inApp, setInApp] = useState<InAppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      const blogPromise = (async () => {
        if (!url || !anonKey) return [] as BlogNotificationPost[]
        const supabase = createAnonClient(url, anonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
        const { data } = await supabase
          .from("blog_posts")
          .select("slug, title, excerpt, published_at")
          .eq("status", "published")
          .lte("published_at", new Date().toISOString())
          .order("published_at", { ascending: false })
          .limit(5)
        return (data ?? []) as BlogNotificationPost[]
      })()

      const inAppPromise = (async () => {
        if (!user?.id) return [] as InAppNotification[]
        const supabase = createClient()
        const { data } = await supabase
          .from("user_in_app_notifications")
          .select("id, type, title, body, href, read_at, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10)
        return (data ?? []) as InAppNotification[]
      })()

      const [nextPosts, nextInApp] = await Promise.all([blogPromise, inAppPromise])
      if (!cancelled) {
        setPosts(nextPosts)
        setInApp(nextInApp)
        setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  useEffect(() => {
    if (!open || !user?.id || loading) return

    const unreadIds = inApp.filter((n) => !n.read_at).map((n) => n.id)
    if (!unreadIds.length) return

    let cancelled = false
    async function markRead() {
      const supabase = createClient()
      const now = new Date().toISOString()
      const { error } = await supabase
        .from("user_in_app_notifications")
        .update({ read_at: now })
        .in("id", unreadIds)
        .is("read_at", null)

      if (!cancelled && !error) {
        setInApp((current) =>
          current.map((n) => (unreadIds.includes(n.id) ? { ...n, read_at: now } : n)),
        )
      }
    }

    void markRead()
    return () => {
      cancelled = true
    }
  }, [open, user?.id, loading, inApp])

  const unreadCount = inApp.filter((n) => !n.read_at).length
  const showDot = unreadCount > 0 || posts.length > 0

  const trigger = (
    <button
      type="button"
      aria-label="Notificări"
      className={cn(
        "relative inline-flex h-9 w-9 touch-manipulation items-center justify-center rounded-md outline-none transition-[color,opacity] focus-visible:ring-2 focus-visible:ring-violet-500/60",
        useLightNav
          ? "text-gray-700 active:opacity-80 md:hover:text-gray-900"
          : "text-gray-200 active:opacity-80 md:hover:text-white",
        triggerClassName,
      )}
    >
      <Bell className="h-5 w-5" />
      {showDot ? (
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
  const panel = (
    <NotificationsPanel
      useLightNav={useLightNav}
      posts={posts}
      inApp={inApp}
      loading={loading}
    />
  )

  if (isMobile) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
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
          {panel}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className={cn(
          panelClassName,
          "data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100",
        )}
      >
        {panel}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
