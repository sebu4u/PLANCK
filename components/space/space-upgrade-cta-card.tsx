"use client"

import Link from "next/link"

type SpaceUpgradeCtaCardProps = {
  onClose: () => void
  ctaHref?: string
}

export function SpaceUpgradeCtaCard({ onClose, ctaHref = "/pricing" }: SpaceUpgradeCtaCardProps) {
  return (
    <div className="relative w-full max-w-[360px] rounded-2xl border border-white/10 bg-[#111114]/90 p-5 text-center text-white shadow-2xl backdrop-blur-md">
      <span className="text-[10px] font-semibold tracking-[0.3em] text-white/50">PLANCK</span>

      <h3 className="mt-3 text-lg font-semibold">Deblocheaza tot Memoratorul</h3>
      <p className="mt-2 text-sm text-white/70">
        Acces complet la toata platforma. Invata mai rapid si ia note mai mari.
      </p>

      <Link
        href={ctaHref}
        className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-white text-sm font-semibold text-black transition hover:bg-white/90"
      >
        Vezi planuri
      </Link>

      <button
        type="button"
        onClick={onClose}
        className="mt-3 text-xs font-medium text-white/50 transition hover:text-white/70"
      >
        Mai tarziu
      </button>
    </div>
  )
}
