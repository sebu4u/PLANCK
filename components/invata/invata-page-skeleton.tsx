import { Skeleton } from "@/components/ui/skeleton"

function LessonCardSkeleton() {
  return (
    <div className="flex w-[168px] shrink-0 flex-col items-center sm:w-[190px]">
      <Skeleton className="h-[142px] w-[142px] rounded-2xl bg-[#e6e6e6] sm:h-[162px] sm:w-[162px]" />
      <Skeleton className="mt-3 h-4 w-28 rounded bg-[#e6e6e6]" />
      <Skeleton className="mt-1.5 h-4 w-20 rounded bg-[#ececec]" />
    </div>
  )
}

function MobileLessonRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border-[3px] border-[#ececec] bg-white px-3.5 py-3.5 shadow-[0_4px_0_#e6e6e6]">
      <Skeleton className="h-14 w-14 shrink-0 rounded-lg bg-[#ececec]" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded bg-[#e6e6e6]" />
        <Skeleton className="h-2 w-full rounded-full bg-[#ececec]" />
      </div>
    </div>
  )
}

function ChapterSectionSkeleton({ withTopBorder = false }: { withTopBorder?: boolean }) {
  return (
    <section className={withTopBorder ? "border-t border-[#ececec] pt-10 sm:pt-10" : ""}>
      <div className="mb-5 sm:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-7 w-48 rounded bg-[#e6e6e6]" />
            <Skeleton className="h-4 w-full max-w-xs rounded bg-[#ececec]" />
          </div>
          <Skeleton className="h-20 w-20 shrink-0 rounded-xl bg-[#ececec]" />
        </div>
      </div>

      <div className="mb-5 hidden sm:flex sm:items-start sm:gap-5">
        <Skeleton className="h-24 w-24 shrink-0 rounded-xl bg-[#ececec] sm:h-28 sm:w-28" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-7 w-48 rounded bg-[#e6e6e6] sm:w-64" />
          <Skeleton className="h-4 w-full max-w-md rounded bg-[#ececec]" />
          <div className="mt-3 flex w-full max-w-md gap-1">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-2 min-w-0 flex-1 rounded-full bg-[#ececec]" />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-5 sm:hidden">
        {Array.from({ length: 3 }).map((_, index) => (
          <MobileLessonRowSkeleton key={index} />
        ))}
      </div>

      <div className="-mx-5 hidden rounded-none bg-[#f7f7f7] p-5 sm:mx-0 sm:block sm:rounded-2xl sm:p-6">
        <div className="-mx-5 overflow-hidden px-5 sm:mx-0 sm:px-0">
          <div className="flex min-w-max gap-4 sm:gap-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <LessonCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>

    </section>
  )
}

function InvataSeoIntroSkeleton() {
  return (
    <section className="mt-10 rounded-2xl border border-[#e8e8e8] bg-[#fafafa] px-5 py-6 sm:px-8 sm:py-8">
      <Skeleton className="h-6 w-3/4 max-w-lg rounded bg-[#e6e6e6] sm:h-7" />
      <div className="mt-3 space-y-2.5">
        <Skeleton className="h-4 w-full rounded bg-[#ececec]" />
        <Skeleton className="h-4 w-full rounded bg-[#ececec]" />
        <Skeleton className="h-4 w-11/12 rounded bg-[#ececec]" />
        <Skeleton className="h-4 w-4/5 rounded bg-[#ececec]" />
      </div>
    </section>
  )
}

export function InvataPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
      <header className="mb-8 hidden flex-col gap-4 sm:flex sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56 rounded-lg bg-[#e6e6e6] sm:h-10 sm:w-72" />
          <Skeleton className="h-4 w-full max-w-md rounded bg-[#ececec] sm:h-5" />
        </div>
        <Skeleton className="h-10 w-44 rounded-full bg-[#ececec]" />
      </header>

      <div className="pb-14">
        <div className="space-y-12 sm:space-y-10">
          <ChapterSectionSkeleton />
          <ChapterSectionSkeleton withTopBorder />
          <ChapterSectionSkeleton withTopBorder />
        </div>
      </div>

      <InvataSeoIntroSkeleton />
    </div>
  )
}
