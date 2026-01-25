"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Menu, X, BookOpen, Calculator, Rocket, LogIn, Search as SearchIcon, Loader2, ArrowUpRight, ChevronDown, Sparkles, Code, Github, Chrome, CreditCard, Trophy, Atom, Magnet, Terminal, FileText, CheckSquare, BrainCircuit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useDashboardSidebar } from "@/components/dashboard/dashboard-sidebar-context"

type SearchResultItem = { type: 'problem' | 'lesson'; id: string; title: string; url: string }

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [coursesOpen, setCoursesOpen] = useState(false)
  const [problemsOpen, setProblemsOpen] = useState(false)
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
  const dashboardSidebar = useDashboardSidebar()

  // Check if we're on dashboard
  const isDashboard = pathname === "/dashboard"

  // Reset mobile menu when navigating to/from dashboard
  useEffect(() => {
    if (isDashboard) {
      setIsOpen(false)
    }
  }, [isDashboard])
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


  const problemShortcuts: { chapter: string; classLabel: string }[] = [
    { chapter: "Principiile mecanicii", classLabel: "a 9-a" },
    { chapter: "Energia mecanica", classLabel: "a 9-a" },
    { chapter: "Legea gazului ideal", classLabel: "a 10-a" },
    { chapter: "Electrostatica", classLabel: "a 10-a" },
    { chapter: "Unde mecanice", classLabel: "a 11-a" },
    { chapter: "circuite de curent alternativ", classLabel: "a 11-a" },
  ]

  const classEmoji: Record<string, string> = {
    'a 9-a': '🧪',
    'a 10-a': '⚡',
    'a 11-a': '🌊',
    'a 12-a': '🔬',
    'Toate': '📚',
  }

  const chapterEmoji: Record<string, string> = {
    'Principiile mecanicii': '📐',
    'Energia mecanica': '⚙️',
    'Legea gazului ideal': '🧪',
    'Electrostatica': '⚡',
    'Unde mecanice': '🌊',
    'circuite de curent alternativ': '🔁',
  }

  const goToProblemsWith = (classLabel: string, chapter: string) => {
    try {
      const payload = {
        search: "",
        category: "Toate",
        difficulty: "Toate",
        progress: "Toate",
        class: classLabel,
        chapter,
      }
      sessionStorage.setItem("problemFilters", JSON.stringify(payload))
    } catch { }
    if (typeof window !== 'undefined' && window.location && window.location.pathname.startsWith('/probleme')) {
      try {
        window.dispatchEvent(new Event('problemFiltersUpdated'))
      } catch { }
      // Trigger a soft refresh for visual feedback
      try { router.refresh() } catch { }
    } else {
      router.push("/probleme")
    }
  }

  const goToCoursesWith = (classLabel: string) => {
    try {
      sessionStorage.setItem('physicsSelectedClass', classLabel)
    } catch { }
    if (typeof window !== 'undefined' && window.location && window.location.pathname.startsWith('/cursuri')) {
      try { window.dispatchEvent(new Event('physicsClassSelected')) } catch { }
      try { router.refresh() } catch { }
    } else {
      router.push('/cursuri')
    }
  }

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

  const handleSignInClick = () => {
    router.push('/login')
  }

  const handleGoogleLogin = async () => {
    setLoginLoading("google")
    const { error } = await loginWithGoogle()
    setLoginLoading(null)

    if (error) {
      toast({
        title: "Eroare la autentificare cu Google",
        description: error.message,
        variant: "destructive",
      })
    } else {
      setIsLoginModalOpen(false)
    }
  }

  const handleGitHubLogin = async () => {
    setLoginLoading("github")
    const { error } = await loginWithGitHub()
    setLoginLoading(null)

    if (error) {
      toast({
        title: "Eroare la autentificare cu GitHub",
        description: error.message,
        variant: "destructive",
      })
    } else {
      setIsLoginModalOpen(false)
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
  const isProblemsCatalog = pathname === '/probleme'
  const isProblemPage = (pathname?.match(/^\/probleme\/[^/]+$/) ?? false) || isProblemsCatalog
  const isCoursePage = pathname?.startsWith('/cursuri') ?? false
  const isBacSimulationsPage = pathname?.startsWith('/simulari-bac') ?? false
  // On mobile, navbar should never be transparent when at the top of the screen
  const isSpaceRoute = pathname === '/space'
  const isTransparent = isHomepage || (isTransparentRoute && !isScrolled && !isMobile) || isSpaceRoute

  // Homepage-specific navbar background based on scroll position
  const homepageNavbarBackground = isScrolled ? 'bg-[#111111]/90' : 'bg-transparent'

  const navTheme = isDashboard
    ? {
      background: 'bg-[#080808]',
      border: 'border-[#1a1a1a]',
      dropdownBackground: 'bg-[#080808]',
      dropdownBorder: 'border-[#1a1a1a]',
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
  const mobileCtaLabel = user ? 'Dashboard' : 'Sign up'

  const showBanner = !isHomepage && !isSpaceRoute

  return (
    <>
      <div className={`${isHomepage ? 'fixed' : 'fixed'} top-0 left-0 right-0 z-[300] flex flex-col animate-slide-down transition-transform duration-300 ${isHomepage && isNavbarHidden ? '-translate-y-full' : 'translate-y-0'}`}>
        {showBanner && (
          <div className="hidden lg:flex w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-2 px-4 text-center text-sm font-medium z-[301] shadow-sm items-center justify-center relative">
            <Link href="/concurs" className="hover:opacity-90 transition-opacity flex items-center gap-2 group">
              <span className="hidden sm:inline">🏆</span>
              <span className="font-semibold">Concurs online de Fizică</span>
              <span className="hidden sm:inline">•</span>
              <span>în curând pe PLANCK</span>
              <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              <span className="underline decoration-white/50 hover:decoration-white font-semibold">Află detalii</span>
            </Link>
          </div>
        )}
        <nav className={`w-full ${isHomepage && isScrolled ? 'backdrop-blur-md' : !isHomepage ? 'backdrop-blur-md' : ''} transition-all duration-300 ${navTheme.background} ${navTheme.border}`}>
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="relative h-16 flex items-center justify-between gap-6">
              {isMobile && (
                <div className="burger:hidden absolute left-0 top-0 h-full flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (user) {
                        router.push('/dashboard')
                      } else {
                        router.push('/register')
                      }
                    }}
                    className="inline-flex items-center justify-center rounded-md border border-white/90 text-white text-sm font-medium px-3 py-1.5 leading-tight min-h-0 bg-transparent transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                  >
                    {mobileCtaLabel}
                  </button>
                </div>
              )}
              {isMobile && (
                <Link
                  href="/"
                  className={`burger:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center text-white title-font animate-fade-in hover:text-gray-300 transition-colors ${isTransparent ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : ''
                    }`}
                >
                  <Rocket className="w-6 h-6" />
                </Link>
              )}
              {/* Logo + Navigation links */}
              <div className={`flex items-center h-full gap-6 flex-1 min-w-0`}>
                <Link
                  href="/"
                  className={`hidden burger:flex text-2xl font-bold text-white title-font animate-fade-in flex-shrink-0 items-center gap-2 hover:text-gray-300 transition-colors ${isTransparent ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : ''
                    }`}
                >
                  <Rocket className="w-6 h-6 text-white" />
                  <span className="hidden logo:block">PLANCK</span>
                </Link>

                {/* Keep links visible on md and up, even when search is hidden */}
                <div className={`hidden burger:flex items-center gap-1 animate-fade-in-delay-1 ${isTransparent ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : ''
                  }`}>
                  <div
                    className="relative"
                    onMouseEnter={() => setCoursesOpen(true)}
                    onMouseLeave={() => setCoursesOpen(false)}
                  >
                    <Link
                      href="/cursuri"
                      className="text-white hover:text-gray-500 pl-2.5 pr-1.5 py-2 text-sm font-medium flex items-center gap-0.5 transition-all duration-300 rounded-lg"
                    >
                      <BookOpen size={16} />
                      Cursuri
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${coursesOpen ? 'rotate-180' : ''}`} />
                    </Link>
                    <div className={`absolute left-0 top-full w-max z-[400] transition-all duration-200 ${coursesOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}
                    >
                      <div className={`rounded-lg ${navTheme.dropdownBackground} shadow-lg overflow-hidden`}>
                        <div className="grid grid-cols-3 gap-2 p-3 w-[600px]">
                          <button
                            onClick={() => router.push('/cursuri')}
                            className="group flex-1 rounded-lg bg-white/5 px-3 py-2 text-left transition hover:bg-white/10 focus:outline-none flex items-center gap-3"
                          >
                            <Atom className="w-8 h-8 text-white" />
                            <span className="flex flex-col leading-snug">
                              <span className="text-[10px] font-medium uppercase tracking-tight text-gray-400 whitespace-nowrap">Cursuri de</span>
                              <span className="text-sm font-semibold text-white">Fizică Liceu</span>
                            </span>
                          </button>

                          <div className="group flex-1 rounded-lg bg-white/5 px-3 py-2 text-left flex items-center gap-3 opacity-50 cursor-not-allowed">
                            <Magnet className="w-8 h-8 text-white" />
                            <span className="flex flex-col leading-snug">
                              <span className="text-[10px] font-medium uppercase tracking-tight text-gray-400 whitespace-nowrap">Cursuri de</span>
                              <span className="text-sm font-semibold text-white">Fizică Gimnaziu</span>
                            </span>
                          </div>

                          <div className="group flex-1 rounded-lg bg-white/5 px-3 py-2 text-left flex items-center gap-3 opacity-50 cursor-not-allowed">
                            <Code className="w-8 h-8 text-white" />
                            <span className="flex flex-col leading-snug">
                              <span className="text-[10px] font-medium uppercase tracking-tight text-gray-400 whitespace-nowrap">Cursuri de</span>
                              <span className="text-sm font-semibold text-white">Informatică 9-11</span>
                            </span>
                          </div>

                          <button
                            onClick={() => router.push('/simulari-bac')}
                            className="group flex-1 rounded-lg bg-white/5 px-3 py-2 text-left transition hover:bg-white/10 focus:outline-none flex items-center gap-3"
                          >
                            <FileText className="w-8 h-8 text-white" />
                            <span className="flex flex-col leading-snug">
                              <span className="text-[10px] font-medium uppercase tracking-tight text-gray-400 whitespace-nowrap">Pregătire</span>
                              <span className="text-sm font-semibold text-white">Simulări Bac</span>
                            </span>
                          </button>

                          <button
                            onClick={() => router.push('/grile')}
                            className="group flex-1 rounded-lg bg-white/5 px-3 py-2 text-left transition hover:bg-white/10 focus:outline-none flex items-center gap-3"
                          >
                            <CheckSquare className="w-8 h-8 text-white" />
                            <span className="flex flex-col leading-snug">
                              <span className="text-[10px] font-medium uppercase tracking-tight text-gray-400 whitespace-nowrap">Exersare</span>
                              <span className="text-sm font-semibold text-white">Teste Grilă</span>
                            </span>
                          </button>

                          <button
                            onClick={() => router.push('/space')}
                            className="group flex-1 rounded-lg bg-white/5 px-3 py-2 text-left transition hover:bg-white/10 focus:outline-none flex items-center gap-3"
                          >
                            <BrainCircuit className="w-8 h-8 text-white" />
                            <span className="flex flex-col leading-snug">
                              <span className="text-[10px] font-medium uppercase tracking-tight text-gray-400 whitespace-nowrap">Instrumente</span>
                              <span className="text-sm font-semibold text-white">Memorator</span>
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="relative"
                    onMouseEnter={() => setProblemsOpen(true)}
                    onMouseLeave={() => setProblemsOpen(false)}
                  >
                    <Link
                      href="/probleme"
                      className="text-white hover:text-gray-500 pl-2 pr-1.5 py-2 text-sm font-medium flex items-center gap-0.5 transition-all duration-300 rounded-lg"
                    >
                      <Calculator size={16} />
                      Probleme
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${problemsOpen ? 'rotate-180' : ''}`} />
                    </Link>
                    <div className={`absolute left-0 top-full min-w-[280px] z-[400] transition-all duration-200 ${problemsOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}
                    >
                      <div className={`rounded-lg ${navTheme.dropdownBackground} shadow-lg overflow-hidden`}>
                        <div className="flex items-stretch gap-2 p-3">
                          <button
                            onClick={() => goToProblemsWith('Toate', 'Toate')}
                            className="group flex-[1.15] rounded-lg bg-white/5 px-3 py-2 text-left transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 flex items-center gap-3"
                          >
                            <span className="text-3xl leading-none text-white" aria-hidden>⚛</span>
                            <span className="flex flex-col leading-snug">
                              <span className="text-[10px] font-medium uppercase tracking-tight text-gray-400 whitespace-nowrap">Probleme de</span>
                              <span className="text-sm font-semibold text-white">Fizică</span>
                            </span>
                          </button>
                          <div
                            className="group flex-1 rounded-lg bg-white/5 px-3 py-2 text-left flex items-center gap-3 opacity-50 cursor-not-allowed"
                          >
                            <span className="text-3xl leading-none text-white" aria-hidden>⌨</span>
                            <span className="flex flex-col leading-snug">
                              <span className="text-[10px] font-medium uppercase tracking-tight text-gray-400 whitespace-nowrap">Probleme de</span>
                              <span className="text-sm font-semibold text-white">Informatică</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/insight"
                    className="text-white hover:text-gray-500 px-3 py-2 text-sm font-medium transition-all duration-300 rounded-lg flex items-center gap-1"
                  >
                    <Sparkles size={16} />
                    Insight
                  </Link>
                  <Link
                    href="/planckcode"
                    className="text-white hover:text-gray-500 px-3 py-2 text-sm font-medium transition-all duration-300 rounded-lg flex items-center gap-1 whitespace-nowrap"
                  >
                    <Code size={16} />
                    Planck Code
                  </Link>
                  <Link
                    href="/sketch"
                    className="text-white hover:text-gray-500 px-3 py-2 text-sm font-medium transition-all duration-300 rounded-lg flex items-center gap-1.5 relative"
                  >
                    Sketch
                    <span className="absolute top-1.5 -right-0.5 inline-block">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <defs>
                          <linearGradient id="gradient-animated-desktop" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="20%" stopColor="#8b5cf6" />
                            <stop offset="40%" stopColor="#ec4899" />
                            <stop offset="60%" stopColor="#f59e0b" />
                            <stop offset="80%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#3b82f6" />
                            <animate attributeName="x1" values="0%;100%;0%" dur="3s" repeatCount="indefinite" />
                            <animate attributeName="x2" values="100%;200%;100%" dur="3s" repeatCount="indefinite" />
                          </linearGradient>
                        </defs>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#gradient-animated-desktop)" />
                      </svg>
                    </span>
                  </Link>
                  <Link
                    href="/pricing"
                    className="text-white hover:text-gray-500 px-3 py-2 text-sm font-medium transition-all duration-300 rounded-lg flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <CreditCard size={16} />
                    Pricing
                  </Link>
                </div>
              </div>

              {/* Search bar + Desktop Login/Profile Button - dreapta */}
              <div className={`hidden burger:flex items-center animate-fade-in-delay-2 justify-end gap-3 ${isTransparent ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : ''
                }`}>
                {/* Search triggers: 2xl full button, xl icon, hidden <=xl */}
                <button
                  onClick={() => setIsSearchDialogOpen(true)}
                  className="hidden 2xl:flex items-center gap-2 w-[360px] h-8 rounded-md bg-white/5 border border-white/10 px-3 text-sm text-gray-400"
                >
                  <SearchIcon className="w-4 h-4" />
                  <span className="flex-1 text-left">Search or jump to...</span>
                  <kbd className="px-1.5 py-0.5 text-xs bg-white/10 border border-white/10 rounded">/</kbd>
                </button>
                <button
                  onClick={() => setIsSearchDialogOpen(true)}
                  className="hidden xl:flex 2xl:hidden items-center justify-center w-8 h-8 rounded-md border border-white/10 text-gray-300 bg-white/5"
                  aria-label="Open search"
                >
                  <SearchIcon className="w-4 h-4" />
                </button>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 px-3 py-1.5 rounded transition">
                        <Avatar>
                          {profile?.user_icon ? (
                            <AvatarImage src={profile.user_icon} alt={profile?.nickname || profile?.name || user.email || "U"} />
                          ) : null}
                          <AvatarFallback>{(profile?.nickname || profile?.name || user.user_metadata?.name || user.email || "U").charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-white text-sm leading-tight">{profile?.nickname || profile?.name || user.user_metadata?.name || user.email}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium leading-tight ${subscriptionPlan === 'premium' ? 'text-orange-400' :
                              subscriptionPlan === 'plus' ? 'text-green-400' :
                                'text-gray-400'
                              }`}>
                              {subscriptionPlan === 'premium' ? 'premium' :
                                subscriptionPlan === 'plus' ? 'plus+' :
                                  'free'}
                            </span>
                            <span className="flex items-center gap-0.5 text-gray-400">
                              <Trophy className="w-3 h-3" />
                              <span className="text-xs">{userElo ?? 500}</span>
                            </span>
                          </div>
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={12} className={`z-[400] ${navTheme.dropdownBackground} ${navTheme.dropdownBorder}`}>
                      <DropdownMenuItem asChild>
                        <a href="/profil" className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 rounded-md transition-colors">Profil</a>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="block px-4 py-2 text-sm text-gray-500 cursor-not-allowed" disabled>
                        Clasa mea
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem asChild>
                        <button
                          onClick={async () => {
                            await logout()
                            toast({ title: "Te-ai delogat cu succes!" })
                            router.push("/")
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20"
                        >
                          Logout
                        </button>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSignInClick}
                      className="border-gray-600 text-white hover:border-gray-500 hover:text-gray-500 transition-all duration-300 flex items-center gap-2 bg-transparent"
                    >
                      Sign in
                    </Button>
                    <Link href="/register">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-white text-black hover:bg-gray-200 transition-all duration-300 flex items-center gap-2"
                      >
                        Sign up
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile menu button */}
              <div className={`burger:hidden absolute right-0 top-0 h-full flex items-center ${isTransparent ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : ''
                }`}>
                <button
                  onClick={() => {
                    // On dashboard, open sidebar if context is available
                    if (isDashboard && dashboardSidebar) {
                      dashboardSidebar.toggle()
                    } else {
                      // Normal behavior: toggle mobile menu
                      setIsOpen(!isOpen)
                    }
                  }}
                  className="inline-flex items-center justify-center w-10 h-10 text-gray-300 hover:text-white focus:outline-none transition-all duration-300"
                >
                  {isDashboard && dashboardSidebar
                    ? (dashboardSidebar.isOpen ? <X size={24} /> : <Menu size={24} />)
                    : (isOpen ? <X size={24} /> : <Menu size={24} />)
                  }
                </button>
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

          {/* Mobile Navigation */}
          {isOpen && !isDashboard && (
            <div className="burger:hidden animate-slide-down z-[100] relative">
              <div className={`px-2 pt-2 pb-3 space-y-1 sm:px-3 ${navTheme.dropdownBackground} backdrop-blur-md border-t ${navTheme.dropdownBorder}`}>
                <Link
                  href="/cursuri"
                  className="text-white hover:text-gray-500 block px-3 py-3 text-base font-medium transition-all duration-300 rounded-lg flex items-center gap-3"
                  onClick={() => setIsOpen(false)}
                >
                  <BookOpen size={20} />
                  Cursuri
                </Link>
                <Link
                  href="/simulari-bac"
                  className="text-white hover:text-gray-500 block px-3 py-3 text-base font-medium transition-all duration-300 rounded-lg flex items-center gap-3"
                  onClick={() => setIsOpen(false)}
                >
                  <FileText size={20} />
                  Simulări Bac
                </Link>
                <Link
                  href="/probleme"
                  className="text-white hover:text-gray-500 block px-3 py-3 text-base font-medium transition-all duration-300 rounded-lg flex items-center gap-3"
                  onClick={() => setIsOpen(false)}
                >
                  <Calculator size={20} />
                  Probleme
                </Link>
                <Link
                  href="/grile"
                  className="text-white hover:text-gray-500 block px-3 py-3 text-base font-medium transition-all duration-300 rounded-lg flex items-center gap-3"
                  onClick={() => setIsOpen(false)}
                >
                  <CheckSquare size={20} />
                  Grile
                </Link>
                <Link
                  href="/space"
                  className="text-white hover:text-gray-500 block px-3 py-3 text-base font-medium transition-all duration-300 rounded-lg flex items-center gap-3"
                  onClick={() => setIsOpen(false)}
                >
                  <BrainCircuit size={20} />
                  Memorator
                </Link>
                <Link
                  href="/sketch"
                  className="text-white hover:text-gray-500 block px-3 py-3 text-base font-medium transition-all duration-300 rounded-lg flex items-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  Sketch
                  <span className="inline-block">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <defs>
                        <linearGradient id="gradient-animated-mobile" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="20%" stopColor="#8b5cf6" />
                          <stop offset="40%" stopColor="#ec4899" />
                          <stop offset="60%" stopColor="#f59e0b" />
                          <stop offset="80%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#3b82f6" />
                          <animate attributeName="x1" values="0%;100%;0%" dur="3s" repeatCount="indefinite" />
                          <animate attributeName="x2" values="100%;200%;100%" dur="3s" repeatCount="indefinite" />
                        </linearGradient>
                      </defs>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#gradient-animated-mobile)" />
                    </svg>
                  </span>
                </Link>
                <Link
                  href="/pricing"
                  className="text-white hover:text-gray-500 block px-3 py-3 text-base font-medium transition-all duration-300 rounded-lg flex items-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  <CreditCard size={20} />
                  Pricing
                </Link>
                <div className="border-t border-gray-700 pt-3 mt-3">
                  {user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-white hover:text-gray-500 block px-3 py-3 text-base font-medium transition-all duration-300 rounded-lg flex items-center gap-3 w-full">
                          <Avatar>
                            {profile?.user_icon ? (
                              <AvatarImage src={profile.user_icon} alt={profile?.nickname || profile?.name || user.email || "U"} />
                            ) : null}
                            <AvatarFallback>{(profile?.nickname || profile?.name || user.user_metadata?.name || user.email || "U").charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="flex-1 text-left">{profile?.nickname || profile?.name || user.user_metadata?.name || user.email}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${subscriptionPlan === 'premium' ? 'text-orange-400' :
                              subscriptionPlan === 'plus' ? 'text-green-400' :
                                'text-gray-400'
                              }`}>
                              {subscriptionPlan === 'premium' ? 'premium' :
                                subscriptionPlan === 'plus' ? 'plus+' :
                                  'free'}
                            </span>
                            <span className="flex items-center gap-0.5 text-gray-400">
                              <Trophy className="w-3 h-3" />
                              <span className="text-xs">{userElo ?? 500}</span>
                            </span>
                          </div>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#21262d] border-gray-700">
                        <DropdownMenuItem asChild>
                          <a href="/profil" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">Profil</a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem asChild>
                          <button
                            onClick={async () => {
                              await logout()
                              toast({ title: "Te-ai delogat cu succes!" })
                              router.push("/")
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20"
                          >
                            Logout
                          </button>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setIsOpen(false)
                          handleSignInClick()
                        }}
                        className="text-white hover:text-gray-500 block px-3 py-3 text-base font-medium transition-all duration-300 rounded-lg border border-gray-600 text-center w-full"
                      >
                        Sign in
                      </button>
                      <Link
                        href="/register"
                        className="text-black bg-white hover:bg-gray-200 block px-3 py-3 text-base font-medium transition-all duration-300 rounded-lg text-center"
                        onClick={() => setIsOpen(false)}
                      >
                        Sign up
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>
      {showBanner && !isTransparentRoute && !isSpaceRoute && <div className="hidden lg:block h-9 w-full" />}
    </>
  )
}
