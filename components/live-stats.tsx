"use client"

import { useState, useEffect } from "react"

// Deterministic pseudo-random number generator using a seed
// This ensures all users see the same "random" values at the same time
function seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
}

// Calculate online users based on current time
// Fluctuates around 200, same for all users
function getOnlineUsers(timestamp: number): number {
    const seed = Math.floor(timestamp / 60000) // Changes every 60 seconds (once per minute)
    const baseUsers = 200
    const variation = Math.floor(seededRandom(seed) * 30) - 15 // -15 to +15
    return baseUsers + variation
}

// Calculate solved problems based on current date
// Starts at 8000 on a reference date and grows 20-30 per day
function getSolvedProblems(timestamp: number): number {
    // Reference date: Dec 28, 2025 (today) with 8000 problems
    const referenceDate = new Date('2025-12-28T00:00:00Z').getTime()
    const daysSinceReference = (timestamp - referenceDate) / (1000 * 60 * 60 * 24)

    // Calculate base problems (grows 25 problems per day on average)
    const baseProblems = 8000
    const dailyGrowth = Math.floor(daysSinceReference * 25)

    // Add intra-day variation (0-25 problems throughout the day)
    const dayProgress = (timestamp % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60 * 24)
    const intraDayProblems = Math.floor(dayProgress * 25)

    // Seed for small random variation
    const seed = Math.floor(timestamp / 30000) // Changes every 30 seconds
    const microVariation = Math.floor(seededRandom(seed) * 3) - 1 // -1 to +1

    return Math.max(8000, baseProblems + dailyGrowth + intraDayProblems + microVariation)
}

export function LiveStats() {
    const [onlineUsers, setOnlineUsers] = useState<number>(200)
    const [solvedProblems, setSolvedProblems] = useState<number>(8000)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)

        const updateStats = () => {
            const now = Date.now()
            setOnlineUsers(getOnlineUsers(now))
            setSolvedProblems(getSolvedProblems(now))
        }

        // Initial update
        updateStats()

        // Update every second for smooth real-time feel
        const interval = setInterval(updateStats, 1000)

        return () => clearInterval(interval)
    }, [])

    // Prevent hydration mismatch by showing static values until mounted
    if (!mounted) {
        return (
            <div className="flex items-center justify-center lg:justify-start gap-6 mb-6">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </span>
                    <span className="text-gray-300 text-sm font-medium">
                        <span className="text-white font-semibold">200</span> online
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-300 text-sm font-medium">
                        <span className="text-white font-semibold">8.000</span> probleme rezolvate
                    </span>
                </div>
            </div>
        )
    }

    // Format number with Romanian locale (dots for thousands)
    const formatNumber = (num: number): string => {
        return num.toLocaleString('ro-RO')
    }

    return (
        <div className="scroll-animate-fade-up flex items-center justify-center lg:justify-start gap-6 mb-6">
            {/* Online Users */}
            <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                    {/* Animated glow ring */}
                    <span
                        className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"
                        style={{ animationDuration: '2s' }}
                    ></span>
                    {/* Static glow */}
                    <span
                        className="absolute inline-flex h-full w-full rounded-full bg-green-400 blur-sm"
                    ></span>
                    {/* Solid dot */}
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-gray-300 text-sm font-medium">
                    <span className="text-white font-semibold tabular-nums transition-all duration-300">
                        {formatNumber(onlineUsers)}
                    </span> online
                </span>
            </div>

            {/* Solved Problems */}
            <div className="flex items-center gap-2">
                <span className="text-gray-300 text-sm font-medium">
                    <span className="text-white font-semibold tabular-nums transition-all duration-300">
                        {formatNumber(solvedProblems)}
                    </span> probleme rezolvate
                </span>
            </div>
        </div>
    )
}
