"use client"

import { TestBatteryIcon } from "@/components/invata/test-battery-icon"
import { cn } from "@/lib/utils"
import { LP_TEST_MAX_BATTERIES } from "@/hooks/use-lp-test-battery-state"

interface LpTestBatteryStripProps {
  count: number
  max?: number
  variant?: "default" | "compact"
  useLightNav?: boolean
}

export function LpTestBatteryStrip({
  count,
  max = LP_TEST_MAX_BATTERIES,
  variant = "default",
  useLightNav = false,
}: LpTestBatteryStripProps) {
  if (variant === "compact") {
    const filledClass = useLightNav ? "text-emerald-600" : "text-emerald-400"
    const emptyClass = useLightNav ? "text-gray-400" : "text-gray-500"

    return (
      <div className="inline-flex items-center gap-1.5">
        {Array.from({ length: max }).map((_, index) => {
          const filled = index < count
          return (
            <TestBatteryIcon
              key={index}
              filled={filled}
              className={cn(filled ? filledClass : emptyClass)}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {Array.from({ length: max }).map((_, index) => {
        const filled = index < count
        return (
          <div
            key={index}
            className={
              "flex h-12 w-10 flex-col items-center justify-center rounded-md border-2 transition-colors sm:h-14 sm:w-11 " +
              (filled
                ? "border-emerald-400 bg-emerald-50 text-emerald-600"
                : "border-[#d1d5db] bg-[#f3f4f6] text-[#9ca3af]")
            }
            aria-label={filled ? "Baterie disponibilă" : "Baterie consumată"}
          >
            <TestBatteryIcon filled={filled} className="h-10 w-10 sm:h-11 sm:w-11" />
          </div>
        )
      })}
    </div>
  )
}
