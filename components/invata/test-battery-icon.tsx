"use client"

import { cn } from "@/lib/utils"

interface TestBatteryIconProps {
  filled: boolean
  className?: string
}

/** Baterie cilindrică (stil AA), ușor înclinată pe diagonală. */
export function TestBatteryIcon({ filled, className }: TestBatteryIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-9 w-9 shrink-0 -rotate-[38deg]", className)}
      aria-hidden
    >
      <rect
        x="10"
        y="6"
        width="12"
        height="22"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
        fill={filled ? "currentColor" : "none"}
        fillOpacity={filled ? 0.22 : 0}
      />
      <rect
        x="13"
        y="3"
        width="6"
        height="4"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="2"
        fill={filled ? "currentColor" : "none"}
        fillOpacity={filled ? 0.35 : 0}
      />
      {filled ? (
        <path
          d="M16 12v8M13 16h6"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M13.5 22.5L18.5 13.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          opacity={0.85}
        />
      )}
    </svg>
  )
}
