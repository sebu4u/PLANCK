"use client"

type PricingDiscountUrgencyBannerProps = {
  remainingLabel: string
}

export function PricingDiscountUrgencyBanner({ remainingLabel }: PricingDiscountUrgencyBannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto mt-4 w-full max-w-xl rounded-2xl border border-[#f5c2c7]/80 bg-gradient-to-r from-[#fff5f5] via-[#fff8f1] to-[#fff5f5] px-3.5 py-2.5 shadow-[0_10px_28px_rgba(185,28,28,0.08)] sm:mt-5 sm:px-4 sm:py-3"
    >
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
        <span className="inline-flex items-center rounded-full bg-gradient-to-r from-red-500 to-[#e11d48] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_4px_14px_rgba(239,68,68,0.45)] sm:text-[10px]">
          Ofertă unică −50%
        </span>
        <p className="text-center text-[12px] font-semibold leading-snug text-[#7f1d1d] sm:text-sm">
          Dispare în{" "}
          <span className="font-mono text-sm font-black tabular-nums tracking-tight text-[#b91c1c] sm:text-base">
            {remainingLabel}
          </span>
        </p>
      </div>
      <p className="mt-1 text-center text-[11px] leading-snug text-[#9f1239]/90 sm:text-xs">
        Jumătate din preț la orice plan — doar în această oră.
      </p>
    </div>
  )
}
