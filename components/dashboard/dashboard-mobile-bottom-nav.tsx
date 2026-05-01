"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const ICON_BASE = "/images/icons"

function iconSrc(fileName: string) {
  return `${ICON_BASE}/${encodeURIComponent(fileName)}`
}

type DashboardMobileBottomNavProps = {
  userGrade?: string | null
}

export function DashboardMobileBottomNav({ userGrade }: DashboardMobileBottomNavProps) {
  const pathname = usePathname()
  const grileHref = userGrade ? `/grile?grade=${encodeURIComponent(userGrade)}` : "/grile"

  const items = [
    { href: "/cursuri", label: "Cursuri", icon: "Untitled design (42).png", prefix: "/cursuri" as const },
    { href: "/space", label: "Memorator", icon: "Untitled design (43).png", prefix: "/space" as const },
    { href: grileHref, label: "Grile", icon: "Untitled design (44).png", prefix: "/grile" as const },
    { href: "/simulari-bac", label: "Simulări BAC", icon: "Untitled design (45).png", prefix: "/simulari-bac" as const },
  ] as const

  function isRouteActive(prefix: string) {
    if (!pathname) return false
    return pathname === prefix || pathname.startsWith(`${prefix}/`)
  }

  return (
    <nav
      className="pointer-events-none fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-[280] px-3 lg:hidden"
      aria-label="Navigare rapidă dashboard"
    >
      <div className="pointer-events-auto mx-auto flex max-w-md items-center gap-1 rounded-[28px] border border-gray-200 bg-white p-1.5 shadow-[0_16px_45px_rgba(15,23,42,0.14)] ring-1 ring-black/[0.04]">
        {items.map(({ href, label, icon, prefix }) => {
          const active = isRouteActive(prefix)

          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "relative flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 rounded-[22px] px-1.5 py-2 text-center transition-all duration-200",
                active
                  ? "bg-[#f3f4f6] text-[#111111] shadow-[inset_0_0_0_1px_rgba(17,17,17,0.04)]"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
              )}
            >
              <span
                className={cn(
                  "relative h-7 w-7 shrink-0 transition-transform duration-200",
                  active ? "scale-105" : "opacity-80",
                )}
              >
                <Image
                  src={iconSrc(icon)}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="32px"
                />
              </span>
              <span
                className={cn(
                  "max-w-full truncate text-[10px] font-semibold leading-none tracking-[-0.01em]",
                  active ? "text-gray-950" : "text-gray-500",
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
