import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingProblemDetail() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 text-gray-900">
      <div className="pt-16">
        <section className="py-12 px-4 bg-gradient-to-br from-white/80 via-purple-50/80 to-pink-50/80 border-b border-purple-100/50">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-5 w-28" />
            <div className="flex items-start gap-4">
              <Skeleton className="h-20 w-20 rounded-2xl" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-10 w-3/4" />
                <div className="flex gap-3">
                  <Skeleton className="h-7 w-24" />
                  <Skeleton className="h-7 w-24" />
                  <Skeleton className="h-7 w-20" />
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="py-12 px-4 max-w-4xl mx-auto">
          <div className="rounded-xl border border-gray-100 bg-white/80 p-8 space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
            <div className="flex gap-4 justify-center">
              <Skeleton className="h-12 w-56" />
              <Skeleton className="h-12 w-56" />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
