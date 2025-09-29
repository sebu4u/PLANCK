import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingLessonsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="pt-16">
        <div className="flex">
          {/* Sidebar skeleton - hidden on mobile, visible on desktop */}
          <div className="hidden lg:block w-80 border-r border-gray-200 h-[calc(100vh-4rem)] shadow-lg">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-6 w-6 rounded" />
              </div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-5 w-48" />
                  </div>
                  <div className="space-y-2 pl-7">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="flex items-center gap-3">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <Skeleton className={`h-4 ${j % 3 === 0 ? 'w-56' : j % 3 === 1 ? 'w-44' : 'w-64'}`} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main content skeleton - responsive (aligned with new LessonViewerSkeleton) */}
          <div className="flex-1 w-full lg:w-auto">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 lg:p-6">
              <div className="max-w-4xl mx-auto">
                {/* Mobile skeleton header - mirrors real header exactly */}
                <div className="lg:hidden">
                  <div className="flex flex-col justify-between mb-4 gap-3">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Skeleton className="h-6 w-24 bg-white/30 rounded" />
                      <Skeleton className="h-5 w-20 bg-white/30 rounded" />
                      <Skeleton className="h-5 w-24 bg-white/30 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-24 bg-white/30 rounded-md" />
                      <Skeleton className="h-8 w-28 bg-white/30 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-7 w-11/12 bg-white/40 mb-4" />
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <Skeleton className="h-3 w-28 bg-white/30 rounded" />
                      <Skeleton className="h-3 w-10 bg-white/30 rounded" />
                    </div>
                    <Skeleton className="h-3 w-full bg-white/40 rounded" />
                  </div>
                  <div className="flex flex-row justify-between gap-2">
                    <Skeleton className="h-10 w-full bg-white/30 rounded-md" />
                    <Skeleton className="h-10 w-full bg-white/30 rounded-md" />
                  </div>
                </div>

                {/* Desktop skeleton header - mirrors real header exactly */}
                <div className="hidden lg:block">
                  {/* Meta row */}
                  <div className="flex flex-row items-center justify-between mb-4 gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Skeleton className="h-6 w-28 bg-white/30 rounded" />
                      <Skeleton className="h-6 w-24 bg-white/30 rounded" />
                      <Skeleton className="h-6 w-28 bg-white/30 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-9 w-28 bg-white/30 rounded-md" />
                      <Skeleton className="h-9 w-32 bg-white/30 rounded-md" />
                    </div>
                  </div>

                  {/* Title */}
                  <Skeleton className="h-10 w-4/5 bg-white/40 mb-4" />

                  {/* Progress area */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <Skeleton className="h-4 w-32 bg-white/30 rounded" />
                      <Skeleton className="h-4 w-12 bg-white/30 rounded" />
                    </div>
                    <Skeleton className="h-3 w-full bg-white/40 rounded" />
                  </div>

                  {/* Navigation buttons */}
                  <div className="flex flex-row justify-between gap-2">
                    <Skeleton className="h-11 w-full bg-white/30 rounded-md" />
                    <Skeleton className="h-11 w-full bg-white/30 rounded-md" />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3 lg:p-6">
              <div className="max-w-4xl mx-auto space-y-4 lg:space-y-6">
                {/* Toolbar skeleton - mobile responsive */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:gap-3">
                  <Skeleton className="h-8 lg:h-10 w-full sm:w-32 lg:w-36" />
                  <Skeleton className="h-8 lg:h-10 w-full sm:w-32 lg:w-36" />
                  <div className="hidden sm:block flex-1" />
                  <Skeleton className="h-8 lg:h-10 w-20 lg:w-24" />
                </div>

                {/* Content card skeleton - mobile optimized */}
                <div className="border rounded-lg lg:rounded-xl p-4 lg:p-6 space-y-3 lg:space-y-4">
                  <Skeleton className="h-5 lg:h-6 w-1/2 lg:w-2/3" />
                  
                  {/* Paragraph lines - mobile responsive */}
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={`p1-${i}`} className={`h-3 lg:h-4 ${i % 4 === 0 ? 'w-[95%]' : i % 4 === 1 ? 'w-[88%]' : i % 4 === 2 ? 'w-[76%]' : 'w-[90%]'}`} />
                  ))}

                  {/* Image placeholder - responsive height */}
                  <Skeleton className="h-48 lg:h-64 w-full rounded-lg" />

                  {/* More text - mobile optimized */}
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={`p2-${i}`} className={`h-3 lg:h-4 ${i % 3 === 0 ? 'w-[90%]' : i % 3 === 1 ? 'w-[82%]' : 'w-[70%]'}`} />
                  ))}

                  {/* Formula block - mobile responsive */}
                  <div className="bg-muted/50 rounded-lg p-3 lg:p-4">
                    <Skeleton className="h-4 lg:h-5 w-1/3 lg:w-1/2 mb-2 lg:mb-3" />
                    <Skeleton className="h-16 lg:h-24 w-full" />
                  </div>

                  {/* List items - mobile optimized */}
                  <div className="space-y-1 lg:space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={`li-${i}`} className="flex items-center gap-2 lg:gap-3">
                        <Skeleton className="h-2 lg:h-3 w-2 lg:w-3 rounded-full" />
                        <Skeleton className={`h-3 lg:h-4 ${i % 2 === 0 ? 'w-2/3 lg:w-3/4' : 'w-1/2 lg:w-2/3'}`} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom navigation - mobile responsive */}
                <div className="flex flex-col sm:flex-row gap-2 lg:gap-3">
                  <Skeleton className="h-10 lg:h-11 w-full" />
                  <Skeleton className="h-10 lg:h-11 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


