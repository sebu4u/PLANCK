"use client"

import type { ReactNode } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useIsMobile } from "@/hooks/use-mobile"
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

function NavbarInfoCardContent({
  useLightNav,
  title,
  description,
  footer,
}: Pick<NavbarInfoTooltipProps, "useLightNav" | "title" | "description" | "footer">) {
  return (
    <>
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
    </>
  )
}

const navbarInfoCardClassName = (useLightNav: boolean) =>
  cn(
    "z-[650] w-[240px] rounded-xl border px-3.5 py-3 text-left shadow-lg",
    useLightNav
      ? "border-gray-200 bg-white text-gray-900"
      : "border-gray-700 bg-[#161b22] text-gray-100"
  )

export function NavbarInfoTooltip({
  useLightNav,
  ariaLabel,
  title,
  description,
  footer,
  children,
  enabled = true,
}: NavbarInfoTooltipProps) {
  const isMobile = useIsMobile()

  if (!enabled) {
    return <>{children}</>
  }

  const cardProps = { useLightNav, title, description, footer }

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex touch-manipulation cursor-pointer items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
            aria-label={ariaLabel}
          >
            {children}
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="center"
          sideOffset={10}
          className={navbarInfoCardClassName(useLightNav)}
        >
          <NavbarInfoCardContent {...cardProps} />
        </PopoverContent>
      </Popover>
    )
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
          className={navbarInfoCardClassName(useLightNav)}
        >
          <NavbarInfoCardContent {...cardProps} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
