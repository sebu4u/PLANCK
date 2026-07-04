import { Navigation } from "@/components/navigation"
import { MatematicaCatalogCardSkeleton } from "@/components/math-problems/matematica-catalog-card-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

function CatalogSidebarSkeleton() {
  return (
    <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-[300px] bg-white lg:block">
      <div className="h-full overflow-y-auto px-5 py-5">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-xl bg-[#0b0c0f]/10" />
          <Skeleton className="h-10 w-full rounded-full bg-[#0b0c0f]/10" />
          <Skeleton className="h-10 w-full rounded-full bg-[#0b0c0f]/10" />
          <Skeleton className="h-10 w-full rounded-full bg-[#0b0c0f]/10" />
          <Skeleton className="h-10 w-4/5 rounded-full bg-[#0b0c0f]/10" />
          <div className="space-y-3 pt-4">
            <Skeleton className="h-4 w-24 rounded bg-[#0b0c0f]/10" />
            <Skeleton className="h-8 w-full rounded-lg bg-[#0b0c0f]/10" />
            <Skeleton className="h-8 w-full rounded-lg bg-[#0b0c0f]/10" />
            <Skeleton className="h-8 w-3/4 rounded-lg bg-[#0b0c0f]/10" />
          </div>
        </div>
      </div>
    </aside>
  )
}

export default function LoadingMatematicaProblems() {
  return (
    <div className="h-[100dvh] overflow-hidden bg-[#ffffff] pt-16">
      <Navigation />
      <div className="flex h-full flex-row">
        <CatalogSidebarSkeleton />

        <div className="relative h-full flex-1 lg:ml-[300px]">
          <div className="absolute inset-[3px] top-0 overflow-hidden bg-[#f5f4f2] lg:rounded-xl">
            <div className="h-full overflow-y-auto">
              <div className="space-y-6 pb-12 pl-6 pr-[19px] pt-6 sm:pl-8 sm:pr-[27px] lg:pl-10 lg:pr-[35px] xl:pl-12 xl:pr-[43px]">
                <Skeleton className="h-10 w-44 rounded-xl bg-[#0b0c0f]/10" />

                <div className="space-y-2">
                  <Skeleton className="h-9 w-72 rounded-lg bg-[#0b0c0f]/10 sm:h-10 sm:w-96" />
                  <Skeleton className="h-4 w-full max-w-lg rounded bg-[#0b0c0f]/10 sm:h-5" />
                </div>

                <div className="flex items-center justify-between lg:hidden">
                  <Skeleton className="h-10 w-36 rounded-full bg-[#0b0c0f]/10" />
                </div>

                <div className="grid gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <MatematicaCatalogCardSkeleton key={index} />
                  ))}
                </div>

                <div className="mt-6 flex justify-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-full bg-[#0b0c0f]/10" />
                  <Skeleton className="h-10 w-10 rounded-full bg-[#0b0c0f]/10" />
                  <Skeleton className="h-10 w-10 rounded-full bg-[#0b0c0f]/10" />
                  <Skeleton className="h-10 w-10 rounded-full bg-[#0b0c0f]/10" />
                  <Skeleton className="h-10 w-10 rounded-full bg-[#0b0c0f]/10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
