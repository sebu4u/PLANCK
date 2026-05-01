import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Skeleton } from "@/components/ui/skeleton"

function DesktopInsightChatSkeleton() {
  return (
    <div
      className="pointer-events-none hidden lg:flex lg:fixed lg:right-0 lg:top-16 lg:z-[500] lg:h-[calc(100dvh-4rem)] lg:w-[25vw] lg:flex-col lg:overflow-hidden lg:rounded-tl-xl lg:rounded-bl-xl lg:bg-white lg:shadow-sm"
      aria-hidden
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-[#0b0d10]/10 px-4 py-4">
        <Skeleton className="h-6 w-36 rounded-md bg-[#0b0d10]/10" />
        <Skeleton className="h-9 w-9 shrink-0 rounded-lg bg-[#0b0d10]/10" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-4 py-5">
        <div className="mx-auto w-full max-w-[280px] flex-[0.45] shrink-0" aria-hidden />
        <div className="flex shrink-0 flex-col items-center gap-4 pb-6">
          <Skeleton className="h-28 w-28 shrink-0 rounded-2xl bg-[#0b0d10]/10 sm:h-32 sm:w-32" />
          <div className="w-full space-y-2">
            <Skeleton className="mx-auto h-4 w-4/5 rounded bg-[#0b0d10]/10" />
            <Skeleton className="mx-auto h-4 w-3/5 rounded bg-[#0b0d10]/10" />
          </div>
        </div>
        <div className="mt-auto space-y-4 border-t border-[#0b0d10]/10 pt-4">
          <Skeleton className="h-24 w-full rounded-2xl bg-[#0b0d10]/8" />
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-11 flex-1 rounded-full bg-[#0b0d10]/10" />
            <Skeleton className="h-11 w-11 shrink-0 rounded-full bg-[#0b0d10]/12" />
          </div>
        </div>
      </div>
    </div>
  )
}

function AnswerCardSkeleton() {
  return (
    <div className="flex min-h-[280px] flex-col gap-4 rounded-3xl border border-[#0b0d10]/10 bg-white/90 p-6 shadow-[0px_20px_50px_-40px_rgba(11,13,16,0.6)]">
      <Skeleton className="h-5 w-2/3 rounded bg-[#0b0d10]/10" />
      <Skeleton className="h-12 w-full rounded-xl bg-[#0b0d10]/8" />
      <div className="mt-auto flex flex-wrap gap-3 pt-2">
        <Skeleton className="h-11 flex-1 rounded-full bg-[#0b0d10]/10 sm:max-w-[200px]" />
        <Skeleton className="h-11 w-full rounded-full bg-[#0b0d10]/12 sm:w-36" />
      </div>
    </div>
  )
}

function RecommendedCardSkeleton() {
  return (
    <div className="rounded-3xl border border-[#0b0d10]/10 bg-white/90 p-5 shadow-[0px_20px_50px_-40px_rgba(11,13,16,0.6)]">
      <Skeleton className="h-3 w-24 rounded bg-[#0b0d10]/10" />
      <Skeleton className="mt-3 h-6 w-4/5 rounded bg-[#0b0d10]/10" />
      <Skeleton className="mt-2 h-4 w-full rounded bg-[#0b0d10]/8" />
      <div className="mt-4 rounded-2xl border border-[#0b0d10]/10 bg-white p-4">
        <Skeleton className="h-4 w-full rounded bg-[#0b0d10]/10" />
        <Skeleton className="mt-2 h-4 w-11/12 rounded bg-[#0b0d10]/8" />
        <div className="mt-3 flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full bg-[#0b0d10]/8" />
          <Skeleton className="h-6 w-20 rounded-full bg-[#0b0d10]/8" />
        </div>
        <Skeleton className="mt-4 h-10 w-44 rounded-full bg-[#0b0d10]/12" />
      </div>
    </div>
  )
}

export default function LoadingProblemDetail() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f6f5f4] text-[#2C2F33] lg:bg-white">
      <Navigation />

      <div className="flex-1 lg:fixed lg:bottom-0 lg:left-0 lg:right-[25vw] lg:top-16 lg:pb-[6px] lg:pl-[6px] lg:pr-0 lg:pt-0">
        <div className="relative z-[1] lg:h-full lg:overflow-hidden lg:rounded-xl lg:bg-[#f6f5f4] lg:shadow-md">
          <div className="problem-page-scrollbar lg:h-full lg:overflow-y-auto lg:overflow-x-hidden lg:rounded-xl">
            <div className="px-4 pb-28 pt-20 sm:px-6 lg:px-12 lg:pb-16 lg:pt-8">
              <div className="mx-auto max-w-[1600px] space-y-10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Skeleton className="h-9 w-36 rounded-full bg-[#0b0d10]/10" />
                    <Skeleton className="h-5 w-32 rounded bg-[#0b0d10]/10" />
                  </div>
                  <div className="hidden sm:flex items-center gap-3">
                    <Skeleton className="h-7 w-24 rounded-full bg-[#0b0d10]/10" />
                    <Skeleton className="h-7 w-28 rounded-full bg-[#0b0d10]/10" />
                  </div>
                </div>

                <div className="grid items-start gap-8">
                  <section className="space-y-8">
                    <div className="flex flex-col gap-6">
                      <div className="space-y-3">
                        <Skeleton className="h-10 w-full rounded-lg bg-[#0b0d10]/10 sm:h-12 lg:h-14" />
                        <Skeleton className="h-10 w-4/5 rounded-lg bg-[#0b0d10]/10 sm:h-12 lg:h-14" />
                      </div>

                      <div className="flex flex-wrap gap-2 sm:hidden">
                        <Skeleton className="h-7 w-20 rounded-full bg-[#0b0d10]/10" />
                        <Skeleton className="h-7 w-16 rounded-full bg-[#0b0d10]/10" />
                      </div>

                      <div className="hidden flex-wrap gap-2 sm:flex">
                        <Skeleton className="h-7 w-20 rounded-full bg-[#0b0d10]/10" />
                        <Skeleton className="h-7 w-24 rounded-full bg-[#0b0d10]/10" />
                        <Skeleton className="h-7 w-16 rounded-full bg-[#0b0d10]/10" />
                      </div>

                      <div className="space-y-6">
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

                        <div className="flex justify-center">
                          <Skeleton className="h-64 w-full max-w-2xl rounded-xl bg-[#0b0d10]/10" />
                        </div>

                        <div className="space-y-3 pt-1">
                          <Skeleton className="h-11 w-44 rounded-full bg-[#0b0d10]/10" />
                          <div className="flex min-h-[56px] gap-3 rounded-2xl border border-[#0b0d10]/12 bg-white p-4 shadow-[0_4px_14px_-4px_rgba(11,13,16,0.12)] lg:hidden">
                            <div className="min-w-0 flex-1 space-y-2">
                              <Skeleton className="h-5 w-40 rounded bg-[#0b0d10]/10" />
                              <Skeleton className="h-4 w-full max-w-xs rounded bg-[#0b0d10]/8" />
                            </div>
                            <Skeleton className="h-14 w-14 shrink-0 rounded-lg bg-[#0b0d10]/10" />
                          </div>
                        </div>

                        <div className="hidden grid-cols-2 gap-6 lg:grid xl:gap-8">
                          <AnswerCardSkeleton />
                          <RecommendedCardSkeleton />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Skeleton className="h-9 w-24 rounded-full bg-[#0b0d10]/10" />
                      <Skeleton className="h-9 w-32 rounded-full bg-[#0b0d10]/10" />
                      <Skeleton className="hidden h-9 w-28 rounded-full bg-[#0b0d10]/10 sm:block" />
                    </div>
                  </section>

                  <div className="w-full lg:hidden">
                    <RecommendedCardSkeleton />
                  </div>
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
      </div>

      <DesktopInsightChatSkeleton />
    </div>
  )
}
