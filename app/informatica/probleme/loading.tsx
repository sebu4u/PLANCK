import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <Navigation />
      <main className="flex min-h-[calc(100vh-64px)] flex-col overflow-hidden">
        <section className="bg-[#090909] pb-16 pt-20">
          <div className="mx-auto w-full max-w-6xl px-6 sm:px-8 md:px-12 lg:px-16">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-8 shadow-[0px_24px_70px_-40px_rgba(0,0,0,1)] sm:px-8">
              <Skeleton className="h-6 w-32 rounded-full bg-white/10" />
              <Skeleton className="mt-4 h-10 w-2/3 rounded-full bg-white/10" />
              <Skeleton className="mt-3 h-20 w-full rounded-3xl bg-white/10" />
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`loading-card-${index}`}
                  className="flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.05] p-6"
                >
                  <Skeleton className="h-5 w-1/2 rounded-full bg-white/10" />
                  <Skeleton className="h-6 w-3/4 rounded-full bg-white/10" />
                  <Skeleton className="h-12 w-full rounded-3xl bg-white/10" />
                  <Skeleton className="h-10 w-2/3 rounded-full bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

