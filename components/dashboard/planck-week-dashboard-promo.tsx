"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import Link from "next/link"

import { PLANCK_WEEK_CTA, PLANCK_WEEK_DATES } from "@/lib/planck-week"
import { setPregatireBackTarget } from "@/lib/pregatire/back-target"

type PlanckWeekDashboardPromoProps = {
  onClose: () => void
}

export function PlanckWeekDashboardPromo({ onClose }: PlanckWeekDashboardPromoProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[515] flex items-center justify-center overflow-y-auto px-4 py-8 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="planck-week-dashboard-promo-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Închide"
        onClick={onClose}
      />

      <div className="relative z-10 my-auto w-full max-w-[400px]">
        <div className="relative overflow-hidden rounded-[28px] border border-black/10 bg-[linear-gradient(to_bottom,#c8e6ff_0%,#e8f4ff_16%,#ffffff_38%)] px-5 pb-6 pt-5 text-center shadow-[0_24px_60px_-24px_rgba(15,23,42,0.45)] sm:px-6 sm:pb-7 sm:pt-6">
          <div className="relative mx-auto h-[220px] w-full overflow-hidden sm:h-[240px]">
            <Image
              src="/planck-week.png"
              alt="Planck Week"
              fill
              priority
              sizes="400px"
              className="select-none object-cover object-center"
            />
          </div>

          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#5B47D6]">
            {PLANCK_WEEK_DATES}
          </p>

          <h2
            id="planck-week-dashboard-promo-title"
            className="mt-2 text-[1.65rem] font-black leading-tight tracking-tight text-gray-900 sm:text-[1.85rem]"
          >
            5 zile de meditații gratuite!
          </h2>

          <Link
            href="/pregatire"
            onClick={() => {
              setPregatireBackTarget("/dashboard")
              onClose()
            }}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#227F4F] px-5 text-[15px] font-bold text-white shadow-[0_4px_0_#1a5e3b] transition-[filter] duration-200 hover:brightness-110 active:brightness-[0.98] sm:h-14 sm:text-base"
          >
            {PLANCK_WEEK_CTA}
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="mt-3 text-xs font-medium text-black/50 transition hover:text-black/70"
          >
            nu mulțumesc
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
