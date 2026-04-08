function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-[#e5e7eb] ${className}`} />
}

export function ClassroomsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-80 max-w-[85vw]" />
        </div>
        <div className="hidden gap-2 md:flex">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="mt-4 h-5 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ClassroomDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 border-b border-[#dadce0] pb-2">
        <Skeleton className="h-9 w-20 rounded-none" />
        <Skeleton className="h-9 w-28 rounded-none" />
        <Skeleton className="h-9 w-16 rounded-none" />
      </div>

      <div className="overflow-hidden rounded-xl border border-[#d2e3fc] bg-white">
        <div className="min-h-[180px] bg-gradient-to-r from-[#e8eef9] via-[#e5ecf7] to-[#e8eef9] p-6 md:min-h-[220px]">
          <Skeleton className="h-8 w-64 bg-white/60" />
          <Skeleton className="mt-3 h-4 w-40 bg-white/60" />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
        <aside className="rounded-xl border border-[#dadce0] bg-white p-4">
          <Skeleton className="h-5 w-24" />
          <div className="mt-3 space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-[#e8eaed] p-2">
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </div>
            ))}
          </div>
        </aside>

        <div className="space-y-4">
          <div className="rounded-xl border border-[#eceff3] bg-white p-4">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="mt-4 h-20 w-full rounded-xl" />
          </div>
          <StreamPostSkeleton />
          <StreamPostSkeleton />
          <StreamPostSkeleton />
        </div>
      </div>
    </div>
  )
}

export function ClassroomFeedSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
      <aside className="rounded-xl border border-[#dadce0] bg-white p-4">
        <Skeleton className="h-5 w-24" />
        <div className="mt-3 space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-[#e8eaed] p-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </div>
          ))}
        </div>
      </aside>
      <div className="space-y-4">
        <div className="rounded-xl border border-[#eceff3] bg-white p-4">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="mt-4 h-20 w-full rounded-xl" />
        </div>
        <StreamPostSkeleton />
        <StreamPostSkeleton />
      </div>
    </div>
  )
}

export function StreamPostSkeleton() {
  return (
    <div className="rounded-xl border border-[#dfe3ea] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-5 w-3/4" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-1 h-4 w-5/6" />
      <div className="mt-4 flex items-center justify-between border-t border-[#eef2f7] pt-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
}

export function ClassroomAssignmentsSkeleton() {
  return (
    <div className="space-y-3">
      <StreamPostSkeleton />
      <StreamPostSkeleton />
      <StreamPostSkeleton />
    </div>
  )
}

export function ClassroomStudentsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#eceff3] bg-white p-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="mt-3 h-4 w-64" />
      </div>
      <div className="rounded-xl border border-[#eceff3] bg-white p-4">
        <Skeleton className="h-5 w-20" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-[#e5e7eb] p-3">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="mt-2 h-3 w-52" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ClassroomAssignmentDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#eceff3] bg-white p-5">
        <Skeleton className="h-7 w-72" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>
      <div className="rounded-xl border border-[#eceff3] bg-white p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-48 w-full rounded-xl" />
      </div>
    </div>
  )
}

export function ClassroomProblemPreviewSkeleton() {
  return (
    <div className="space-y-4 rounded-2xl border border-[#e5e7eb] bg-white p-5">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  )
}

/** Matches `/classrooms/new` — title + card with name field + cover grid + submit. */
export function ClassroomNewSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="rounded-xl border border-[#eceff3] bg-white">
        <div className="border-b border-[#f3f4f6] px-6 py-5">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mt-2 h-4 w-full max-w-md" />
        </div>
        <div className="space-y-4 px-6 py-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full max-w-xl rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-72 max-w-full" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          </div>
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>
      </div>
    </div>
  )
}

/** Matches `/classrooms/join` — title + card with code field + submit. */
export function ClassroomJoinSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-44" />
      <div className="rounded-xl border border-[#eceff3] bg-white">
        <div className="border-b border-[#f3f4f6] px-6 py-5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-full max-w-sm" />
        </div>
        <div className="space-y-4 px-6 py-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full max-w-xs rounded-md" />
          </div>
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>
      </div>
    </div>
  )
}
