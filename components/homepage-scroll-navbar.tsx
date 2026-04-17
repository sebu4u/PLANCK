"use client"

import Link from "next/link"
import { Rocket } from "lucide-react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

/**
 * Peste acest scroll, navbar-ul fix devine vizibil (hero rămâne cu navbar-ul lui de la început).
 */
const SCROLL_THRESHOLD_PX = 24

export function HomePageScrollNavbar() {
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const update = () => {
      setVisible(window.scrollY > SCROLL_THRESHOLD_PX)
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [])

  /**
   * Portal în document.body: pe homepage, ScrollAnimationProvider pune transform pe wrapper-ul
   * de conținut — un fixed în interior e „fix” față de acel layer, nu față de viewport, deci
   * navbar-ul dispărea la scroll. În body, position:fixed funcționează corect.
   */
  if (!mounted || typeof document === "undefined") {
    return null
  }

  return createPortal(
    <nav
      aria-hidden={!visible}
      className={`fixed inset-x-0 top-0 z-[60] border-b border-gray-200/90 bg-white/95 pt-[env(safe-area-inset-top)] shadow-sm backdrop-blur-md transition-[transform,opacity] duration-300 ease-out supports-[backdrop-filter]:bg-white/85 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"
      }`}
    >
      <div className="mx-auto flex h-[3.5rem] max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="title-font flex shrink-0 items-center gap-2 text-2xl font-bold text-gray-900 transition-colors hover:text-gray-700 sm:gap-2.5 sm:text-3xl"
        >
          <Rocket className="h-6 w-6 shrink-0 text-gray-900 sm:h-7 sm:w-7" />
          <span className="block font-black whitespace-nowrap">PLANCK</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden h-10 items-center rounded-full border-[3px] border-gray-400 px-5 text-sm font-semibold text-[#2f236f] transition-colors hover:border-gray-500 hover:bg-gray-50 sm:inline-flex sm:h-11 sm:px-6 sm:text-base"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[#29cc57] px-5 text-sm font-semibold text-white hover:bg-[#24b34e] sm:h-11 sm:px-7 sm:text-base"
          >
            Începe gratuit
          </Link>
        </div>
      </div>
    </nav>,
    document.body
  )
}
