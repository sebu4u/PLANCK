"use client"

import { Trophy } from "lucide-react"
import { NavbarInfoTooltip } from "@/components/navbar-info-tooltip"
import { cn } from "@/lib/utils"

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

  const content = (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", secondaryText, className)}>
      <Trophy className={iconClassName} />
      <span className={valueClassName}>{elo}</span>
    </span>
  )

  return (
    <NavbarInfoTooltip
      useLightNav={useLightNav}
      enabled={enabled}
      ariaLabel={`ELO curent: ${elo}`}
      title="ELO-ul tău"
      description="Măsoară progresul tău în parcursul de învățare. Câștigi puncte când răspunzi corect la exerciții și teste."
      footer={`Ai ${elo} ELO.`}
    >
      {content}
    </NavbarInfoTooltip>
  )
}
