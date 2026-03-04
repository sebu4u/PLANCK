export function ProblemCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-[#0b0c0f]/10 bg-white p-5 shadow-[0px_16px_34px_-28px_rgba(11,12,15,0.65)] animate-pulse">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-[#0b0c0f]/10" />
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-6 w-16 rounded-full bg-[#0b0c0f]/10" />
            <div className="h-6 w-14 rounded-full bg-[#0b0c0f]/10" />
            <div className="h-4 w-10 rounded bg-[#0b0c0f]/10" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-[#0b0c0f]/10" />
          <div className="h-4 w-11/12 rounded bg-[#0b0c0f]/10" />
          <div className="h-4 w-3/4 rounded bg-[#0b0c0f]/10" />
          <div className="h-4 w-1/2 rounded bg-[#0b0c0f]/10" />
        </div>
      </div>
      <div className="mt-auto flex items-center gap-2">
        <div className="h-10 w-full rounded-full bg-[#0b0c0f]/10 sm:w-36" />
        <div className="h-4 w-16 shrink-0 rounded bg-[#0b0c0f]/10" />
      </div>
    </div>
  )
}
