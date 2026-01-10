"use client"

import Link from "next/link"
import { BookOpen, Clock, Sparkles } from "lucide-react"

export interface RecommendedLesson {
    id: string
    title: string
    chapter_title: string
    grade_number: number
    estimated_duration: number | null
    slug: string
}

interface LearnPhysicsCardProps {
    lessons: RecommendedLesson[]
}

export function LearnPhysicsCard({ lessons = [] }: LearnPhysicsCardProps) {
    if (!lessons || lessons.length === 0) {
        return (
            <div className="rounded-xl bg-[#131316] border border-white/10 p-4 hover:border-white/20 transition-all">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h3 className="text-base font-semibold text-white/90">Învață fizica mai ușor</h3>
                </div>
                <p className="text-sm text-white/50">Se încarcă lecțiile...</p>
            </div>
        )
    }

    return (
        <div className="rounded-xl bg-[#131316] border border-white/10 p-4 hover:border-white/20 transition-all hover:scale-105 transform origin-center">
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-base font-semibold text-white/90">Învață fizica mai ușor</h3>
            </div>

            <div className="space-y-2">
                {lessons.map((lesson) => (
                    <Link
                        key={lesson.id}
                        href={`/cursuri/${lesson.slug}`}
                        className="block p-3 bg-white/[0.03] rounded-lg border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all group"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white/90 truncate group-hover:text-purple-300 transition-colors">
                                    {lesson.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-white/50">
                                        Clasa a {lesson.grade_number}-a
                                    </span>
                                    <span className="text-white/30">•</span>
                                    <span className="text-xs text-white/50 truncate">
                                        {lesson.chapter_title}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-white/40 shrink-0">
                                {lesson.estimated_duration && (
                                    <>
                                        <Clock className="w-3 h-3" />
                                        <span className="text-xs">{lesson.estimated_duration} min</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <Link
                href="/cursuri"
                className="mt-3 flex items-center justify-center gap-2 p-2 text-xs text-white/60 hover:text-white/90 transition-colors"
            >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Vezi toate lecțiile</span>
            </Link>
        </div>
    )
}
