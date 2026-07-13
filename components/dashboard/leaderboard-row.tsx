"use client"

import { cn } from "@/lib/utils"

interface LeaderboardRowProps {
  rank: number
  name: string
  elo: number
  isUser: boolean
  className?: string
}

export function LeaderboardRow({ rank, name, elo, isUser, className }: LeaderboardRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-xl px-3 py-2.5",
        isUser
          ? "border border-emerald-200 bg-emerald-50/95 shadow-[0_8px_24px_rgba(16,185,129,0.12)]"
          : "border border-transparent bg-[#fafafa]",
        className,
      )}
    >
      <span className={cn("text-sm font-bold tabular-nums", isUser ? "text-emerald-700" : "text-[#9aa0b4]")}>
        {rank}
      </span>
      <span className={cn("truncate text-sm font-semibold", isUser ? "text-[#111111]" : "text-[#3d4255]")}>
        {name}
      </span>
      <span className="text-sm font-medium tabular-nums text-[#9aa0b4]">{elo}</span>
    </div>
  )
}
