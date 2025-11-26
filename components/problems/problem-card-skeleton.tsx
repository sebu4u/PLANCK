export function ProblemCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-[0px_24px_70px_-40px_rgba(0,0,0,1)] animate-pulse">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2">
          <div className="row-span-2 h-14 w-14 rounded-2xl bg-white/10" />
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="h-4 w-28 rounded bg-white/10" />
            <div className="h-6 w-32 rounded-full bg-white/10" />
            <div className="h-6 w-28 rounded-full bg-white/10" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <div className="h-5 w-24 rounded-full bg-white/10" />
            <div className="h-5 w-20 rounded-full bg-white/10" />
          </div>
        </div>
        <div className="h-4 w-full rounded bg-gray-600/30" />
        <div className="h-4 w-3/4 rounded bg-gray-600/30" />
      </div>
      <div className="mt-auto flex items-center gap-2">
        <div className="h-10 w-full rounded-full bg-white/10 sm:w-40" />
        <div className="h-4 w-20 rounded bg-white/10" />
      </div>
    </div>
  )
}










































