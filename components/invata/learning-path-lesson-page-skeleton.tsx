import { Skeleton } from "@/components/ui/skeleton"

const NODE_ROW_OFFSETS = ["ml-[6%]", "ml-[26%]", "ml-[12%]", "ml-[32%]", "ml-[18%]"] as const

function TrailNodeSkeleton({ offsetClass }: { offsetClass: string }) {
  return (
    <div className={`relative mb-20 w-fit max-w-full sm:mb-10 lg:mb-16 ${offsetClass}`}>
      <div className="flex max-w-full items-center gap-4">
        <Skeleton className="h-20 w-20 shrink-0 rounded-full bg-[#e6e6e6]" />
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-4 w-28 rounded bg-[#e6e6e6] sm:w-36" />
          <Skeleton className="h-3 w-16 rounded bg-[#ececec]" />
        </div>
      </div>
    </div>
  )
}

function LevelCardSkeleton() {
  return (
    <div className="mx-auto mb-6 w-full max-w-[min(100%,22rem)] rounded-2xl border-t-[3px] border-l-[3px] border-r-[3px] border-b-[6px] border-[#e6e6e6] bg-white px-4 py-3 text-center sm:max-w-[min(100%,28rem)] sm:px-6 sm:py-3.5 lg:mb-12">
      <Skeleton className="mx-auto h-3 w-16 rounded bg-[#ececec]" />
      <Skeleton className="mx-auto mt-2 h-4 w-28 rounded bg-[#e6e6e6]" />
    </div>
  )
}

function LessonAsideSkeleton() {
  return (
    <div className="flex w-full flex-col gap-3 lg:sticky lg:top-28 lg:z-20 lg:ml-16 lg:w-[360px] lg:max-w-[360px] lg:self-start xl:ml-28 xl:w-[400px] xl:max-w-[400px]">
      <aside className="border-0 bg-transparent p-0 shadow-none lg:max-h-[calc(100vh-8rem)] lg:w-full lg:overflow-hidden lg:rounded-[24px] lg:border-[3px] lg:border-[#e5e5e5] lg:bg-white lg:p-5">
        <div className="flex w-full justify-center lg:justify-start">
          <Skeleton className="h-36 w-36 rounded-2xl bg-[#e6e6e6] sm:h-40 sm:w-40 lg:h-36 lg:w-36" />
        </div>
        <div className="mt-5 w-full space-y-3 text-center lg:mt-4 lg:text-left">
          <Skeleton className="mx-auto hidden h-3 w-16 rounded bg-[#ececec] lg:mx-0 lg:mb-2 lg:block" />
          <Skeleton className="mx-auto h-7 w-48 rounded bg-[#e6e6e6] sm:h-8 sm:w-56 lg:mx-0" />
          <div className="mx-auto w-full max-w-sm space-y-2 lg:mx-0 lg:max-w-none">
            <Skeleton className="h-4 w-full rounded bg-[#ececec]" />
            <Skeleton className="h-4 w-[80%] rounded bg-[#ececec] lg:w-4/5" />
          </div>
          <Skeleton className="mx-auto h-4 w-24 rounded bg-[#e6e6e6] lg:mx-0" />
        </div>
      </aside>
      <Skeleton className="hidden h-5 w-36 rounded bg-[#ececec] lg:block" />
    </div>
  )
}

function TrailSkeleton() {
  return (
    <section className="relative min-w-0 w-full">
      <div className="w-full">
        <LevelCardSkeleton />
        <div className="relative flex w-full flex-col items-center">
          {NODE_ROW_OFFSETS.map((offsetClass, index) => (
            <TrailNodeSkeleton key={index} offsetClass={offsetClass} />
          ))}
        </div>
      </div>

      <div className="mt-6 h-[140px] w-full shrink-0 lg:w-1/2 lg:min-w-[200px] lg:max-w-sm" aria-hidden="true" />
    </section>
  )
}

export function LearningPathLessonPageSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-7xl px-5 pt-16 pb-6 sm:px-8 lg:px-12 lg:pt-32 lg:pb-10"
      aria-busy="true"
      aria-label="Se încarcă lecția"
    >
      <div className="grid items-start gap-8 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)]">
        <LessonAsideSkeleton />
        <TrailSkeleton />
      </div>
    </div>
  )
}
