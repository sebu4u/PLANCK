import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Skeleton } from "@/components/ui/skeleton"
import { ProblemCardSkeleton } from "@/components/problems/problem-card-skeleton"

export default function LoadingProblems() {
  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col overflow-x-hidden">
      <Navigation />
      <main className="flex-1 overflow-x-hidden">
        <div className="px-6 sm:px-8 lg:px-16 xl:px-20 pt-20 pb-12">
          <section className="w-full space-y-10">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 shadow-[0px_24px_70px_-40px_rgba(0,0,0,1)]">
              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-white/70">
                    <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
                      <Skeleton className="h-6 w-6 rounded-lg bg-white/15" />
                    </span>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-28 bg-white/10" />
                      <Skeleton className="h-8 w-56 max-w-full bg-white/10" />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Skeleton className="h-8 w-32 rounded-full bg-white/10" />
                    <Skeleton className="h-8 w-32 rounded-full bg-white/10" />
                  </div>
                </div>
                <Skeleton className="h-4 w-3/4 bg-white/10" />
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white/70 shadow-[0px_24px_70px_-40px_rgba(0,0,0,1)]">
                <Skeleton className="h-4 w-72 max-w-full bg-white/10" />
                <div className="flex items-center gap-3 lg:hidden">
                  <Skeleton className="h-9 w-28 rounded-full bg-white/10" />
                  <Skeleton className="h-9 w-9 rounded-full bg-white/10" />
                </div>
              </div>

              <div className="grid gap-8 lg:grid-cols-[320px,minmax(0,1fr)] lg:items-start">
                <div className="hidden lg:block">
                  <div className="sticky top-28">
                    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0px_24px_70px_-40px_rgba(0,0,0,1)]">
                      <Skeleton className="h-12 w-full rounded-2xl bg-white/10" />
                      <Skeleton className="h-10 w-full rounded-full bg-white/10" />
                      <Skeleton className="h-10 w-full rounded-full bg-white/10" />
                      <Skeleton className="h-10 w-full rounded-full bg-white/10" />
                      <Skeleton className="h-10 w-2/3 rounded-full bg-white/10" />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-8 grid gap-5 md:grid-cols-2">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <ProblemCardSkeleton key={index} />
                    ))}
                  </div>
                  <div className="mt-8 flex justify-center gap-4">
                    <Skeleton className="h-10 w-24 rounded-full bg-white/10" />
                    <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
                    <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
                    <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
                    <Skeleton className="h-10 w-24 rounded-full bg-white/10" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer backgroundColor="bg-[#0b0b0b]" />
    </div>
  )
}
