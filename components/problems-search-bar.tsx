"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, ChevronDown } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"

interface Problem {
    id: string
    title: string
    statement: string
    difficulty: string
    category: string
    class?: number
}

const classOptions = ["Toate", "a 9-a", "a 10-a", "a 11-a", "a 12-a"]

const chapterOptions: Record<string, string[]> = {
    "Toate": ["Toate"],
    "a 9-a": [
        "Toate",
        "Miscarea rectilinie si uniforma a punctului material",
        "Miscarea rectilinie uniform variata",
        "Principiile mecanicii",
        "Forta de frecare",
        "Legea atractiei universale",
        "Energia mecanica",
        "Elemente de statica",
        "Lentile",
    ],
    "a 10-a": [
        "Toate",
        "Legea gazului ideal",
        "Principiul 1 al termodinamicii",
        "Electrostatica",
        "Rezistenta electrica. Legea lui Ohm",
        "Gruparea rezistoarelor",
        "magnetism",
    ],
    "a 11-a": [
        "Toate",
        "Oscilații mecanice. Pendul gravitațional",
        "Unde mecanice",
        "circuite de curent alternativ",
        "Interferența luminii. Dispozitivul Young",
        "Difracția luminii",
    ],
    "a 12-a": [
        "Toate",
        "Efectul fotoelectric extern",
        "Modelul atomic",
        "Reacții nucleare",
        "Radiații nucleare",
    ]
}

const CLASS_MAP: Record<number, string> = {
    9: "a 9-a",
    10: "a 10-a",
    11: "a 11-a",
    12: "a 12-a"
}

const difficultyColors: Record<string, string> = {
    "Ușor": "text-emerald-400",
    "Mediu": "text-amber-400",
    "Avansat": "text-rose-400",
}

export function ProblemsSearchBar() {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedClass, setSelectedClass] = useState("Toate")
    const [selectedChapter, setSelectedChapter] = useState("Toate")
    const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false)
    const [isChapterDropdownOpen, setIsChapterDropdownOpen] = useState(false)
    const [searchResults, setSearchResults] = useState<Problem[]>([])
    const [isResultsOpen, setIsResultsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [allProblems, setAllProblems] = useState<Problem[]>([])

    const searchBarRef = useRef<HTMLDivElement>(null)
    const classDropdownRef = useRef<HTMLDivElement>(null)
    const chapterDropdownRef = useRef<HTMLDivElement>(null)

    // Fetch problems on mount
    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const { data } = await supabase
                    .from("problems")
                    .select("id, title, statement, difficulty, category, class")
                    .order("created_at", { ascending: false })
                    .limit(200)

                if (data) {
                    setAllProblems(data as Problem[])
                }
            } catch (error) {
                console.error("Error fetching problems:", error)
            }
        }
        fetchProblems()
    }, [])

    // Filter problems based on search and filters
    const filterProblems = useCallback(() => {
        if (!searchQuery && selectedClass === "Toate" && selectedChapter === "Toate") {
            setSearchResults([])
            setIsResultsOpen(false)
            return
        }

        setIsLoading(true)

        let filtered = [...allProblems]

        // Filter by class
        if (selectedClass !== "Toate") {
            filtered = filtered.filter(p => {
                const problemClass = CLASS_MAP[p.class as number]
                return problemClass === selectedClass
            })
        }

        // Filter by chapter
        if (selectedChapter !== "Toate") {
            filtered = filtered.filter(p =>
                p.category?.toLowerCase().includes(selectedChapter.toLowerCase())
            )
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(query) ||
                p.statement.toLowerCase().includes(query) ||
                p.id.toLowerCase().includes(query)
            )
        }

        setSearchResults(filtered.slice(0, 8))
        setIsResultsOpen(filtered.length > 0 || searchQuery.length > 0)
        setIsLoading(false)
    }, [searchQuery, selectedClass, selectedChapter, allProblems])

    useEffect(() => {
        const debounce = setTimeout(() => {
            filterProblems()
        }, 200)
        return () => clearTimeout(debounce)
    }, [filterProblems])

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
                setIsResultsOpen(false)
                setIsClassDropdownOpen(false)
                setIsChapterDropdownOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleClassSelect = (cls: string) => {
        setSelectedClass(cls)
        setSelectedChapter("Toate")
        setIsClassDropdownOpen(false)
    }

    const handleChapterSelect = (chapter: string) => {
        setSelectedChapter(chapter)
        setIsChapterDropdownOpen(false)
    }

    const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text
        return text.slice(0, maxLength) + "..."
    }

    return (
        <div ref={searchBarRef} className="relative w-full max-w-2xl mx-auto mb-12">
            {/* Search Bar */}
            <div className="flex items-center bg-[#2a2a2a] border border-white/10 rounded-full overflow-hidden h-12 shadow-lg">
                {/* Search Input (Now First) */}
                <div className="flex-1 flex items-center px-4">
                    <Search className="h-4 w-4 text-white/40 mr-3" />
                    <input
                        type="text"
                        placeholder="Caută probleme de fizică..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => {
                            if (searchQuery || selectedClass !== "Toate" || selectedChapter !== "Toate") {
                                filterProblems()
                            }
                        }}
                        className="flex-1 bg-transparent text-white placeholder:text-white/40 outline-none text-sm"
                    />
                </div>

                {/* Class Dropdown (Middle) */}
                <div className="relative border-l border-white/10" ref={classDropdownRef}>
                    <button
                        onClick={() => {
                            setIsClassDropdownOpen(!isClassDropdownOpen)
                            setIsChapterDropdownOpen(false)
                        }}
                        className="flex items-center gap-2 px-4 h-12 text-sm text-white/70 hover:text-white hover:bg-white/5 transition"
                    >
                        <span className="hidden sm:inline">{selectedClass}</span>
                        <span className="sm:hidden">Clasă</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isClassDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isClassDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-40 bg-[#1b1b1b] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                            {classOptions.map((cls) => (
                                <button
                                    key={cls}
                                    onClick={() => handleClassSelect(cls)}
                                    className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-white/10 ${selectedClass === cls ? 'text-white bg-white/10' : 'text-white/70'
                                        }`}
                                >
                                    {cls}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Chapter Dropdown (Right) */}
                <div className="relative border-l border-white/10" ref={chapterDropdownRef}>
                    <button
                        onClick={() => {
                            setIsChapterDropdownOpen(!isChapterDropdownOpen)
                            setIsClassDropdownOpen(false)
                        }}
                        disabled={selectedClass === "Toate"}
                        className="flex items-center gap-2 px-4 h-12 text-sm text-white/70 hover:text-white hover:bg-white/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="hidden sm:inline max-w-[120px] truncate">{selectedChapter}</span>
                        <span className="sm:hidden">Capitol</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isChapterDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isChapterDropdownOpen && selectedClass !== "Toate" && (
                        <div className="absolute top-full right-0 mt-2 w-64 max-h-60 overflow-y-auto bg-[#1b1b1b] border border-white/10 rounded-xl shadow-xl z-50">
                            {(chapterOptions[selectedClass] || ["Toate"]).map((chapter) => (
                                <button
                                    key={chapter}
                                    onClick={() => handleChapterSelect(chapter)}
                                    className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-white/10 ${selectedChapter === chapter ? 'text-white bg-white/10' : 'text-white/70'
                                        }`}
                                >
                                    {truncateText(chapter, 35)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Results Dropdown */}
            {isResultsOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1b1b1b] border border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden max-h-[400px] overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-white/50">
                            <div className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full mx-auto"></div>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <>
                            {searchResults.map((problem) => (
                                <Link
                                    key={problem.id}
                                    href={`/probleme/${problem.id}`}
                                    className="flex items-start gap-3 p-4 hover:bg-white/5 transition border-b border-white/5 last:border-b-0"
                                    onClick={() => setIsResultsOpen(false)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-medium ${difficultyColors[problem.difficulty] || 'text-white/60'}`}>
                                                {problem.difficulty}
                                            </span>
                                            <span className="text-xs text-white/40">•</span>
                                            <span className="text-xs text-white/50">{problem.category}</span>
                                            <span className="text-xs text-white/30 font-mono">ID {problem.id}</span>
                                        </div>
                                        <h4 className="text-sm font-medium text-white truncate">
                                            {problem.title}
                                        </h4>
                                        <p className="text-xs text-white/50 mt-1 line-clamp-1">
                                            {truncateText(problem.statement.replace(/\$[^$]+\$/g, ''), 80)}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                            <Link
                                href={`/probleme${selectedClass !== "Toate" ? `?class=${encodeURIComponent(selectedClass)}` : ''}`}
                                className="block p-3 text-center text-sm text-orange-400 hover:bg-white/5 transition font-medium"
                                onClick={() => setIsResultsOpen(false)}
                            >
                                Vezi toate problemele →
                            </Link>
                        </>
                    ) : (
                        <div className="p-6 text-center">
                            <p className="text-white/50 text-sm">Nu s-au găsit probleme</p>
                            <Link
                                href="/probleme"
                                className="inline-block mt-3 text-sm text-orange-400 hover:text-orange-300 transition"
                                onClick={() => setIsResultsOpen(false)}
                            >
                                Explorează catalogul complet →
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
