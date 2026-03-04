import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingProblemDetail() {
  return (
    <div className="min-h-screen bg-[#f6f5f4] text-[#2C2F33] flex flex-col">
      <Navigation />

      <div className="flex-1">
        <div className="px-4 sm:px-6 lg:px-12 pt-20 lg:pt-[116px] pb-16">
          <div className="mx-auto max-w-[1600px] space-y-10">
            {/* Top navigation buttons skeleton */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Skeleton className="h-9 w-36 rounded-full bg-[#0b0d10]/10" />
                <Skeleton className="h-5 w-32 rounded bg-[#0b0d10]/10" />
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <Skeleton className="h-7 w-24 rounded-full bg-[#0b0d10]/10" />
                <Skeleton className="h-7 w-20 rounded-full bg-[#0b0d10]/10" />
                <Skeleton className="h-7 w-24 rounded-full bg-[#0b0d10]/10" />
              </div>
            </div>

            {/* Main grid layout */}
            <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.58fr)_minmax(0,0.42fr)] 2xl:grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)]">
              {/* Main content section */}
              <section className="space-y-8">
                <div className="flex flex-col gap-6">
                  {/* Title skeleton */}
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full rounded-lg bg-[#0b0d10]/10 sm:h-12 lg:h-14" />
                    <Skeleton className="h-10 w-4/5 rounded-lg bg-[#0b0d10]/10 sm:h-12 lg:h-14" />
                  </div>

                  {/* Mobile badges skeleton */}
                  <div className="flex flex-wrap gap-2 sm:hidden">
                    <Skeleton className="h-7 w-20 rounded-full bg-[#0b0d10]/10" />
                    <Skeleton className="h-7 w-16 rounded-full bg-[#0b0d10]/10" />
                  </div>

                  {/* Statement card skeleton */}
                  <div className="rounded-2xl border border-[#0b0d10]/10 bg-white/95 p-6 shadow-[0_12px_30px_-24px_rgba(11,13,16,0.45)]">
                    <div className="space-y-3">
                      <Skeleton className="h-5 w-full rounded bg-[#0b0d10]/10" />
                      <Skeleton className="h-5 w-full rounded bg-[#0b0d10]/10" />
                      <Skeleton className="h-5 w-11/12 rounded bg-[#0b0d10]/10" />
                      <Skeleton className="h-5 w-full rounded bg-[#0b0d10]/10" />
                      <Skeleton className="h-5 w-4/5 rounded bg-[#0b0d10]/10" />
                      <Skeleton className="h-5 w-3/4 rounded bg-[#0b0d10]/10" />
                    </div>
                  </div>

                  {/* Image placeholder skeleton */}
                  <div className="flex justify-center">
                    <Skeleton className="h-64 w-full max-w-2xl rounded-xl bg-[#0b0d10]/10" />
                  </div>

                  {/* Video button skeleton */}
                  <div className="pt-1">
                    <Skeleton className="h-11 w-44 rounded-full bg-[#0b0d10]/10" />
                  </div>
                </div>

                {/* Badges row skeleton */}
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-8 w-20 rounded-full bg-[#0b0d10]/10" />
                  <Skeleton className="h-8 w-28 rounded-full bg-[#0b0d10]/10" />
                  <Skeleton className="h-8 w-16 rounded-full bg-[#0b0d10]/10" />
                </div>
              </section>

              {/* Sidebar section - desktop only (answer card or "no answer" card) */}
              <aside className="hidden lg:block space-y-6">
                <div className="mx-auto max-w-md flex flex-col gap-4 rounded-3xl border border-[#0b0d10]/10 bg-white/90 p-6 shadow-[0px_20px_50px_-40px_rgba(11,13,16,0.6)]">
                  <Skeleton className="h-6 w-3/4 rounded bg-[#0b0d10]/10 mx-auto" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full rounded bg-[#0b0d10]/10" />
                    <Skeleton className="h-4 w-11/12 rounded bg-[#0b0d10]/10" />
                    <Skeleton className="h-4 w-4/5 rounded bg-[#0b0d10]/10" />
                  </div>
                </div>

                {/* Recommended problems skeleton */}
                <div className="mx-auto max-w-md rounded-2xl border border-[#0b0d10]/10 bg-white/90 p-5 shadow-sm">
                  <Skeleton className="h-5 w-40 rounded bg-[#0b0d10]/10 mb-3" />
                  <Skeleton className="h-4 w-full rounded bg-[#0b0d10]/10 mb-4" />
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full rounded-xl bg-[#0b0d10]/10" />
                    <Skeleton className="h-16 w-full rounded-xl bg-[#0b0d10]/10" />
                    <Skeleton className="h-16 w-full rounded-xl bg-[#0b0d10]/10" />
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>

      <Footer
        theme="light"
        backgroundColor="bg-[#f6f5f4]"
        borderColor="border-[#0b0d10]/10"
      />
    </div>
  )
}
