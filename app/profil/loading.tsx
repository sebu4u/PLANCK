import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingProfile() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <div className="relative z-10 w-full max-w-2xl px-4 py-12 flex flex-col items-center">
        <div className="w-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-lg border-0 shadow-2xl rounded-2xl p-8">
          <div className="flex flex-col items-center space-y-6">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="flex flex-col items-center gap-2 w-full">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-8 w-64" />
            </div>
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-3 w-full" />
          </div>
          <div className="mt-8">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </main>
  )
}
