"use client"

import { cn } from "@/lib/utils"
import { PLANCK_WEEK_CTA } from "@/lib/planck-week"

const CTA_CLASS =
  "inline-flex items-center justify-center rounded-full bg-[#7C5CFC] font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter] duration-200 hover:brightness-110 active:brightness-[0.98]"

export function PlanckWeekCtaButton({
  onClick,
  className,
  size = "default",
}: {
  onClick: () => void
  className?: string
  size?: "default" | "full"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        CTA_CLASS,
        size === "full"
          ? "h-12 w-full px-5 text-sm"
          : "h-12 px-5 text-[15px] sm:h-14 sm:px-8 sm:text-base",
        className,
      )}
    >
      {PLANCK_WEEK_CTA}
    </button>
  )
}
