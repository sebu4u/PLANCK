"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import type { LucideIcon } from "lucide-react"
import { LogOut, MessageSquare, Settings, Sparkles, User } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  MOBILE_BOTTOM_NAV_HEIGHT,
  MOBILE_BOTTOM_NAV_ITEMS,
  MOBILE_BOTTOM_NAV_PARENT_ITEMS,
  MOBILE_BOTTOM_NAV_TEACHER_ITEMS,
} from "@/lib/mobile-app-nav"
import { useAuth } from "@/components/auth-provider"
import { CosmeticsAvatarFrame } from "@/components/planckpass/cosmetics-avatar-frame"
import { useEquippedCosmetics } from "@/components/planckpass/planckpass-inventory"
import { useToast } from "@/hooks/use-toast"

const PROFILE_MENU_ITEMS: Array<{
  id: string
  label: string
  icon: LucideIcon
  href: string | null
  danger?: boolean
}> = [
  { id: "profil", label: "Profil", icon: User, href: "/profil" },
  { id: "setari", label: "Setari", icon: Settings, href: "/profil?setari=1" },
  { id: "premium", label: "Premium", icon: Sparkles, href: "/abonament" },
  { id: "feedback", label: "Feedback", icon: MessageSquare, href: "/contact" },
  { id: "logout", label: "Deconecteaza-te", icon: LogOut, href: null, danger: true },
]

export type MobileBottomNavVariant = "light" | "dark"

interface MobileBottomNavProps {
  variant?: MobileBottomNavVariant
}

export function MobileBottomNav({ variant = "light" }: MobileBottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isTeacher, isParent, logout, profile, user } = useAuth()
  const cosmetics = useEquippedCosmetics()
  const { toast } = useToast()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const isDark = variant === "dark"

  const navItems = isTeacher
    ? MOBILE_BOTTOM_NAV_TEACHER_ITEMS
    : isParent
      ? MOBILE_BOTTOM_NAV_PARENT_ITEMS
      : MOBILE_BOTTOM_NAV_ITEMS

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false)
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [menuOpen])

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    toast({ title: "Te-ai delogat cu succes!" })
    router.push("/")
  }

  const profileMenu =
    mounted && menuOpen
      ? createPortal(
          <div className="fixed inset-0 z-[560] burger:hidden" role="presentation">
            <button
              type="button"
              aria-label="Închide meniul"
              className="absolute inset-0"
              onClick={() => setMenuOpen(false)}
            />
            <div
              role="menu"
              aria-label="Meniu profil"
              className="absolute right-3 w-[13.5rem] animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-150"
              style={{
                bottom: `calc(${MOBILE_BOTTOM_NAV_HEIGHT} + env(safe-area-inset-bottom, 0px) + 0.5rem)`,
              }}
            >
              <div
                className={cn(
                  "overflow-hidden rounded-2xl shadow-[0_12px_32px_rgba(15,23,42,0.14)]",
                  isDark
                    ? "border border-white/10 bg-[#181818]"
                    : "border border-[#e8eaed] bg-white",
                )}
              >
                {PROFILE_MENU_ITEMS.map((item) => {
                  const Icon = item.icon
                  const itemClass = cn(
                    "flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-[13px] font-medium transition-colors last:border-b-0",
                    isDark ? "border-b border-white/10" : "border-b border-[#f0f1f3]",
                    item.danger
                      ? isDark
                        ? "text-red-400 active:bg-red-500/10"
                        : "text-red-600 active:bg-red-50"
                      : isDark
                        ? "text-white/85 active:bg-white/10"
                        : "text-[#191919] active:bg-[#f5f6f8]",
                  )

                  if (item.href) {
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className={itemClass}
                      >
                        <Icon className="h-4 w-4 shrink-0 stroke-[1.75] text-current opacity-70" aria-hidden />
                        <span>{item.label}</span>
                      </Link>
                    )
                  }

                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className={itemClass}
                    >
                      <Icon className="h-4 w-4 shrink-0 stroke-[1.75] text-current opacity-70" aria-hidden />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <nav
        aria-label="Navigare principală"
        className={cn(
          "fixed inset-x-0 bottom-0 z-[300] overflow-visible pb-[env(safe-area-inset-bottom,0px)] burger:hidden",
          isDark ? "border-t border-white/10 bg-[#181818]" : "bg-white",
        )}
      >
        <div className="relative flex h-[4.5rem] items-stretch">
          {navItems.map(({ href, label, icon: Icon, isActive, elevated, imageSrc, hideLabel }) => {
            const active = isActive(pathname)
            const isProfileTab = href === "/profil"
            const tabClass = cn(
              "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 transition-colors",
              isDark
                ? active || (isProfileTab && menuOpen)
                  ? "text-white"
                  : "text-white/45"
                : active || (isProfileTab && menuOpen)
                  ? "text-blue-600"
                  : "text-gray-500",
            )

            if (isProfileTab) {
              const avatarUrl =
                cosmetics.icon?.imageUrl || (profile?.user_icon as string | undefined) || ""
              const avatarInitial = (
                profile?.nickname ||
                profile?.name ||
                user?.email ||
                "U"
              )
                .charAt(0)
                .toUpperCase()
              const hasCosmeticBorder = Boolean(
                cosmetics.borderPresetId || cosmetics.border?.imageUrl,
              )

              return (
                <button
                  key={href}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Deschide meniul profil"
                  onClick={() => setMenuOpen((open) => !open)}
                  className={tabClass}
                >
                  <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                    <CosmeticsAvatarFrame
                      size={20}
                      borderPresetId={cosmetics.borderPresetId}
                      borderImageUrl={
                        cosmetics.borderPresetId ? null : cosmetics.border?.imageUrl
                      }
                      className="shrink-0"
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt=""
                          width={20}
                          height={20}
                          className={cn(
                            "h-full w-full object-cover",
                            !hasCosmeticBorder && "rounded-full",
                          )}
                          draggable={false}
                        />
                      ) : Icon ? (
                        <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      ) : (
                        <span
                          className={cn(
                            "flex h-full w-full items-center justify-center text-[8px] font-semibold",
                            isDark
                              ? "bg-white/10 text-white/70"
                              : "bg-gray-200 text-gray-600",
                            !hasCosmeticBorder && "rounded-full",
                          )}
                        >
                          {avatarInitial}
                        </span>
                      )}
                    </CosmeticsAvatarFrame>
                  </span>
                  {hideLabel ? null : (
                    <span className="truncate text-[10px] font-medium leading-tight">{label}</span>
                  )}
                </button>
              )
            }

            return (
              <Link key={href} href={href} className={tabClass}>
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
      {profileMenu}
    </>
  )
}
