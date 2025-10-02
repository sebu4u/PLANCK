"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Menu, X, BookOpen, Calculator, Rocket, LogIn, Search as SearchIcon, Loader2, ArrowUpRight, ChevronDown } from "lucide-react"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type SearchResultItem = { type: 'problem' | 'lesson'; id: string; title: string; url: string }

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [coursesOpen, setCoursesOpen] = useState(false)
  const [problemsOpen, setProblemsOpen] = useState(false)
  const { user, logout, loading, profile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  // Desktop search state
  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
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
  const [popoverWidth, setPopoverWidth] = useState<number | null>(null)

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
    } catch {}
    if (typeof window !== 'undefined' && window.location && window.location.pathname.startsWith('/probleme')) {
      try {
        window.dispatchEvent(new Event('problemFiltersUpdated'))
      } catch {}
      // Trigger a soft refresh for visual feedback
      try { router.refresh() } catch {}
    } else {
      router.push("/probleme")
    }
  }

  const goToCoursesWith = (classLabel: string) => {
    try {
      sessionStorage.setItem('physicsSelectedClass', classLabel)
    } catch {}
    if (typeof window !== 'undefined' && window.location && window.location.pathname.startsWith('/cursuri')) {
      try { window.dispatchEvent(new Event('physicsClassSelected')) } catch {}
      try { router.refresh() } catch {}
    } else {
      router.push('/cursuri')
    }
  }

  const syncPopoverWidth = useCallback(() => {
    const inputEl = inputRef.current
    if (!inputEl) return
    const rect = inputEl.getBoundingClientRect()
    if (rect.width > 0) {
      setPopoverWidth((prev) => (prev !== rect.width ? rect.width : prev))
    }
  }, [])

  useEffect(() => {
    syncPopoverWidth()

    const inputEl = inputRef.current
    if (!inputEl) return

    const observer = new ResizeObserver(() => syncPopoverWidth())
    observer.observe(inputEl)
    window.addEventListener('resize', syncPopoverWidth)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncPopoverWidth)
    }
  }, [syncPopoverWidth])

  const performSearch = useCallback(async (searchQuery: string, options?: { offset?: number; append?: boolean }) => {
    const q = searchQuery.trim()
    const offset = options?.offset ?? 0
    const append = options?.append ?? false

    if (!append) {
      setHighlightIndex(-1)
    }

    if (!q || q.length < 2) {
      if (!append) {
        setSearchOpen(false)
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
        setSearchOpen(true)
        syncPopoverWidth()
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
        setSearchOpen(false)
        setResults([])
        setIsSearching(false)
        setIsLoadingMore(false)
        setHasMore(false)
        setNextOffset(0)
        return
      }
      if (nextQuery.length < 2) {
        setSearchOpen(false)
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
    if (!searchOpen) return
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
  }, [searchOpen, hasMore, isLoadingMore, loadMoreResults])

  const handleSelect = (url: string) => {
    setSearchOpen(false)
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
    setSearchOpen(false)
    setHasMore(false)
    setNextOffset(0)
    setIsLoadingMore(false)
    setIsSearching(false)
    setHighlightIndex(-1)
    inputRef.current?.focus()
  }, [])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      if (query.trim().length >= 2) {
        setSearchOpen(true)
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
      setSearchOpen(false)
    }
  }

  if (loading) {
    // Poți returna un skeleton sau null pentru a nu afișa login/profil până nu știm starea userului
    return null
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-[300] bg-white/90 backdrop-blur-md border-b border-purple-200 animate-slide-down">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-2 xl:px-2 2xl:px-2">
        <div className="relative h-16 flex items-center justify-between gap-6">
          {/* Logo + Desktop search & links */}
          <div className="flex items-center h-full gap-6 flex-1 min-w-0">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent title-font animate-fade-in flex-shrink-0 flex items-center gap-2"
            >
              <Rocket className="w-6 h-6 text-purple-600" />
              PLANCK
            </Link>
            {/* Desktop-only search placed next to logo (hide on md screens) */}
            <div className="hidden lg:block w-[280px] flex-shrink-0">
              <Popover open={searchOpen && query.trim().length >= 2} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <div className="w-full">
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => {
                          const value = e.target.value
                          setQuery(value)
                          cacheRef.current.delete(`${value.toLowerCase()}::0`)
                          syncPopoverWidth()
                          performSearch(value)
                        }}
                        onFocus={async () => {
                          if (query.trim().length < 2) {
                            return
                          }
                          if (results.length === 0) {
                            await performSearch(query)
                          }
                          setSearchOpen(true)
                        }}
                        onKeyDown={onKeyDown}
                        placeholder="Caută probleme sau lecții..."
                        className="pl-9 pr-12 border-purple-200 focus-visible:ring-purple-400"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center pointer-events-none">
                        {isSearching ? (
                          <Loader2 className="h-4 w-4 text-gray-400 animate-[spin_1.5s_linear_infinite]" />
                        ) : query.trim().length > 0 ? (
                          <button
                            type="button"
                            onClick={handleClear}
                            className="pointer-events-auto p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 transition"
                            aria-label="Șterge căutarea"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="p-0 rounded-xl border border-purple-100 shadow-lg"
                  style={{ width: popoverWidth ?? inputRef.current?.getBoundingClientRect().width ?? 360 }}
                  sideOffset={8}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <div ref={resultsRef} className="max-h-80 overflow-auto scrollbar-hide">
                    {query.trim().length >= 2 && results.length === 0 && (
                      <div className="px-3 py-3 text-sm text-gray-500">Nu s-au găsit rezultate</div>
                    )}
                    {results.map((r, idx) => (
                      <button
                        key={`${r.type}-${r.id}`}
                        onClick={() => handleSelect(r.url)}
                        className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition ${highlightIndex === idx ? 'bg-purple-50' : 'hover:bg-purple-50'} ${idx !== results.length - 1 ? 'border-b border-purple-100/70' : ''}`}
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${r.type === 'lesson' ? 'bg-pink-100 text-pink-700' : 'bg-purple-100 text-purple-700'}`}>
                          {r.type === 'lesson' ? <BookOpen className="w-3.5 h-3.5" /> : <Calculator className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                          <p className="text-[11px] text-gray-500">{r.type === 'lesson' ? 'Lecție' : 'Problemă'}</p>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    ))}
                    {isLoadingMore && (
                      <div className="px-3 py-3 text-xs text-gray-500 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Se încarcă mai multe...
                      </div>
                    )}
                    {!isLoadingMore && hasMore && results.length > 0 && (
                      <div className="px-3 py-3 text-[11px] text-gray-500 text-center">
                        Derulează pentru a vedea mai multe rezultate
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Keep links visible on md and up, even when search is hidden */}
            <div className="hidden md:flex items-center gap-4 animate-fade-in-delay-1">
              <div
                className="relative"
                onMouseEnter={() => setCoursesOpen(true)}
                onMouseLeave={() => setCoursesOpen(false)}
              >
                <Link
                  href="/cursuri"
                  className="text-gray-700 hover:text-purple-600 pl-2.5 pr-1.5 py-2 text-sm font-medium flex items-center gap-0.5 transition-all durata
300 hover:scale-105 space-hover rounded-lg"
                >
                  <BookOpen size={16} />
                  Cursuri
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${coursesOpen ? 'rotate-180' : ''}`} />
                </Link>
                <div className={`absolute left-0 top-full w-64 z-[400] transition-all duration-200 ${coursesOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}
                >
                  <div className="rounded-xl border border-purple-100 bg-white shadow-lg overflow-hidden">
                    <div className="py-2">
                      <button onClick={() => goToCoursesWith('Toate')} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50">
                        <BookOpen className="h-4 w-4 text-purple-600" />
                        Toate cursurile
                      </button>
                      <div className="h-px bg-purple-100" />
                      <button onClick={() => goToCoursesWith('a 9-a')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50">{classEmoji['a 9-a']} Clasa a 9-a</button>
                      <button disabled aria-disabled="true" className="block w-full text-left px-4 py-2 text-sm text-gray-400 cursor-not-allowed">{classEmoji['a 10-a']} Clasa a 10-a (în curând)</button>
                      <button disabled aria-disabled="true" className="block w-full text-left px-4 py-2 text-sm text-gray-400 cursor-not-allowed">{classEmoji['a 11-a']} Clasa a 11-a (în curând)</button>
                      <button disabled aria-disabled="true" className="block w-full text-left px-4 py-2 text-sm text-gray-400 cursor-not-allowed">{classEmoji['a 12-a']} Clasa a 12-a (în curând)</button>
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
                  className="text-gray-700 hover:text-purple-600 pl-2 pr-1.5 py-2 text-sm font-medium flex items-center gap-0.5 transition-all durata
300 hover:scale-105 space-hover rounded-lg"
                >
                  <Calculator size={16} />
                  Probleme
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${problemsOpen ? 'rotate-180' : ''}`} />
                </Link>
                <div className={`absolute left-0 top-full w-64 z-[400] transition-all duration-200 ${problemsOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}
                >
                  <div className="rounded-xl border border-purple-100 bg-white shadow-lg overflow-hidden">
                    <div className="py-2">
                      <button onClick={() => goToProblemsWith('Toate', 'Toate')} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50">
                        <Calculator className="h-4 w-4 text-purple-600" />
                        Toate problemele
                      </button>
                      <div className="h-px bg-purple-100" />
                      {problemShortcuts.map((s) => (
                        <button
                          key={s.classLabel + s.chapter}
                          onClick={() => goToProblemsWith(s.classLabel, s.chapter)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                        >
                          {(chapterEmoji[s.chapter] || '📘') + ' ' + s.chapter}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <Link
                href="/despre"
                className="text-gray-700 hover:text-purple-600 px-3 py-2 text-sm font-medium transition-all durata
300 hover:scale-105 space-hover rounded-lg"
              >
                Despre
              </Link>
            </div>
          </div>

          {/* Desktop Login/Profile Button - dreapta */}
          <div className="hidden md:flex items-center animate-fade-in-delay-2 justify-end">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded hover:bg-purple-50 transition">
                    <Avatar>
                      {profile?.user_icon ? (
                        <AvatarImage src={profile.user_icon} alt={profile?.nickname || profile?.name || user.email || "U"} />
                      ) : null}
                      <AvatarFallback>{(profile?.nickname || profile?.name || user.user_metadata?.name || user.email || "U").charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-gray-800">{profile?.nickname || profile?.name || user.user_metadata?.name || user.email}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a href="/profil" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-100">Profil</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="block px-4 py-2 text-sm text-gray-400 cursor-not-allowed" disabled>
                    Clasa mea
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <button
                      onClick={async () => {
                        await logout()
                        toast({ title: "Te-ai delogat cu succes!" })
                        router.push("/")
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/register">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-purple-300 hover:border-purple-500 hover:text-purple-600 transition-all duration-300 hover:scale-105 flex items-center gap-2 bg-transparent"
                >
                  <LogIn size={16} />
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden absolute right-0 top-0 h-full flex items-center pr-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-purple-600 focus:outline-none transition-all duration-300 hover:scale-110"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden animate-slide-down z-[100] relative">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/95 backdrop-blur-md">
            <Link
              href="/cursuri"
              className="text-gray-700 hover:text-purple-600 block px-3 py-3 text-base font-medium transition-all duration-300 rounded-lg hover:bg-purple-50 flex items-center gap-3"
              onClick={() => setIsOpen(false)}
            >
              <BookOpen size={20} />
              Cursuri
            </Link>
            <Link
              href="/probleme"
              className="text-gray-700 hover:text-purple-600 block px-3 py-3 text-base font-medium transition-all duration-300 rounded-lg hover:bg-purple-50 flex items-center gap-3"
              onClick={() => setIsOpen(false)}
            >
              <Calculator size={20} />
              Probleme
            </Link>
            <Link
              href="/despre"
              className="text-gray-700 hover:text-purple-600 block px-3 py-3 text-base font-medium transition-all duration-300 rounded-lg hover:bg-purple-50"
              onClick={() => setIsOpen(false)}
            >
              Despre
            </Link>
            <button
              className="text-gray-400 cursor-not-allowed block px-3 py-3 text-base font-medium transition-all duration-300 rounded-lg w-full text-left"
              disabled
            >
              Clasa mea
            </button>
            <div className="border-t border-gray-200 pt-3 mt-3">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-gray-700 hover:text-purple-600 block px-3 py-3 text-base font-medium transition-all duration-300 rounded-lg hover:bg-purple-50 flex items-center gap-3">
                      <Avatar>
                        {profile?.user_icon ? (
                          <AvatarImage src={profile.user_icon} alt={profile?.nickname || profile?.name || user.email || "U"} />
                        ) : null}
                        <AvatarFallback>{(profile?.nickname || profile?.name || user.user_metadata?.name || user.email || "U").charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>{profile?.nickname || profile?.name || user.user_metadata?.name || user.email}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <a href="/profil" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-100">Profil</a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <button
                        onClick={async () => {
                          await logout()
                          toast({ title: "Te-ai delogat cu succes!" })
                          router.push("/")
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  href="/register"
                  className="text-gray-700 hover:text-purple-600 block px-3 py-3 text-base font-medium transition-all duration-300 rounded-lg hover:bg-purple-50 flex items-center gap-3"
                  onClick={() => setIsOpen(false)}
                >
                  <LogIn size={20} />
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
