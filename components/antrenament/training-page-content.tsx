"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { TrainingQuestionCard } from "@/components/antrenament/training-question-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, Loader2, Rocket, ChevronDown, Check } from "lucide-react"
import { ConcursNavbar } from "@/components/concurs/concurs-navbar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TrainingQuestion {
    id: string
    problem_number: number
    statement: string
    option1: string
    option2: string
    option3: string
    option4: string
    correct_option: number
    grade: number
    image_url?: string | null
}

import { useSearchParams } from "next/navigation"



export function TrainingPageContent() {
    const searchParams = useSearchParams()
    const [selectedGrade, setSelectedGrade] = useState<number>(9)
    const [questions, setQuestions] = useState<TrainingQuestion[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [scrollProgress, setScrollProgress] = useState(0)

    useEffect(() => {
        const handleScroll = () => {
            const totalScroll = document.documentElement.scrollHeight - window.innerHeight
            const currentScroll = window.scrollY
            const progress = (currentScroll / totalScroll) * 100
            setScrollProgress(Math.min(100, Math.max(0, progress)))
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    useEffect(() => {
        const gradeParam = searchParams.get("grade")
        if (gradeParam) {
            const grade = parseInt(gradeParam)
            if ([9, 10, 11].includes(grade)) {
                setSelectedGrade(grade)
            }
        }
    }, [searchParams])

    useEffect(() => {
        async function fetchQuestions() {
            setLoading(true)
            setError(null)
            try {
                const { data, error: supabaseError } = await supabase
                    .from('training_questions')
                    .select('*')
                    .eq('grade', selectedGrade)
                    .order('problem_number', { ascending: true })

                if (supabaseError) throw supabaseError

                setQuestions(data || [])
            } catch (err: any) {
                console.error("Error fetching questions:", err)
                // If table doesn't exist yet, we might get an error.
                // We'll show a friendly message.
                if (err.message?.includes('does not exist')) {
                    setError("Tabelul de intrebari nu a fost inca creat. Te rugam sa rulezi scriptul SQL.")
                } else {
                    setError("A aparut o eroare la incarcarea intrebarilor.")
                }
            } finally {
                setLoading(false)
            }
        }

        fetchQuestions()
    }, [selectedGrade])

    return (
        <div className="min-h-screen bg-white text-gray-900 pb-20">
            {/* Navbar from Concurs page */}
            <ConcursNavbar />

            {/* Background elements */}
            <div className="absolute top-0 left-0 right-0 h-screen z-0 overflow-hidden pointer-events-none">
                {/* Orange Glow from Top (inverted from concurs page) */}
                <div
                    className="absolute top-[-50%] left-1/2 -translate-x-1/2 w-[200%] h-[180%]"
                    style={{
                        background: 'radial-gradient(ellipse 70% 55% at 50% 25%, rgba(235, 115, 50, 1) 0%, rgba(235, 130, 60, 0.85) 8%, rgba(230, 120, 50, 0.7) 15%, rgba(220, 130, 60, 0.5) 25%, rgba(200, 140, 80, 0.3) 38%, rgba(200, 150, 100, 0.15) 50%, rgba(220, 180, 150, 0.05) 62%, transparent 72%)',
                    }}
                />
                {/* Secondary Orange Glow */}
                <div
                    className="absolute top-[-40%] left-1/2 -translate-x-1/2 w-[150%] h-[130%]"
                    style={{
                        background: 'radial-gradient(ellipse 60% 50% at 50% 20%, rgba(245, 100, 30, 1) 0%, rgba(240, 120, 40, 0.75) 10%, rgba(230, 140, 60, 0.5) 22%, rgba(220, 150, 80, 0.25) 38%, rgba(210, 160, 100, 0.08) 52%, transparent 65%)',
                    }}
                />
                {/* Glass Effect Overlay */}
                <div
                    className="absolute inset-0 backdrop-blur-[2px]"
                    style={{
                        background: 'linear-gradient(to top, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.2) 40%, rgba(255, 255, 255, 0.05) 70%, transparent 100%)',
                    }}
                />
            </div>

            {/* Vertical Progress Bar */}
            <div className="fixed left-6 top-1/2 -translate-y-1/2 h-[50vh] w-1.5 bg-gray-100 rounded-full overflow-hidden hidden lg:block z-40">
                <div
                    className="w-full bg-green-500 transition-all duration-150 ease-out rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                    style={{ height: `${scrollProgress}%` }}
                />
            </div>

            <main className="relative z-10 pt-28 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                        Subiecte de antrenament
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Pregătește-te pentru concurs cu probleme de nivelul clasei a {selectedGrade === 9 ? 'IX' : selectedGrade === 10 ? 'X' : 'XI'}-a.
                    </p>

                    {/* Grade Selector (Tabs) */}
                    <div className="flex justify-center">
                        <Tabs defaultValue={String(selectedGrade)} onValueChange={(val) => setSelectedGrade(parseInt(val))} className="w-full max-w-md">
                            <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-full p-1 h-auto">
                                {[9, 10, 11].map((grade) => (
                                    <TabsTrigger
                                        key={grade}
                                        value={String(grade)}
                                        className="rounded-full py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-500 hover:text-gray-700"
                                    >
                                        Clasa a {grade === 9 ? 'IX' : grade === 10 ? 'X' : 'XI'}-a
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                        <p className="text-gray-500">Se încarcă problemele...</p>
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-600">
                        <p>{error}</p>
                    </div>
                ) : questions.length === 0 ? (
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-12 text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400 shadow-sm border border-gray-100">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Nu există probleme momentan</h3>
                        <p className="text-gray-500">
                            Încă nu au fost adăugate probleme pentru această clasă. Revino în curând!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {questions.map((q) => (
                            <TrainingQuestionCard key={q.id} question={q} />
                        ))}
                    </div>
                )}

                {/* Back to Contest Button */}
                {!loading && !error && questions.length > 0 && (
                    <div className="mt-16 text-center">
                        <Link href="/concurs">
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-orange-500 to-orange-400 text-white hover:from-orange-600 hover:to-orange-500 transition-all duration-300 rounded-full px-10 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl hover:scale-105"
                            >
                                ← Înapoi la concurs
                            </Button>
                        </Link>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="relative z-10 w-full px-4 sm:px-8 lg:px-16 xl:px-24 py-12 bg-white border-t border-gray-200 mt-20">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-extrabold text-gray-900">PLANCK</span>
                        </div>

                        {/* Links */}
                        <div className="flex flex-wrap justify-center gap-6 text-sm">
                            <Link href="/termeni" className="text-gray-600 hover:text-orange-600 transition-colors">
                                Termeni și Condiții
                            </Link>
                            <Link href="/confidentialitate" className="text-gray-600 hover:text-orange-600 transition-colors">
                                Politica de Confidențialitate
                            </Link>
                            <Link href="/contact" className="text-gray-600 hover:text-orange-600 transition-colors">
                                Contact
                            </Link>
                        </div>

                        {/* Copyright */}
                        <p className="text-gray-500 text-sm">
                            © {new Date().getFullYear()} PLANCK. Toate drepturile rezervate.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
