"use client"

import { type CSSProperties } from "react"
import Image from "next/image"
import { ArrowRight, Loader2 } from "lucide-react"

type WelcomeBackOverlayProps = {
  username?: string
  onBackdropClick: () => void
  onCtaClick: () => void
  ctaLoading?: boolean
}

export function WelcomeBackOverlay({
  username,
  onBackdropClick,
  onCtaClick,
  ctaLoading = false,
}: WelcomeBackOverlayProps) {
  const displayName = username?.trim() || "Student"

  return (
    <div
      className="fixed inset-0 z-[540] bg-white"
      onClick={ctaLoading ? undefined : onBackdropClick}
      role="presentation"
    >
      <div
        className="mx-auto flex h-full w-full max-w-[980px] flex-col items-center justify-center px-4 pb-28"
        onClick={(event) => event.stopPropagation()}
      >
        <Image
          src="/streak-icon.png"
          alt="Streak icon"
          width={220}
          height={220}
          priority
          className="h-auto w-[170px] object-contain sm:w-[210px]"
        />

        <p className="mt-8 text-center text-[38px] font-extrabold leading-tight text-[#141414]">
          Bună, {displayName}!
        </p>
        <p className="mt-2 whitespace-nowrap text-center text-[24px] font-bold leading-tight text-[#141414] sm:text-[30px]">
          Să continuăm de unde ai rămas.
        </p>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 border-t border-[#e6e6e6] bg-white px-4 py-5 shadow-[0_-6px_18px_rgba(0,0,0,0.08)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto flex w-full max-w-[420px] justify-center">
        <button
          type="button"
          onClick={onCtaClick}
          disabled={ctaLoading}
          aria-busy={ctaLoading}
          className="dashboard-start-glow inline-flex min-h-12 w-full max-w-[260px] items-center justify-center rounded-full bg-[#383838] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_0_#282828] transition-[transform,box-shadow,opacity] hover:translate-y-1 hover:shadow-[0_1px_0_#282828] active:translate-y-1 active:shadow-[0_1px_0_#282828] disabled:cursor-not-allowed disabled:opacity-70"
          style={{ "--start-glow-tint": "rgba(255, 255, 255, 0.78)" } as CSSProperties}
        >
          <span className="relative z-[1] inline-flex items-center gap-2">
            {ctaLoading ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                Se încarcă...
              </>
            ) : (
              <>
                Rezolvă o problemă
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </span>
        </button>
        </div>
      </div>
    </div>
  )
}
