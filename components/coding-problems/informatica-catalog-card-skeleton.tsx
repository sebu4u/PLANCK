export function InformaticaCatalogCardSkeleton({ variant = "grid" }: { variant?: "grid" | "list" }) {
  if (variant === "list") {
    return (
      <div className="flex w-full animate-pulse flex-row items-center gap-3 rounded-lg border border-[#0b0c0f]/10 bg-white px-3 py-3 shadow-[0px_8px_20px_-18px_rgba(11,12,15,0.5)] md:gap-4 md:px-4 md:py-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 md:gap-3">
          <div className="h-8 w-8 shrink-0 rounded-md bg-[#0b0c0f]/10 md:h-9 md:w-9" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3.5 w-2/5 rounded bg-[#0b0c0f]/10" />
            <div className="h-3 w-full rounded bg-[#0b0c0f]/10" />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="h-3 w-8 rounded bg-[#0b0c0f]/10" />
          <div className="h-5 w-14 rounded-full bg-[#0b0c0f]/10" />
          <div className="h-5 w-12 rounded-full bg-[#0b0c0f]/10" />
          <div className="h-3 w-16 rounded bg-[#0b0c0f]/10" />
          <div className="h-4 w-4 rounded bg-[#0b0c0f]/10" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-[#0b0c0f]/10 bg-white p-5 shadow-[0px_16px_34px_-28px_rgba(11,12,15,0.65)] animate-pulse">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-[#0b0c0f]/10" />
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-6 w-16 rounded-full bg-[#0b0c0f]/10" />
            <div className="h-6 w-14 rounded-full bg-[#0b0c0f]/10" />
            <div className="h-6 w-20 rounded-full bg-[#0b0c0f]/10" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-4/5 rounded bg-[#0b0c0f]/10" />
          <div className="h-4 w-full rounded bg-[#0b0c0f]/10" />
          <div className="h-4 w-11/12 rounded bg-[#0b0c0f]/10" />
          <div className="h-4 w-2/3 rounded bg-[#0b0c0f]/10" />
        </div>
      </div>
      <div className="mt-auto">
        <div className="h-10 w-full rounded-full bg-[#0b0c0f]/10 sm:w-44" />
      </div>
    </div>
  )
}
