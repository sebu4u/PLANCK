"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { MOBILE_BOTTOM_NAV_ITEMS } from "@/lib/mobile-app-nav"

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navigare principală"
      className="fixed inset-x-0 bottom-0 z-[300] border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom,0px)] burger:hidden"
    >
      <div className="flex h-[4.5rem] items-stretch">
        {MOBILE_BOTTOM_NAV_ITEMS.map(({ href, label, icon: Icon, isActive }) => {
          const active = isActive(pathname)

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 transition-colors",
                active ? "text-blue-600" : "text-gray-500",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="truncate text-[10px] font-medium leading-tight">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
