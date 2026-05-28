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

function ChapterProblemsSkeleton() {
  return (
    <div className="-mx-5 mt-5 sm:mx-0">
      <div className="rounded-none border-y border-[#ececec] bg-white py-5 sm:rounded-2xl sm:border sm:p-5">
        <div className="hidden gap-3 sm:grid sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-[#ededed] bg-[#fafafa] p-4"
            >
              <Skeleton className="h-3 w-16 rounded bg-[#ececec]" />
              <Skeleton className="mt-2 h-4 w-full rounded bg-[#e6e6e6]" />
              <Skeleton className="mt-1 h-4 w-4/5 rounded bg-[#ececec]" />
              <Skeleton className="mt-3 h-3 w-20 rounded bg-[#ececec]" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end px-5 sm:px-0">
          <Skeleton className="h-9 w-40 rounded-full bg-[#e6e6e6]" />
        </div>
      </div>
    </div>
  )
}

function ChapterSectionSkeleton({
  withTopBorder = false,
  showProblems = false,
}: {
  withTopBorder?: boolean
  showProblems?: boolean
}) {
  return (
    <section className={withTopBorder ? "border-t border-[#ececec] pt-10" : ""}>
      <div className="mb-5 flex items-start justify-between gap-5 sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-5 sm:items-center">
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
      </div>

      <div className="-mx-5 rounded-none bg-[#f7f7f7] p-5 sm:mx-0 sm:rounded-2xl sm:p-6">
        <div className="-mx-5 overflow-hidden px-5 sm:mx-0 sm:px-0">
          <div className="flex min-w-max gap-4 sm:gap-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <LessonCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>

      {showProblems ? <ChapterProblemsSkeleton /> : null}
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
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56 rounded-lg bg-[#e6e6e6] sm:h-10 sm:w-72" />
          <Skeleton className="h-4 w-full max-w-md rounded bg-[#ececec] sm:h-5" />
        </div>
        <Skeleton className="h-10 w-44 rounded-full bg-[#ececec]" />
      </header>

      <div className="space-y-10 pb-14">
        <ChapterSectionSkeleton showProblems />
        <ChapterSectionSkeleton withTopBorder />
        <ChapterSectionSkeleton withTopBorder />
      </div>

      <InvataSeoIntroSkeleton />
    </div>
  )
}
