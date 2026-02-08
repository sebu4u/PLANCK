"use client"

import Link from "next/link"
import { Play, Plus, CheckSquare, Code, Brain } from "lucide-react"
import type { ContinueLearningItem, Project } from "@/lib/dashboard-data"

interface QuickActionsRowProps {
    lastLesson?: ContinueLearningItem
    userGrade?: string | null
    lastProject?: Project | null
}

export function QuickActionsRow({ lastLesson, userGrade, lastProject }: QuickActionsRowProps) {
    // Determine course link
    const courseLink = lastLesson?.url || "/cursuri"

    // Determine quizzes link
    const quizLink = userGrade ? `/grile?grade=${userGrade}` : "/grile"

    // Determine project link
    const projectLink = lastProject
        ? `/planckcode/ide?id=${lastProject.id}`
        : "/planckcode/ide"

    const projectText = lastProject
        ? "Continua ultimul proiect"
        : "Incepe primul proiect"

    const projectSubtext = lastProject?.name || "C++ Playground"

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-3 md:mb-6">
            {/* 1. Continua cursuri */}
            <Link href={courseLink} className="block group">
                <div className="h-full bg-[#181818] border border-white/5 rounded-xl p-4 hover:bg-[#222222] hover:border-white/10 transition-all duration-300 flex flex-col justify-between relative overflow-hidden md:hover:scale-[1.02] transform origin-center">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                            <Play className="w-4 h-4 fill-current" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-white/40 mb-1 font-medium tracking-wide">Cursuri</p>
                        <p className="text-sm text-white/90 font-medium leading-tight group-hover:text-blue-400 transition-colors">
                            Continuă de unde ai rămas
                        </p>
                    </div>
                    {/* Hover glow */}
                    <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-blue-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </Link>

            {/* 2. Creeaza whiteboard nou */}
            <Link href="/sketch/new" className="block group">
                <div className="h-full bg-[#181818] border border-white/5 rounded-xl p-4 hover:bg-[#222222] hover:border-white/10 transition-all duration-300 flex flex-col justify-between relative overflow-hidden md:hover:scale-[1.02] transform origin-center">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                            <Plus className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-white/40 mb-1 font-medium tracking-wide">Sketch</p>
                        <p className="text-sm text-white/90 font-medium leading-tight group-hover:text-emerald-400 transition-colors">
                            Creează whiteboard nou
                        </p>
                    </div>
                    {/* Hover glow */}
                    <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-emerald-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </Link>

            {/* 3. Continua grile */}
            <Link href={quizLink} className="block group">
                <div className="h-full bg-[#181818] border border-white/5 rounded-xl p-4 hover:bg-[#222222] hover:border-white/10 transition-all duration-300 flex flex-col justify-between relative overflow-hidden md:hover:scale-[1.02] transform origin-center">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                            <CheckSquare className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-white/40 mb-1 font-medium tracking-wide">Grile</p>
                        <p className="text-sm text-white/90 font-medium leading-tight group-hover:text-orange-400 transition-colors">
                            Rezolvă teste grilă
                        </p>
                    </div>
                    {/* Hover glow */}
                    <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-orange-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </Link>

            {/* 4a. Memorator – doar pe mobil (în loc de PlanckCode) */}
            <Link href="/space" className="block group md:hidden">
                <div className="h-full bg-[#181818] border border-white/5 rounded-xl p-4 hover:bg-[#222222] hover:border-white/10 transition-all duration-300 flex flex-col justify-between relative overflow-hidden hover:scale-[1.02] transform origin-center">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                            <Brain className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-white/40 mb-1 font-medium tracking-wide">Memorator</p>
                        <p className="text-sm text-white/90 font-medium leading-tight group-hover:text-violet-400 transition-colors">
                            Formule și concepte
                        </p>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-violet-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </Link>

            {/* 4b. Ultimul proiect PlanckCode – doar de la md în sus */}
            <Link href={projectLink} className="hidden md:block group">
                <div className="h-full bg-[#181818] border border-white/5 rounded-xl p-4 hover:bg-[#222222] hover:border-white/10 transition-all duration-300 flex flex-col justify-between relative overflow-hidden md:hover:scale-[1.02] transform origin-center">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                            <Code className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-white/40 mb-1 font-medium tracking-wide">PlanckCode</p>
                        <div className="flex flex-col">
                            <p className="text-sm text-white/90 font-medium leading-tight group-hover:text-purple-400 transition-colors truncate">
                                {projectText}
                            </p>
                            {lastProject && (
                                <p className="text-[10px] text-white/30 truncate mt-0.5">
                                    {projectSubtext}
                                </p>
                            )}
                        </div>
                    </div>
                    {/* Hover glow */}
                    <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-purple-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </Link>
        </div>
    )
}
