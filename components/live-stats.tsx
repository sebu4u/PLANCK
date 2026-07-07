"use client"

import { useEffect, useState } from "react"
import {
  getNextPlaceholderOnlineUsers,
  getPlaceholderOnlineUsers,
  getPlaceholderProblemsSolved,
  PLACEHOLDER_ONLINE_USERS,
  PLACEHOLDER_PROBLEMS_SOLVED,
} from "@/lib/homepage-live-stats-placeholder"

type LiveStatsProps = {
  variant?: "dark" | "light"
  centerOnMobile?: boolean
  /** Skip scroll-triggered fade; show immediately (e.g. onboarding). */
  instant?: boolean
}

function formatCount(value: number) {
  return value.toLocaleString("ro-RO")
}

export function LiveStats({ variant = "dark", centerOnMobile = false, instant = false }: LiveStatsProps) {
  const isLight = variant === "light"
  const labelClassName = isLight ? "text-gray-600" : "text-gray-300"
  const valueClassName = isLight ? "text-gray-900" : "text-white"
  const [activeUsers, setActiveUsers] = useState(PLACEHOLDER_ONLINE_USERS)
  const [problemsSolved, setProblemsSolved] = useState(PLACEHOLDER_PROBLEMS_SOLVED)

  useEffect(() => {
    setActiveUsers(getPlaceholderOnlineUsers())
    setProblemsSolved(getPlaceholderProblemsSolved())

    const onlineIntervalId = window.setInterval(() => {
      setActiveUsers((current) => getNextPlaceholderOnlineUsers(current))
    }, 8_000)

    const problemsIntervalId = window.setInterval(() => {
      setProblemsSolved(getPlaceholderProblemsSolved())
    }, 60_000)

    return () => {
      window.clearInterval(onlineIntervalId)
      window.clearInterval(problemsIntervalId)
    }
  }, [])

  return (
    <div
      className={`flex flex-wrap items-center gap-x-6 gap-y-2 ${
        instant ? "mb-0" : "scroll-animate-fade-up mb-6"
      } ${centerOnMobile ? "justify-center lg:justify-start" : "justify-start"}`}
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
        <span className={`${labelClassName} text-sm font-medium`}>
          <span className={`${valueClassName} font-semibold`}>
            {formatCount(activeUsers)}
          </span>{" "}
          utilizatori online
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className={`${labelClassName} text-sm font-medium`}>
          <span className={`${valueClassName} font-semibold`}>
            {formatCount(problemsSolved)}
          </span>{" "}
          probleme rezolvate
        </span>
      </div>
    </div>
  )
}
