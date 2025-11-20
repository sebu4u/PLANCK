import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"

export function DashboardSidebarSkeleton() {
  return (
    <>
      {/* Desktop Sidebar Skeleton */}
      <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-[300px] bg-[#080808] border-r border-[#1a1a1a] z-30">
        <ScrollArea className="h-full dashboard-scrollbar">
          <div className="p-5 space-y-6">
            {/* Section 1: User Header Skeleton */}
            <div className="flex items-center gap-3 pb-5 border-b border-white/8">
              <Skeleton className="w-10 h-10 rounded-full bg-white/10" />
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-4 w-24 bg-white/10" />
                <Skeleton className="h-3 w-32 bg-white/10" />
                <Skeleton className="h-3 w-28 bg-white/10" />
              </div>
            </div>

            {/* Main Navigation Skeleton */}
            <nav className="space-y-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
                  <Skeleton className="w-4 h-4 bg-white/10" />
                  <Skeleton className="h-4 w-20 bg-white/10" />
                </div>
              ))}
            </nav>

            {/* Section 2: Today Overview Skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-3 w-12 bg-white/10" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40 bg-white/10" />
                <Skeleton className="h-4 w-32 bg-white/10" />
                <Skeleton className="h-4 w-36 bg-white/10" />
              </div>
            </div>

            {/* Section 3: Continue Learning Skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-3 w-28 bg-white/10" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-4 w-full bg-white/10" />
                ))}
              </div>
            </div>

            {/* Section 4: Quick Access Skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-3 w-24 bg-white/10" />
              <div className="space-y-1">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg">
                    <Skeleton className="w-4 h-4 bg-white/10" />
                    <Skeleton className="h-4 w-32 bg-white/10" />
                  </div>
                ))}
              </div>
            </div>

            {/* Section 5: Tasks Today Skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-3 w-24 bg-white/10" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-4 h-4 rounded bg-white/10" />
                    <Skeleton className="h-4 w-40 bg-white/10" />
                  </div>
                ))}
              </div>
            </div>

            {/* Section 6: Achievements Skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-3 w-28 bg-white/10" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="w-4 h-4 bg-white/10" />
                    <Skeleton className="h-4 w-32 bg-white/10" />
                  </div>
                ))}
              </div>
            </div>

            {/* Section 7: Updates Skeleton */}
            <div className="space-y-3 pb-6">
              <Skeleton className="h-3 w-20 bg-white/10" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Skeleton className="w-3.5 h-3.5 mt-0.5 bg-white/10" />
                    <Skeleton className="h-3 w-full bg-white/10" />
                  </div>
                ))}
              </div>
            </div>

            {/* Social Media Icons Skeleton */}
            <div className="pt-6 mt-6 border-t border-white/10">
              <div className="flex items-center justify-center gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="w-5 h-5 rounded bg-white/10" />
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </aside>

      {/* Mobile Drawer Skeleton - hidden on desktop */}
      <div className="lg:hidden">
        {/* Mobile skeleton would be shown in a Sheet, but we'll keep it simple for now */}
      </div>
    </>
  )
}

