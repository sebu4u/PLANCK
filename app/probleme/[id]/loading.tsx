import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingProblemDetail() {
  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col">
      {/* Navigation skeleton */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#141414]/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32 bg-white/10" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-20 bg-white/10" />
              <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 pt-20 pb-16">
        <div className="px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-[1600px] space-y-10">
            {/* Top navigation buttons skeleton */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Skeleton className="h-9 w-36 rounded-full bg-white/10" />
                <Skeleton className="h-6 w-32 bg-white/10" />
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <Skeleton className="h-7 w-24 rounded-full bg-white/10" />
                <Skeleton className="h-7 w-20 rounded-full bg-white/10" />
                <Skeleton className="h-7 w-28 rounded-full bg-white/10" />
              </div>
            </div>

            {/* Main grid layout */}
            <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.58fr)_minmax(0,0.42fr)] 2xl:grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)]">
              {/* Main content section */}
              <section className="space-y-8">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 shadow-[0px_24px_70px_-40px_rgba(0,0,0,0.9)]">
                  <div className="flex flex-col gap-6">
                    {/* Icon and badges */}
                    <div className="flex flex-wrap items-start gap-4">
                      <Skeleton className="h-12 w-12 bg-white/10" />
                      <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-8 w-20 rounded bg-white/10" />
                        <Skeleton className="h-8 w-24 rounded bg-white/10" />
                        <Skeleton className="h-8 w-16 rounded bg-white/10" />
                      </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-3">
                      <Skeleton className="h-12 w-full bg-white/10" />
                      <Skeleton className="h-12 w-4/5 bg-white/10" />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-full bg-white/10" />
                      <Skeleton className="h-5 w-full bg-white/10" />
                      <Skeleton className="h-5 w-3/4 bg-white/10" />
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-7 w-20 rounded-full bg-white/10" />
                      <Skeleton className="h-7 w-16 rounded-full bg-white/10" />
                      <Skeleton className="h-7 w-24 rounded-full bg-white/10" />
                    </div>

                    {/* Tabs skeleton */}
                    <div className="w-full">
                      <div className="flex w-full flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
                        <Skeleton className="h-9 flex-1 rounded-full bg-white/10" />
                        <Skeleton className="h-9 flex-1 rounded-full bg-white/10" />
                      </div>
                      
                      {/* Tab content skeleton */}
                      <div className="mt-6 rounded-2xl border border-white/8 bg-black/40 p-6">
                        <div className="space-y-3">
                          <Skeleton className="h-5 w-full bg-white/10" />
                          <Skeleton className="h-5 w-full bg-white/10" />
                          <Skeleton className="h-5 w-4/5 bg-white/10" />
                          <Skeleton className="h-5 w-full bg-white/10" />
                          <Skeleton className="h-5 w-3/4 bg-white/10" />
                          <Skeleton className="h-5 w-full bg-white/10" />
                        </div>
                        {/* Image placeholder */}
                        <div className="mt-6 flex justify-center">
                          <Skeleton className="w-full max-w-2xl h-80 rounded-xl bg-white/10" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <Skeleton className="h-11 w-48 rounded-full bg-white/10" />
                  <Skeleton className="h-11 w-40 rounded-full bg-white/10 lg:hidden" />
                </div>
              </section>

              {/* Sidebar section */}
              <aside className="space-y-6">
                {/* Desktop board skeleton */}
                <div className="hidden lg:flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.02] p-5 shadow-[0px_24px_80px_-40px_rgba(0,0,0,1)]">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-32 bg-white/10" />
                      <Skeleton className="h-4 w-48 bg-white/10" />
                    </div>
                    <Skeleton className="h-9 w-9 rounded-full bg-white/10" />
                  </div>
                  <div className="relative h-[600px] overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                    <Skeleton className="h-full w-full bg-white/5" />
                  </div>
                </div>

                {/* Mobile board skeleton */}
                <div className="lg:hidden rounded-3xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Skeleton className="h-6 w-20 rounded-full bg-white/10" />
                    <Skeleton className="h-6 w-24 rounded-full bg-white/10" />
                  </div>
                  <Skeleton className="h-6 w-40 bg-white/10 mb-2" />
                  <Skeleton className="h-4 w-full bg-white/10 mb-4" />
                  <Skeleton className="h-11 w-full rounded-full bg-white/10" />
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer skeleton */}
      <div className="bg-gray-900 border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 bg-white/10" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 bg-white/10" />
                <Skeleton className="h-4 w-28 bg-white/10" />
                <Skeleton className="h-4 w-20 bg-white/10" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-24 bg-white/10" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 bg-white/10" />
                <Skeleton className="h-4 w-24 bg-white/10" />
                <Skeleton className="h-4 w-18 bg-white/10" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-28 bg-white/10" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-22 bg-white/10" />
                <Skeleton className="h-4 w-26 bg-white/10" />
                <Skeleton className="h-4 w-20 bg-white/10" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-20 bg-white/10" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 bg-white/10" />
                <Skeleton className="h-4 w-28 bg-white/10" />
                <Skeleton className="h-4 w-22 bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
