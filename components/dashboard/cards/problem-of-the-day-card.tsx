"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import type { DailyChallenge } from "@/lib/dashboard-data"

const DIFFICULTY_STYLES: Record<string, string> = {
    "Ușor": "border-emerald-300 bg-emerald-50 text-emerald-700",
    "Mediu": "border-amber-300 bg-amber-50 text-amber-700",
    "Avansat": "border-rose-300 bg-rose-50 text-rose-700",
    "Concurs": "border-indigo-300 bg-indigo-50 text-indigo-700",
}

interface ProblemOfTheDayCardProps {
    challenge: DailyChallenge | null
}

export function ProblemOfTheDayCard({ challenge }: ProblemOfTheDayCardProps) {
    const [timeLeft, setTimeLeft] = useState("")

    useEffect(() => {
        const updateTimeLeft = () => {
            const now = new Date()
            const tomorrow = new Date(now)
            tomorrow.setDate(tomorrow.getDate() + 1)
            tomorrow.setHours(0, 0, 0, 0)

            const diff = tomorrow.getTime() - now.getTime()

            const hours = Math.floor(diff / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)

            setTimeLeft(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            )
        }

        updateTimeLeft()
        const interval = setInterval(updateTimeLeft, 1000)
        return () => clearInterval(interval)
    }, [])

    if (!challenge) return null

    // Normalize difficulty to Romanian
    const normalizeDifficulty = (diff: string): string => {
        const normalized = diff.toLowerCase()
        if (normalized === 'easy' || normalized === 'ușor') return 'Ușor'
        if (normalized === 'medium' || normalized === 'mediu') return 'Mediu'
        if (normalized === 'hard' || normalized === 'avansat') return 'Avansat'
        if (normalized === 'concurs') return 'Concurs'
        return 'Mediu' // default
    }

    const difficulty = normalizeDifficulty(challenge.difficulty || "Mediu")
    const difficultyStyle = DIFFICULTY_STYLES[difficulty] || DIFFICULTY_STYLES["Mediu"]
    const shortSnippet = challenge.description
        ? challenge.description.split(" ").slice(0, 7).join(" ") + "..."
        : "Rezolvă o problemă nouă..."

    return (
        <Link href={`/probleme/${challenge.problem_id || challenge.id}`} className="block h-full">
            <Card className="relative h-20 w-full overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:border-gray-300 md:hover:scale-[1.02] transform origin-center group">

                {/* Content Side */}
                <div className="flex h-full items-center justify-between pl-6 pr-0">
                    <div className="flex flex-col gap-1 relative z-10 max-w-[70%]">

                        <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-3">
                            <h3 className="text-sm font-semibold text-gray-900">
                                <span className="md:hidden">Începe aici</span>
                                <span className="hidden md:inline">Rezolvă problema următoare</span>
                            </h3>

                            <div className="flex items-center gap-3">
                                <Badge className={`rounded-full border px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider ${difficultyStyle}`}>
                                    {difficulty}
                                </Badge>

                                <span className="text-xs font-mono text-gray-500">
                                    #{challenge.problem_id || challenge.id}
                                </span>

                                <span className="text-xs font-mono text-amber-400/80">
                                    <span className="hidden md:inline">Expires in: </span>{timeLeft}
                                </span>
                            </div>
                        </div>

                        <p className="hidden md:block text-sm text-gray-600 font-medium truncate">
                            {shortSnippet}
                        </p>
                    </div>

                    {/* Image Side */}
                    <div className="absolute right-0 top-0 bottom-0 w-1/3 h-full overflow-hidden">
                        {/* Gradient Overlay for Fade Effect - Using color matching card bg */}
                        <div className="absolute inset-0 z-10 bg-gradient-to-r from-white via-white/10 to-transparent" />

                        <Image
                            src="/pxl.png"
                            alt="Problem of the day"
                            fill
                            className="object-cover object-center opacity-80 group-hover:scale-105 transition-transform duration-500"
                        />
                    </div>
                </div>
            </Card>
        </Link>
    )
}
