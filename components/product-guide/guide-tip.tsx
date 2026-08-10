"use client"

import { cn } from "@/lib/utils"
import { MOBILE_BOTTOM_NAV_OFFSET_CLASS } from "@/lib/mobile-app-nav"

type GuideTipProps = {
  title: string
  body: string
  onDismiss: () => void
  /** When true, tip sits under a spotlight hole (more compact bottom placement). */
  withSpotlight?: boolean
  className?: string
}

export function GuideTip({
  title,
  body,
  onDismiss,
  withSpotlight = false,
  className,
}: GuideTipProps) {
  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-[360px]",
        !withSpotlight && MOBILE_BOTTOM_NAV_OFFSET_CLASS,
        className,
      )}
      role="dialog"
      aria-label={title}
    >
      <div className="rounded-3xl border border-[#e8eaed] bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.14)] animate-in fade-in slide-in-from-bottom-3 duration-200 sm:p-5">
        <p className="text-sm font-bold text-[#111111] sm:text-base">{title}</p>
        <p className="mt-1.5 text-[13px] leading-snug text-[#5f5f5f] sm:text-sm">{body}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-4 w-full rounded-full bg-[#111111] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_3px_0_#000000] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_1px_0_#000000] active:translate-y-0.5 active:shadow-[0_1px_0_#000000]"
        >
          Am înțeles
        </button>
      </div>
    </div>
  )
}
