import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingProblems() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="pt-16">
        <section className="py-12 sm:py-16 lg:py-20 px-4 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="max-w-7xl mx-auto text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-10 w-64" />
            </div>
            <Skeleton className="h-5 w-[560px] max-w-full mx-auto" />
            <div className="flex flex-wrap justify-center gap-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-40" />
            </div>
          </div>
        </section>

        <section className="py-12 px-4 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-2/3" />
              </div>
            </div>

            {/* Problems Grid */}
            <div className="lg:col-span-3">
              <div className="grid gap-6 md:grid-cols-2 mb-8">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-gray-100 p-4 bg-white/80 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-28" />
                      <div className="ml-auto" />
                      <Skeleton className="h-4 w-14" />
                    </div>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-5/6" />
                    <div className="mt-4">
                      <Skeleton className="h-9 w-full" />
                    </div>
                  </div>
                ))}
              </div>
              {/* Pagination skeleton */}
              <div className="flex justify-center gap-3">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
