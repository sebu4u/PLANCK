"use client"

import { useCallback, useEffect, useRef, useState, useTransition, type CSSProperties } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Menu, Home, BookOpen, Calculator, Rocket, Search as SearchIcon, Loader2, ArrowUpRight, ArrowRight, Code, Github, Chrome, Trophy, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

type SearchResultItem = { type: 'problem' | 'lesson'; id: string; title: string; url: string }

/** Desktop: ca butonul „Start” din dashboard (gradient + glow). */
const GUEST_REGISTER_CTA_CLASS =
  "dashboard-start-glow inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-2 py-1.5 text-[11px] font-semibold leading-tight text-white shadow-[0_3px_0_#5b21b6] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_1px_0_#5b21b6] active:translate-y-0.5 active:shadow-[0_1px_0_#5b21b6] sm:px-2.5 sm:py-2 sm:text-xs"
const GUEST_REGISTER_GLOW_STYLE = { "--start-glow-tint": "rgba(221, 211, 255, 0.84)" } as CSSProperties

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isNavbarHidden, setIsNavbarHidden] = useState(false)
  const lastScrollY = useRef(0)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [loginLoading, setLoginLoading] = useState<"google" | "github" | null>(null)
  const { user, logout, loading, profile, loginWithGoogle, loginWithGitHub, subscriptionPlan, userElo } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()

  // Dashboard, /invata, /grile, /probleme catalog, and /classrooms share the same white navbar theme.
  const isDashboard = pathname === "/dashboard" || pathname?.startsWith("/invata") === true
  const isGrileRoute = pathname === "/grile"
  const isDashboardPage = pathname === "/dashboard" || pathname?.startsWith("/dashboard/")
  // Desktop search state
  const [query, setQuery] = useState("")
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextOffset, setNextOffset] = useState(0)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const resultsRef = useRef<HTMLDivElement | null>(null)
  const cacheRef = useRef<Map<string, { results: SearchResultItem[]; hasMore: boolean }>>(new Map())
  const [, startTransition] = useTransition()

  // Track scroll position for transparent navbar on homepage
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    handleScroll() // Check initial scroll position
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Homepage navbar show/hide based on scroll direction
  const isHomepageForScroll = pathname === '/'
  useEffect(() => {
    if (!isHomepageForScroll) {
      setIsNavbarHidden(false)
      return
    }

    const handleScrollDirection = () => {
      const currentScrollY = window.scrollY

      // Always show navbar when at the top
      if (currentScrollY < 50) {
        setIsNavbarHidden(false)
        lastScrollY.current = currentScrollY
        return
      }

      // Determine scroll direction
      if (currentScrollY > lastScrollY.current + 10) {
        // Scrolling down - hide navbar
        setIsNavbarHidden(true)
      } else if (currentScrollY < lastScrollY.current - 10) {
        // Scrolling up - show navbar
        setIsNavbarHidden(false)
      }

      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScrollDirection, { passive: true })
    return () => window.removeEventListener('scroll', handleScrollDirection)
  }, [isHomepageForScroll])

  // Track mobile screen size (burger breakpoint is 948px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 948)
    }

    checkMobile() // Check initial size
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Listen for custom event to open login modal
  useEffect(() => {
    const handleOpenLoginModal = () => {
      setIsLoginModalOpen(true)
    }

    window.addEventListener('openLoginModal', handleOpenLoginModal)
    return () => window.removeEventListener('openLoginModal', handleOpenLoginModal)
  }, [])

  useEffect(() => {
    if (user && isLoginModalOpen) {
      setIsLoginModalOpen(false)
    }
  }, [user, isLoginModalOpen])

  // Open search modal with '/' when not typing in an input/textarea/contentEditable
  // Disable on IDE page to allow typing '/' in code editor
  useEffect(() => {
    const onGlobalKey = (e: KeyboardEvent) => {
      if (e.key === '/') {
        // Don't activate search on IDE page
        const isOnIDEPage = pathname?.startsWith('/planckcode/ide') ?? false
        if (isOnIDEPage) {
          return
        }
        const target = e.target as HTMLElement | null
        const isTyping = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as any).isContentEditable)
        if (!isTyping) {
          e.preventDefault()
          setIsSearchDialogOpen(true)
          setTimeout(() => inputRef.current?.focus(), 0)
        }
      }
    }
    window.addEventListener('keydown', onGlobalKey)
    return () => window.removeEventListener('keydown', onGlobalKey)
  }, [pathname])

  const performSearch = useCallback(async (searchQuery: string, options?: { offset?: number; append?: boolean }) => {
    const q = searchQuery.trim()
    const offset = options?.offset ?? 0
    const append = options?.append ?? false

    if (!append) {
      setHighlightIndex(-1)
    }

    if (!q || q.length < 2) {
      if (!append) {
        setResults([])
        setIsSearching(false)
        setIsLoadingMore(false)
        setHasMore(false)
        setNextOffset(0)
      }
      return
    }

    if (append) {
      setIsLoadingMore(true)
    } else {
      setIsSearching(true)
      setIsLoadingMore(false)
    }

    try {
      const cacheKey = `${q.toLowerCase()}::${offset}`
      const applyPayload = (payload: { results: SearchResultItem[]; hasMore: boolean }) => {
        if (append) {
          startTransition(() => {
            setResults((prev) => [...prev, ...payload.results])
          })
        } else {
          startTransition(() => {
            setResults(payload.results)
          })
        }
        setHasMore(payload.hasMore && payload.results.length > 0)
        setNextOffset(offset + payload.results.length)
        setIsSearchDialogOpen(true)
      }

      if (cacheRef.current.has(cacheKey)) {
        applyPayload(cacheRef.current.get(cacheKey)!)
      } else {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8&offset=${offset}`)
        if (!res.ok) throw new Error('search failed')
        const json = await res.json()
        const payload = {
          results: (json.results || []) as SearchResultItem[],
          hasMore: Boolean(json.hasMore),
        }
        cacheRef.current.set(cacheKey, payload)
        applyPayload(payload)
      }
    } catch (_) {
      setHasMore(false)
    } finally {
      if (append) {
        setIsLoadingMore(false)
      } else {
        setIsSearching(false)
      }
    }
  }, [results.length, startTransition])

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    const run = async () => {
      const nextQuery = query.trim()
      setHighlightIndex(-1)
      if (!nextQuery) {
        setResults([])
        setIsSearching(false)
        setIsLoadingMore(false)
        setHasMore(false)
        setNextOffset(0)
        return
      }
      if (nextQuery.length < 2) {
        setResults([])
        setIsSearching(false)
        setIsLoadingMore(false)
        setHasMore(false)
        setNextOffset(0)
        return
      }
      try {
        const res = await fetch(`/api/search/q-preview?q=${encodeURIComponent(nextQuery)}`, { signal: controller.signal })
        if (!res.ok) throw new Error('preview failed')
        const json = await res.json()
        if (!cancelled && Array.isArray(json.results)) {
          cacheRef.current.set(`${nextQuery.toLowerCase()}::0`, { results: json.results, hasMore: true })
        }
      } catch (_) {
        // ignore preview errors
      }
    }

    run()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [query])

  const loadMoreResults = useCallback(async () => {
    const currentQuery = query.trim()
    if (!hasMore || isLoadingMore || isSearching || currentQuery.length < 2) return
    await performSearch(currentQuery, { offset: nextOffset, append: true })
  }, [query, hasMore, isLoadingMore, isSearching, nextOffset, performSearch])

  useEffect(() => {
    if (!isSearchDialogOpen) return
    const container = resultsRef.current
    if (!container) return

    const onScroll = () => {
      if (!hasMore || isLoadingMore) return
      const remaining = container.scrollHeight - container.scrollTop - container.clientHeight
      if (remaining < 40) {
        loadMoreResults()
      }
    }

    container.addEventListener('scroll', onScroll)
    return () => {
      container.removeEventListener('scroll', onScroll)
    }
  }, [isSearchDialogOpen, hasMore, isLoadingMore, loadMoreResults])

  const handleSelect = (url: string) => {
    setIsSearchDialogOpen(false)
    setQuery("")
    setResults([])
    setHasMore(false)
    setNextOffset(0)
    setIsLoadingMore(false)
    setHighlightIndex(-1)
    router.push(url)
  }

  const handleClear = useCallback(() => {
    setQuery("")
    setResults([])
    setIsSearchDialogOpen(false)
    setHasMore(false)
    setNextOffset(0)
    setIsLoadingMore(false)
    setIsSearching(false)
    setHighlightIndex(-1)
    inputRef.current?.focus()
  }, [])

  const handleGoogleLogin = async () => {
    setLoginLoading("google")
    const { error, popupBlocked } = await loginWithGoogle()
    setLoginLoading(null)

    if (error) {
      toast({
        title: "Eroare la autentificare cu Google",
        description: popupBlocked
          ? "Permite ferestrele pop-up pentru acest site, apoi încearcă din nou."
          : error.message,
        variant: "destructive",
      })
    }
  }

  const handleGitHubLogin = async () => {
    setLoginLoading("github")
    const { error, popupBlocked } = await loginWithGitHub()
    setLoginLoading(null)

    if (error) {
      toast({
        title: "Eroare la autentificare cu GitHub",
        description: popupBlocked
          ? "Permite ferestrele pop-up pentru acest site, apoi încearcă din nou."
          : error.message,
        variant: "destructive",
      })
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchDialogOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      if (query.trim().length >= 2) {
        setIsSearchDialogOpen(true)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      if (highlightIndex >= 0 && results[highlightIndex]) {
        handleSelect(results[highlightIndex].url)
      } else if (query.trim()) {
        // fallback: go to problems page with search? For now, open catalog
        router.push('/probleme')
      }
    } else if (e.key === 'Escape') {
      setIsSearchDialogOpen(false)
    }
  }

  // Don't render anything during initial auth loading - the DashboardRedirect overlay
  // will cover everything anyway. This prevents navbar flash during redirect.
  if (loading) {
    return null
  }

  const isHomepage = pathname === '/'
  const isInsightRoute = pathname?.startsWith('/insight') ?? false
  const isSketchRoute = pathname?.startsWith('/sketch') ?? false
  const isRegisterRoute = pathname === '/register'
  const isTransparentRoute = isHomepage || isRegisterRoute
  const isPlanckCodeRoute = pathname?.startsWith('/planckcode') ?? false
  const isProblemsCatalog = pathname === "/probleme" || pathname?.startsWith("/probleme/pagina/") === true
  const isProblemPage = (pathname?.match(/^\/probleme\/[^/]+$/) ?? false) || isProblemsCatalog
  const isClassroomsRoute = pathname?.startsWith("/classrooms") ?? false
  const useLightNav = isDashboard || isProblemsCatalog || isProblemPage || isClassroomsRoute || isGrileRoute
  const isCoursePage = pathname?.startsWith('/cursuri') ?? false
  /** Guests pe catalog probleme / cursuri: navbar fără cele 4 link-uri principale; CTA înregistrare. */
  const isGuestProblemeOrCursuri =
    !user &&
    ((pathname?.startsWith("/probleme") ?? false) || (pathname?.startsWith("/cursuri") ?? false))
  const isBacSimulationsPage = pathname?.startsWith('/simulari-bac') ?? false
  // On mobile, navbar should never be transparent when at the top of the screen
  const isSpaceRoute = pathname === '/space'
  const isTransparent = isHomepage || (isTransparentRoute && !isScrolled && !isMobile) || isSpaceRoute

  // Homepage-specific navbar background based on scroll position
  const homepageNavbarBackground = isScrolled ? 'bg-[#111111]/90' : 'bg-transparent'

  const navTheme = useLightNav
    ? {
      background: 'bg-[#ffffff]',
      border: 'border-gray-200',
      dropdownBackground: 'bg-[#ffffff]',
      dropdownBorder: 'border-gray-200',
    }
    : isHomepage
      ? {
        background: homepageNavbarBackground,
        border: isScrolled ? 'border-white/10' : 'border-transparent',
        dropdownBackground: 'bg-[#111111]',
        dropdownBorder: 'border-gray-800/80',
      }
      : isProblemPage || isCoursePage || isBacSimulationsPage
        ? {
          background: 'bg-[#101010]',
          border: 'border-white/10',
          dropdownBackground: 'bg-[#101010]',
          dropdownBorder: 'border-white/10',
        }
        : isInsightRoute || isSketchRoute
          ? {
            background: 'bg-black',
            border: 'border-gray-800',
            dropdownBackground: 'bg-black',
            dropdownBorder: 'border-gray-800',
          }
          : isTransparent
            ? {
              background: 'bg-transparent',
              border: 'border-transparent',
              dropdownBackground: 'bg-[#111111]',
              dropdownBorder: 'border-gray-800/80',
            }
            : isPlanckCodeRoute
              ? {
                background: 'bg-[#181818]',
                border: 'border-gray-600',
                dropdownBackground: 'bg-[#181818]',
                dropdownBorder: 'border-gray-600',
              }
              : {
                background: 'bg-[#0d1117]',
                border: 'border-gray-800',
                dropdownBackground: 'bg-[#0d1117]',
                dropdownBorder: 'border-gray-800',
              }
  const navPrimaryText = useLightNav ? 'text-gray-900' : 'text-white'
  const navSecondaryText = useLightNav ? 'text-gray-600' : 'text-gray-300'
  const navSubtleText = useLightNav ? 'text-gray-500' : 'text-gray-400'
  const navHoverText = useLightNav ? 'hover:text-gray-900' : 'hover:text-white'
  const navHoverBg = useLightNav ? 'hover:bg-gray-100' : 'hover:bg-white/10'
  const navChipBg = useLightNav ? 'bg-gray-100 border-gray-200' : 'bg-white/5 border-white/10'
  const navDropdownItemHover = useLightNav ? 'hover:bg-gray-100' : 'hover:bg-white/10'
  const navDropShadowOnDesktop =
    pathname?.startsWith('/invata') || isGrileRoute || (isProblemPage && !isProblemsCatalog)
  /** Single-problem page uses a fixed white outline under the bar; shadow is applied there so it sits below that outline */
  const isProblemDetailPage =
    Boolean(pathname && /^\/probleme\/[^/]+$/.test(pathname) && !pathname.startsWith('/probleme/pagina'))
  const navbarElevationClass = isProblemDetailPage
    ? 'shadow-none'
    : `shadow-md ${!isDashboardPage && !navDropShadowOnDesktop ? 'burger:shadow-none' : ''}`
  const showGoPremiumCta = subscriptionPlan !== "plus" && subscriptionPlan !== "premium"

  return (
    <>
      <div className={`${isHomepage ? 'fixed' : 'fixed'} top-0 left-0 right-0 z-[300] flex flex-col animate-slide-down transition-transform duration-300 ${isHomepage && isNavbarHidden ? '-translate-y-full' : 'translate-y-0'} ${navbarElevationClass}`}>
        <nav className={`w-full ${isHomepage && isScrolled ? 'backdrop-blur-md' : !isHomepage ? 'backdrop-blur-md' : ''} transition-all duration-300 ${navTheme.background} ${navTheme.border}`}>
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="relative h-16 flex items-center justify-between gap-4">
              <div className={`burger:hidden flex w-full items-center justify-between ${isTransparent ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : ''}`}>
                {isGuestProblemeOrCursuri ? (
                  <div className="flex min-w-0 flex-1 items-center gap-2 pr-1">
                    <Link
                      href="/"
                      className={`flex min-w-0 items-center gap-1.5 text-base font-bold sm:gap-2 sm:text-lg ${navPrimaryText} title-font`}
                    >
                      <Rocket className="h-5 w-5 shrink-0" />
                      <span className="min-w-0 truncate font-black">PLANCK</span>
                    </Link>
                    <Link
                      href="/register"
                      className={`inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold transition-colors ${
                        useLightNav
                          ? "text-[#7c3aed] hover:text-[#6d28d9]"
                          : "text-violet-400 hover:text-violet-300"
                      }`}
                    >
                      <span className="whitespace-nowrap">Începe gratuit</span>
                      <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/" className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:right-0 after:block after:h-[2px] after:content-[''] after:rounded-none ${navPrimaryText} ${navHoverBg} ${(isHomepage || isDashboardPage) ? (useLightNav ? 'after:bg-gray-900' : 'after:bg-white') : `after:bg-transparent ${useLightNav ? 'hover:after:bg-gray-400' : 'hover:after:bg-gray-500'}`}`}>
                      <Home className="h-5 w-5" />
                    </Link>
                    <Link href="/invata" className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:right-0 after:block after:h-[2px] after:content-[''] after:rounded-none ${navPrimaryText} ${navHoverBg} ${pathname?.startsWith('/invata') ? (useLightNav ? 'after:bg-gray-900' : 'after:bg-white') : `after:bg-transparent ${useLightNav ? 'hover:after:bg-gray-400' : 'hover:after:bg-gray-500'}`}`}>
                      <BookOpen className="h-5 w-5" />
                    </Link>
                    <Link href="/probleme" className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:right-0 after:block after:h-[2px] after:content-[''] after:rounded-none ${navPrimaryText} ${navHoverBg} ${isProblemsCatalog ? (useLightNav ? 'after:bg-gray-900' : 'after:bg-white') : `after:bg-transparent ${useLightNav ? 'hover:after:bg-gray-400' : 'hover:after:bg-gray-500'}`}`}>
                      <Calculator className="h-5 w-5" />
                    </Link>
                    <Link
                      href="/classrooms"
                      aria-label="Clasa mea"
                      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:right-0 after:block after:h-[2px] after:content-[''] after:rounded-none ${navPrimaryText} ${navHoverBg} ${isClassroomsRoute ? (useLightNav ? 'after:bg-gray-900' : 'after:bg-white') : `after:bg-transparent ${useLightNav ? 'hover:after:bg-gray-400' : 'hover:after:bg-gray-500'}`}`}
                    >
                      <Users className="h-5 w-5" />
                    </Link>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${navSecondaryText}`}>
                    <Trophy className="h-3.5 w-3.5" />
                    {user ? (userElo ?? 500) : "—"}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        aria-label="Open navigation menu"
                        className={`inline-flex h-9 w-9 items-center justify-center ${useLightNav ? 'text-gray-700' : 'text-gray-200'} ${navHoverText} transition-colors`}
                      >
                        <Menu className="h-5 w-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={12} className={`z-[600] ${navTheme.dropdownBackground} ${navTheme.dropdownBorder}`}>
                      <DropdownMenuItem asChild>
                        <a href="/profil" className={`block px-4 py-2 text-sm ${useLightNav ? 'text-gray-700' : 'text-gray-300'} ${navDropdownItemHover} rounded-md transition-colors`}>Profil</a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/pricing" className={`block px-4 py-2 text-sm ${useLightNav ? 'text-gray-700' : 'text-gray-300'} ${navDropdownItemHover} rounded-md transition-colors`}>
                          Abonament
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className={useLightNav ? "bg-gray-200" : "bg-white/10"} />
                      {user ? (
                        <DropdownMenuItem asChild>
                          <button
                            onClick={async () => {
                              await logout()
                              toast({ title: "Te-ai delogat cu succes!" })
                              router.push("/")
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20"
                          >
                            Log out
                          </button>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem asChild>
                          <a href="/register" className={`block px-4 py-2 text-sm ${useLightNav ? 'text-gray-700' : 'text-gray-300'} ${navDropdownItemHover} rounded-md transition-colors`}>
                            Creeaza cont acum
                          </a>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="hidden burger:flex items-center h-full gap-6 flex-1 min-w-0">
                <Link
                  href="/"
                  className={`relative flex h-full items-center gap-2 flex-shrink-0 text-2xl font-bold ${navPrimaryText} title-font animate-fade-in transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:right-0 after:block after:h-[2px] after:content-[''] after:rounded-none ${isTransparent ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : ''} ${isHomepage ? (useLightNav ? 'after:bg-gray-900' : 'after:bg-white') : 'after:bg-transparent'}`}
                >
                  <Rocket className={`w-6 h-6 ${navPrimaryText}`} />
                  <span className="hidden logo:block font-black whitespace-nowrap">PLANCK</span>
                </Link>

                {isGuestProblemeOrCursuri ? (
                  <div className={`flex items-center self-stretch animate-fade-in-delay-1 ${isTransparent ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : ''}`}>
                    <Link
                      href="/register"
                      className={GUEST_REGISTER_CTA_CLASS}
                      style={GUEST_REGISTER_GLOW_STYLE}
                    >
                      <span className="relative z-[1] inline-flex items-center gap-1">
                        Începe gratuit
                        <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      </span>
                    </Link>
                  </div>
                ) : (
                  <div className={`self-stretch flex items-stretch gap-1 animate-fade-in-delay-1 ${isTransparent ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : ''}`}>
                    <Link
                      href="/invata"
                      className={`relative h-full pl-2.5 pr-1.5 py-0 text-sm flex items-center gap-1 transition-all duration-300 rounded-lg whitespace-nowrap after:absolute after:bottom-0 after:left-0 after:right-0 after:block after:h-[2px] after:content-[''] after:rounded-none ${navPrimaryText} font-semibold ${pathname?.startsWith('/invata') ? (useLightNav ? 'after:bg-gray-900' : 'after:bg-white') : `after:bg-transparent ${useLightNav ? 'hover:after:bg-gray-400' : 'hover:after:bg-gray-500'}`} ${useLightNav ? 'hover:text-gray-700' : 'hover:text-gray-300'}`}
                    >
                      <BookOpen size={16} />
                      Învață
                    </Link>

                    <Link
                      href="/probleme"
                      className={`relative h-full px-3 py-0 text-sm flex items-center gap-1 transition-all duration-300 rounded-lg whitespace-nowrap after:absolute after:bottom-0 after:left-0 after:right-0 after:block after:h-[2px] after:content-[''] after:rounded-none ${navPrimaryText} font-semibold ${isProblemsCatalog ? (useLightNav ? 'after:bg-gray-900' : 'after:bg-white') : `after:bg-transparent ${useLightNav ? 'hover:after:bg-gray-400' : 'hover:after:bg-gray-500'}`} ${useLightNav ? 'hover:text-gray-700' : 'hover:text-gray-300'}`}
                    >
                      <Calculator size={16} />
                      Exersează
                    </Link>

                    <Link
                      href="/planckcode/ide"
                      className={`relative h-full px-3 py-0 text-sm flex items-center gap-1 transition-all duration-300 rounded-lg whitespace-nowrap after:absolute after:bottom-0 after:left-0 after:right-0 after:block after:h-[2px] after:content-[''] after:rounded-none ${navPrimaryText} font-semibold ${isPlanckCodeRoute ? (useLightNav ? 'after:bg-gray-900' : 'after:bg-white') : `after:bg-transparent ${useLightNav ? 'hover:after:bg-gray-400' : 'hover:after:bg-gray-500'}`} ${useLightNav ? 'hover:text-gray-700' : 'hover:text-gray-300'}`}
                    >
                      <Code size={16} />
                      Code
                    </Link>

                    <Link
                      href="/classrooms"
                      className={`relative h-full px-3 py-0 text-sm flex items-center gap-1 transition-all duration-300 rounded-lg whitespace-nowrap after:absolute after:bottom-0 after:left-0 after:right-0 after:block after:h-[2px] after:content-[''] after:rounded-none ${navPrimaryText} font-semibold ${isClassroomsRoute ? (useLightNav ? 'after:bg-gray-900' : 'after:bg-white') : `after:bg-transparent ${useLightNav ? 'hover:after:bg-gray-400' : 'hover:after:bg-gray-500'}`} ${useLightNav ? 'hover:text-gray-700' : 'hover:text-gray-300'}`}
                    >
                      <Users size={16} />
                      Clasa mea
                    </Link>
                  </div>
                )}
              </div>

              <div className={`hidden burger:flex items-center animate-fade-in-delay-2 justify-end gap-3 ${isTransparent ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : ''}`}>
                <div className="inline-flex items-center gap-2 px-1 py-1">
                  <span className={`text-xs font-medium leading-tight ${subscriptionPlan === 'premium' ? 'text-orange-400' : subscriptionPlan === 'plus' ? (useLightNav ? 'text-emerald-600' : 'text-green-400') : 'text-gray-400'}`}>
                    {subscriptionPlan === 'premium' ? 'premium' : subscriptionPlan === 'plus' ? 'plus+' : 'free'}
                  </span>
                  <span className={`flex items-center gap-1 ${navSecondaryText}`}>
                    <Trophy className="w-3.5 h-3.5" />
                    <span className="text-xs">{user ? (userElo ?? 500) : '—'}</span>
                  </span>
                </div>

                <button
                  onClick={() => setIsSearchDialogOpen(true)}
                  className={`inline-flex items-center gap-2 w-[180px] h-9 rounded-full ${navChipBg} px-3 text-sm ${navSubtleText} ${useLightNav ? 'hover:bg-gray-200' : 'hover:bg-white/10'} transition-colors`}
                >
                  <SearchIcon className="w-4 h-4" />
                  <span className="flex-1 text-left">Search...</span>
                  <kbd className={`px-1.5 py-0.5 text-xs ${useLightNav ? 'bg-gray-200 border-gray-300' : 'bg-white/10 border-white/10'} border rounded`}>/</kbd>
                </button>

                {showGoPremiumCta && (
                  <Link href="/pricing" className="group inline-flex rounded-full bg-gradient-to-r from-[#9a7bff] via-[#d77bff] to-[#ffb56b] p-[1px]">
                    <span className="inline-flex h-9 items-center rounded-full bg-white px-5 text-sm font-semibold text-[#2f236f] transition-colors group-hover:bg-[#f8f5ff]">
                      Go Premium
                    </span>
                  </Link>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label="Open navigation menu"
                      className={`inline-flex h-9 w-9 items-center justify-center ${useLightNav ? 'text-gray-700' : 'text-gray-200'} ${navHoverText} transition-colors`}
                    >
                      <Menu className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={12} className={`z-[600] ${navTheme.dropdownBackground} ${navTheme.dropdownBorder}`}>
                    <DropdownMenuItem asChild>
                      <a href="/profil" className={`block px-4 py-2 text-sm ${useLightNav ? 'text-gray-700' : 'text-gray-300'} ${navDropdownItemHover} rounded-md transition-colors`}>Profil</a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/pricing" className={`block px-4 py-2 text-sm ${useLightNav ? 'text-gray-700' : 'text-gray-300'} ${navDropdownItemHover} rounded-md transition-colors`}>
                        Abonament
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className={useLightNav ? "bg-gray-200" : "bg-white/10"} />
                    {user ? (
                      <DropdownMenuItem asChild>
                        <button
                          onClick={async () => {
                            await logout()
                            toast({ title: "Te-ai delogat cu succes!" })
                            router.push("/")
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20"
                        >
                          Log out
                        </button>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem asChild>
                        <a href="/register" className={`block px-4 py-2 text-sm ${useLightNav ? 'text-gray-700' : 'text-gray-300'} ${navDropdownItemHover} rounded-md transition-colors`}>
                          Creeaza cont acum
                        </a>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Login Modal */}
          <Dialog open={isLoginModalOpen} onOpenChange={(v) => setIsLoginModalOpen(v)}>
            <DialogContent className="bg-[#111111] border-none text-white w-[min(400px,95vw)] p-0">
              <DialogTitle className="sr-only">Conectează-te</DialogTitle>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-2">Conectează-te</h2>
                <p className="text-gray-400 text-sm mb-6">Continuă cu unul dintre conturile tale</p>

                <div className="space-y-3">
                  <Button
                    onClick={handleGoogleLogin}
                    disabled={loginLoading !== null}
                    className="w-full h-12 bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/30 transition-all duration-200"
                  >
                    {loginLoading === "google" ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Chrome className="w-5 h-5 mr-2" />
                    )}
                    <span className="font-semibold">
                      {loginLoading === "google" ? "Se conectează..." : "Continuă cu Google"}
                    </span>
                  </Button>

                  <Button
                    onClick={handleGitHubLogin}
                    disabled={loginLoading !== null}
                    className="w-full h-12 bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/30 transition-all duration-200"
                  >
                    {loginLoading === "github" ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Github className="w-5 h-5 mr-2" />
                    )}
                    <span className="font-semibold">
                      {loginLoading === "github" ? "Se conectează..." : "Continuă cu GitHub"}
                    </span>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Search Modal */}
          <Dialog open={isSearchDialogOpen} onOpenChange={(v) => setIsSearchDialogOpen(v)}>
            <DialogContent overlayClassName="bg-black/40 backdrop-blur-[2px]" className="overflow-hidden p-0 shadow-2xl bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 sm:rounded-2xl w-[min(640px,95vw)] gap-0">
              <DialogTitle className="sr-only">Search</DialogTitle>
              <div className="flex flex-col">
                <div className="relative border-b border-white/5">
                  <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => {
                      const value = e.target.value
                      setQuery(value)
                      cacheRef.current.delete(`${value.toLowerCase()}::0`)
                      performSearch(value)
                    }}
                    onKeyDown={onKeyDown}
                    placeholder="Caută lecții sau probleme..."
                    className="pl-12 pr-4 h-14 border-none bg-transparent text-lg text-white placeholder:text-gray-500 focus-visible:ring-0 shadow-none focus-visible:ring-offset-0 rounded-none"
                    autoFocus
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                    </div>
                  )}
                </div>

                <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                  {query.trim().length >= 2 && results.length === 0 && !isSearching && (
                    <div className="py-12 text-center text-gray-500">
                      <p className="text-sm">Nu am găsit rezultate pentru "{query}"</p>
                    </div>
                  )}

                  {query.trim().length < 2 && results.length === 0 && (
                    <div className="py-12 text-center text-gray-500">
                      <p className="text-sm">Începe să scrii pentru a căuta...</p>
                    </div>
                  )}

                  {results.length > 0 && (
                    <div className="space-y-1">
                      {/* Optional: Add a label if we had sections. For now just flat list */}
                      {results.map((r, idx) => (
                        <button
                          key={`${r.type}-${r.id}-${idx}`}
                          onClick={() => handleSelect(r.url)}
                          onMouseEnter={() => setHighlightIndex(idx)}
                          className={`w-full group text-left px-3 py-3 flex items-center gap-3 rounded-lg transition-all duration-200 ${highlightIndex === idx
                            ? 'bg-white/10'
                            : 'hover:bg-white/5'
                            }`}
                        >
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors ${r.type === 'lesson'
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            }`}>
                            {r.type === 'lesson' ? <BookOpen className="w-4 h-4" /> : <Calculator className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate transition-colors ${highlightIndex === idx ? 'text-white' : 'text-gray-300'
                              }`}>
                              {r.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {r.type === 'lesson' ? 'Lecție' : 'Problemă'}
                            </p>
                          </div>
                          <ArrowUpRight className={`w-4 h-4 text-gray-500 transition-all duration-200 ${highlightIndex === idx ? 'opacity-100 translate-x-0 text-white' : 'opacity-0 -translate-x-2'
                            }`} />
                        </button>
                      ))}
                    </div>
                  )}

                  {isLoadingMore && (
                    <div className="px-4 py-4 text-sm text-gray-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      <span>Se încarcă mai multe...</span>
                    </div>
                  )}

                  {!isLoadingMore && hasMore && results.length > 0 && (
                    <div className="px-4 py-3 text-[10px] uppercase tracking-wider text-gray-600 text-center font-medium">
                      Derulează pentru mai multe
                    </div>
                  )}
                </div>

                {/* Footer with shortcuts */}
                <div className="hidden sm:flex border-t border-white/5 px-4 py-2.5 bg-white/[0.02] items-center justify-between">
                  <div className="flex items-center gap-4 text-[10px] text-gray-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-1">
                        <kbd className="min-w-[20px] h-5 flex items-center justify-center rounded bg-white/5 border border-white/10 font-sans">↑</kbd>
                        <kbd className="min-w-[20px] h-5 flex items-center justify-center rounded bg-white/5 border border-white/10 font-sans">↓</kbd>
                      </div>
                      <span className="opacity-70">navigare</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <kbd className="h-5 px-1.5 flex items-center justify-center rounded bg-white/5 border border-white/10 font-sans">enter</kbd>
                      <span className="opacity-70">selectare</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                    <kbd className="h-5 px-1.5 flex items-center justify-center rounded bg-white/5 border border-white/10 font-sans">esc</kbd>
                    <span className="opacity-70">închidere</span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

        </nav>
      </div>
    </>
  )
}
