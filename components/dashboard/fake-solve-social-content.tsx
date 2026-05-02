"use client"

import { cn } from "@/lib/utils"
import type { FakeSolveNotification } from "@/lib/dashboard/fake-solve-social-proof"

interface FakeSolveSocialContentProps {
  notification: FakeSolveNotification
  href: string
  variant: "desktop" | "mobile"
}

export function FakeSolveSocialContent({ notification, href, variant }: FakeSolveSocialContentProps) {
  const isDesktop = variant === "desktop"

  return (
    <a
      href={href}
      className={cn(
        "group flex items-center gap-3 text-left outline-none transition-transform duration-200 hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-violet-400",
        isDesktop
          ? "w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-violet-100 bg-white px-4 py-3 text-[#111111] shadow-xl"
          : "pointer-events-auto w-full max-w-none justify-start py-1 pl-3 pr-0 text-left text-[#111111] drop-shadow-[0_3px_10px_rgba(15,23,42,0.14)] [text-shadow:0_1px_6px_rgba(255,255,255,0.82),0_4px_14px_rgba(15,23,42,0.2)]",
      )}
      aria-label={notification.message}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-black uppercase text-gray-800 ring-1 ring-gray-300/90 shadow-sm",
          isDesktop
            ? "h-8 w-8 ring-2 ring-white"
            : "h-7 w-7 drop-shadow-[0_2px_6px_rgba(15,23,42,0.08)]",
        )}
        aria-hidden="true"
      >
        {notification.avatarInitial}
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            "block tracking-[-0.01em]",
            isDesktop ? "text-sm font-bold" : "text-[12px] font-medium leading-snug",
          )}
        >
          {notification.message}
        </span>
        {isDesktop ? (
          <span className="mt-0.5 block text-xs font-medium text-[#4d4d4d]">
            Deschide problema
          </span>
        ) : null}
      </span>
    </a>
  )
}
