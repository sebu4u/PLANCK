import { Navigation } from "@/components/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"
import { cn } from "@/lib/utils"

function ProfileSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-[#e5e5e5] bg-white p-6 shadow-[0_12px_30px_rgba(0,0,0,0.03)]">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-32 w-32 rounded-full bg-[#f1f1f1]" />
        <Skeleton className="h-6 w-32 bg-[#f1f1f1]" />
        <Skeleton className="h-4 w-48 bg-[#f1f1f1]" />
        <Skeleton className="h-20 w-full rounded-2xl bg-[#f1f1f1]" />
      </div>
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 w-full rounded-3xl bg-[#f1f1f1]" />
      <Skeleton className="h-64 w-full rounded-3xl bg-[#f1f1f1]" />
    </div>
  )
}

export default function LoadingProfile() {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#ffffff_0%,#fafafa_38%,#fefefe_72%,#ffffff_100%)]">
      <Navigation />
      <main className={cn("pt-16 px-4 md:px-6 lg:px-8 md:pt-24", MOBILE_BOTTOM_NAV_PADDING_CLASS, "burger:pb-12")}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <Skeleton className="mb-2 h-9 w-28 bg-[#f1f1f1]" />
            <Skeleton className="h-5 w-56 bg-[#f1f1f1]" />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <ProfileSkeleton />
            </div>
            <div className="lg:col-span-2">
              <StatsSkeleton />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
