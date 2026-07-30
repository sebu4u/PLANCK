"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  MOBILE_BOTTOM_NAV_ITEMS,
  MOBILE_BOTTOM_NAV_PARENT_ITEMS,
  MOBILE_BOTTOM_NAV_TEACHER_ITEMS,
} from "@/lib/mobile-app-nav"
import { useAuth } from "@/components/auth-provider"

export function MobileBottomNav() {
  const pathname = usePathname()
  const { isTeacher, isParent } = useAuth()

  const navItems = isTeacher
    ? MOBILE_BOTTOM_NAV_TEACHER_ITEMS
    : isParent
      ? MOBILE_BOTTOM_NAV_PARENT_ITEMS
      : MOBILE_BOTTOM_NAV_ITEMS

  return (
    <nav
      aria-label="Navigare principală"
      className="fixed inset-x-0 bottom-0 z-[300] overflow-visible bg-white pb-[env(safe-area-inset-bottom,0px)] burger:hidden"
    >
      <div className="relative flex h-[4.5rem] items-stretch">
        {navItems.map(({ href, label, icon: Icon, isActive, elevated, imageSrc, hideLabel }) => {
          const active = isActive(pathname)

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 transition-colors",
                active ? "text-blue-600" : "text-gray-500",
              )}
            >
              <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt=""
                    width={elevated ? 28 : 20}
                    height={elevated ? 28 : 20}
                    className={cn(
                      "object-contain",
                      elevated ? "absolute bottom-0 h-7 w-7 -translate-y-2.5" : "h-5 w-5",
                    )}
                  />
                ) : Icon ? (
                  <Icon
                    className={cn(
                      "shrink-0",
                      elevated ? "absolute bottom-0 h-6 w-6 -translate-y-2.5" : "h-5 w-5",
                    )}
                    aria-hidden
                  />
                ) : null}
              </span>
              {hideLabel ? null : (
                <span className="truncate text-[10px] font-medium leading-tight">{label}</span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
