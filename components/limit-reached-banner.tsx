"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

interface LimitReachedBannerProps {
    resetTime: string
}

export function LimitReachedBanner({ resetTime }: LimitReachedBannerProps) {
    const [timeLeft, setTimeLeft] = useState("")

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date()
            const reset = new Date(resetTime)
            const diff = reset.getTime() - now.getTime()

            if (diff <= 0) {
                setTimeLeft("acum")
                return
            }

            const hours = Math.floor(diff / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

            setTimeLeft(`${hours}h ${minutes}m`)
        }

        calculateTimeLeft()
        const interval = setInterval(calculateTimeLeft, 60000) // Update every minute

        return () => clearInterval(interval)
    }, [resetTime])

    return (
        <div className="mx-4 mb-4 p-4 rounded-xl bg-[#1a1a1a] border border-orange-500/20 shadow-lg animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-orange-400 font-medium">
                    <Clock className="w-4 h-4" />
                    <span>Ai atins limita zilnică</span>
                </div>
                <p className="text-sm text-gray-400">
                    Ai consumat cele 20 de mesaje gratuite.
                    <br />
                    Limita se resetează în <span className="text-white font-medium">{timeLeft}</span>.
                </p>
            </div>
        </div>
    )
}
