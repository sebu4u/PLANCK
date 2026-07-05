"use client"

import type { CSSProperties } from "react"
import Image from "next/image"

type DashboardPremiumUpgradeCardProps = {
  onExploreClick: () => void
  className?: string
}

export function DashboardPremiumUpgradeCard({
  onExploreClick,
  className,
}: DashboardPremiumUpgradeCardProps) {
  return (
    <div
      className={
        className ??
        "mt-4 hidden rounded-3xl border border-[#e0e0e0] bg-gradient-to-r from-[#e8edf8] via-[#f5f2f8] to-[#fdf8ee] p-6 lg:block"
      }
    >
      <div className="flex items-start gap-3">
        <div className="relative h-12 w-12 flex-shrink-0">
          <Image
            src="/streak-icon.png"
            alt="Premium"
            fill
            className="object-contain"
            sizes="48px"
          />
        </div>
        <div className="min-w-0 pt-0.5">
          <p className="text-[17px] font-bold leading-tight text-black">
            Deblochează învățarea cu Premium
          </p>
          <p className="mt-1 text-[15px] font-normal leading-snug text-black">
            ca să înveți mai rapid, mai bine
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onExploreClick}
        className="dashboard-start-glow mt-5 inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-bold text-[#101117] shadow-[0_4px_0_var(--premium-accent-dark)] transition-[transform,box-shadow,opacity] hover:translate-y-0.5 hover:shadow-[0_2px_0_var(--premium-accent-dark)] active:translate-y-0.5 active:shadow-[0_2px_0_var(--premium-accent-dark)]"
        style={
          {
            "--premium-accent-dark": "#9a5aa8",
            "--start-glow-tint": "rgba(248, 220, 228, 0.88)",
            backgroundImage: "linear-gradient(to right, #8f91f1, #cd83db, #f2b93d)",
          } as CSSProperties
        }
      >
        <span className="relative z-[1]">Explorează Premium</span>
      </button>
    </div>
  )
}
