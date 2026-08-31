"use client"

import { cn } from "@/lib/utils"
import { usePrizeCouponCountdown } from "@/hooks/use-prize-coupon-countdown"

function pad(value: number) {
  return String(value).padStart(2, "0")
}

type PrizeCouponExpiryTimerProps = {
  expiresAt?: string | null
  redeemedAt?: string | null
  compact?: boolean
  className?: string
}

export function PrizeCouponExpiryTimer({
  expiresAt,
  redeemedAt,
  compact = false,
  className,
}: PrizeCouponExpiryTimerProps) {
  const { days, hours, minutes, seconds, expired } = usePrizeCouponCountdown(expiresAt)

  if (redeemedAt || !expiresAt) return null

  if (expired) {
    return (
      <p className={cn("font-semibold text-red-600", compact ? "text-[10px]" : "text-xs", className)}>
        Cuponul a expirat
      </p>
    )
  }

  return (
    <p
      className={cn(
        "font-semibold text-[#c2410c]",
        compact ? "text-[10px] leading-none" : "text-xs",
        className,
      )}
    >
      {compact ? "Expiră" : "Expiră în"}{" "}
      <span className="tabular-nums font-black">
        {days}
        <span className={compact ? "ml-0.5 mr-0.5 text-[8px] font-bold uppercase" : "mx-0.5 font-bold"}>
          z
        </span>
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    </p>
  )
}
