import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#0D0D0F] pt-16">
      <div className="lg:ml-[300px] p-6 md:p-8 lg:p-10">
        <div className="max-w-[1000px] mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-9 w-64 mb-2 bg-white/10" />
            <Skeleton className="h-6 w-80 bg-white/10" />
          </div>

          {/* Top Grid - Daily Activity & Rank/ELO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Daily Activity Card Skeleton */}
            <div className="rounded-xl bg-[#131316] border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-32 bg-white/10" />
                <Skeleton className="h-5 w-5 rounded bg-white/10" />
              </div>
              <Skeleton className="h-32 w-full mb-4 bg-white/10" />
              <div className="flex gap-4">
                <Skeleton className="h-16 flex-1 bg-white/10" />
                <Skeleton className="h-16 flex-1 bg-white/10" />
                <Skeleton className="h-16 flex-1 bg-white/10" />
              </div>
            </div>

            {/* Rank/ELO Card Skeleton */}
            <div className="rounded-xl bg-[#131316] border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-24 bg-white/10" />
                <Skeleton className="h-8 w-20 rounded-full bg-white/10" />
              </div>
              <Skeleton className="h-12 w-32 mb-4 bg-white/10" />
              <Skeleton className="h-2 w-full mb-4 bg-white/10" />
              <Skeleton className="h-24 w-full bg-white/10" />
            </div>
          </div>

          {/* Continue Learning Card Skeleton */}
          <div className="mb-6">
            <div className="rounded-xl bg-[#131316] border border-white/10 p-6">
              <Skeleton className="h-6 w-40 mb-4 bg-white/10" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32 bg-white/10" />
                ))}
              </div>
            </div>
          </div>

          {/* Challenge & Sketch Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Daily Challenge Card Skeleton */}
            <div className="rounded-xl bg-[#131316] border border-white/10 p-6">
              <Skeleton className="h-6 w-36 mb-2 bg-white/10" />
              <Skeleton className="h-4 w-full mb-2 bg-white/10" />
              <Skeleton className="h-4 w-3/4 mb-4 bg-white/10" />
              <Skeleton className="h-10 w-full bg-white/10" />
            </div>

            {/* Sketch Card Skeleton */}
            <div className="rounded-xl bg-[#131316] border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-32 bg-white/10" />
                <Skeleton className="h-5 w-5 bg-white/10" />
              </div>
              <Skeleton className="h-10 w-full mb-4 bg-white/10" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-24 bg-white/10" />
                <Skeleton className="h-24 bg-white/10" />
              </div>
            </div>
          </div>

          {/* Achievements & Insights Row */}
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex-[2]">
              <div className="rounded-xl bg-[#131316] border border-white/10 p-6">
                <Skeleton className="h-6 w-32 mb-4 bg-white/10" />
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full bg-white/10" />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-[3]">
              <div className="rounded-xl bg-[#131316] border border-white/10 p-6">
                <Skeleton className="h-6 w-40 mb-4 bg-white/10" />
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Skeleton className="h-20 bg-white/10" />
                  <Skeleton className="h-20 bg-white/10" />
                </div>
                <Skeleton className="h-32 w-full bg-white/10" />
              </div>
            </div>
          </div>

          {/* Bottom Grid - Roadmap, Recommendations, AI Assistant */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Roadmap Card Skeleton */}
            <div className="rounded-xl bg-[#131316] border border-white/10 p-6">
              <Skeleton className="h-6 w-28 mb-4 bg-white/10" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full bg-white/10" />
                ))}
              </div>
            </div>

            {/* Recommendations Card Skeleton */}
            <div className="rounded-xl bg-[#131316] border border-white/10 p-6">
              <Skeleton className="h-6 w-36 mb-4 bg-white/10" />
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 w-full bg-white/10" />
                ))}
              </div>
            </div>

            {/* AI Assistant Card Skeleton */}
            <div className="rounded-xl bg-[#131316] border border-white/10 p-6">
              <Skeleton className="h-6 w-32 mb-4 bg-white/10" />
              <Skeleton className="h-10 w-full mb-4 bg-white/10" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-8 w-24 rounded-full bg-white/10" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

