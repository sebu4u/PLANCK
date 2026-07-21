"use client"

import { useCallback, useState } from "react"
import dynamic from "next/dynamic"
import { Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

const TrophyRoadOverlay = dynamic(
  () =>
    import("@/components/trophy-road/trophy-road-overlay").then(
      (mod) => mod.TrophyRoadOverlay,
    ),
  { ssr: false },
)

interface NavbarEloDisplayProps {
  userElo: number | null
  useLightNav: boolean
  className?: string
  iconClassName?: string
  valueClassName?: string
  enabled?: boolean
}

export function NavbarEloDisplay({
  userElo,
  useLightNav,
  className,
  iconClassName = "h-3.5 w-3.5",
  valueClassName,
  enabled = true,
}: NavbarEloDisplayProps) {
  const elo = userElo ?? 500
  const secondaryText = useLightNav ? "text-gray-600" : "text-gray-300"
  const [open, setOpen] = useState(false)

  const handleOpen = useCallback(() => {
    if (!enabled) return
    setOpen(true)
  }, [enabled])

  const handleClose = useCallback(() => setOpen(false), [])

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={!enabled}
        aria-label={`Trophy Road — ${elo} trofee`}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-1 text-xs font-medium transition-opacity",
          secondaryText,
          className,
          enabled ? "cursor-pointer hover:opacity-80" : "cursor-default opacity-60",
        )}
      >
        <Trophy className={iconClassName} />
        <span className={valueClassName}>{elo}</span>
      </button>

      {open ? (
        <TrophyRoadOverlay open={open} onClose={handleClose} userElo={elo} />
      ) : null}
    </>
  )
}
