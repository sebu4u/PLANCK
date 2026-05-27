"use client"

import type { ReactNode } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const NAVBAR_INFO_TOOLTIP_DELAY_MS = 1000

interface NavbarInfoTooltipProps {
  useLightNav: boolean
  ariaLabel: string
  title: string
  description: ReactNode
  footer?: ReactNode
  children: ReactNode
  enabled?: boolean
}

export function NavbarInfoTooltip({
  useLightNav,
  ariaLabel,
  title,
  description,
  footer,
  children,
  enabled = true,
}: NavbarInfoTooltipProps) {
  if (!enabled) {
    return <>{children}</>
  }

  return (
    <TooltipProvider delayDuration={NAVBAR_INFO_TOOLTIP_DELAY_MS}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex cursor-default items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
            aria-label={ariaLabel}
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="center"
          sideOffset={10}
          className={cn(
            "z-[650] w-[240px] rounded-xl border px-3.5 py-3 text-left shadow-lg",
            useLightNav
              ? "border-gray-200 bg-white text-gray-900"
              : "border-gray-700 bg-[#161b22] text-gray-100"
          )}
        >
          <p className="text-sm font-semibold">{title}</p>
          <p
            className={cn(
              "mt-1.5 text-xs leading-relaxed",
              useLightNav ? "text-gray-600" : "text-gray-300"
            )}
          >
            {description}
          </p>
          {footer ? (
            <p
              className={cn(
                "mt-2 text-xs font-medium",
                useLightNav ? "text-emerald-700" : "text-emerald-400"
              )}
            >
              {footer}
            </p>
          ) : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
