import { Navigation } from "@/components/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlanckCodeSettingsProvider } from "@/components/planckcode-settings-provider"
import { PlanckCodeSidebar } from "@/components/planckcode-sidebar"

export default function Loading() {
  return (
    <PlanckCodeSettingsProvider>
      <div className="h-screen bg-[#070707] text-white overflow-hidden flex flex-col">
        <Navigation />
        <PlanckCodeSidebar />
        
        <main className="md:ml-16 mt-16 h-[calc(100vh-64px)] flex overflow-hidden">
          {/* Left Panel - Problem Statement */}
          <ResizablePanelGroup direction="horizontal" className="flex-1 max-md:flex-col">
            <ResizablePanel defaultSize={50} minSize={30} maxSize={70} className="max-md:!h-auto max-md:!min-h-[50vh]">
              <ScrollArea className="h-full bg-[#121212]">
                <div className="mx-auto max-w-4xl px-6 py-8 sm:px-8 lg:px-12">
                  {/* Back button and meta skeleton */}
                  <div className="mb-8 flex flex-wrap items-center gap-3">
                    <Skeleton className="h-8 w-40 rounded-full bg-white/10" />
                    <Skeleton className="h-4 w-48 bg-white/10" />
                  </div>

                  {/* Title skeleton */}
                  <div className="mb-8 space-y-3">
                    <Skeleton className="h-6 w-16 bg-white/10" />
                    <Skeleton className="h-10 w-3/4 bg-white/10" />
                  </div>

                  {/* Sections skeletons */}
                  <div className="space-y-8">
                    {/* Cerință section */}
                    <section className="space-y-2">
                      <Skeleton className="h-5 w-20 bg-white/10" />
                      <div className="rounded-md border border-white/12 bg-[#161616] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full bg-white/10" />
                          <Skeleton className="h-4 w-5/6 bg-white/10" />
                          <Skeleton className="h-4 w-4/6 bg-white/10" />
                        </div>
                      </div>
                    </section>

                    {/* Date de intrare section */}
                    <section className="space-y-2">
                      <Skeleton className="h-5 w-32 bg-white/10" />
                      <div className="rounded-md border border-white/12 bg-[#161616] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full bg-white/10" />
                          <Skeleton className="h-4 w-5/6 bg-white/10" />
                          <Skeleton className="h-4 w-3/4 bg-white/10" />
                        </div>
                      </div>
                    </section>

                    {/* Date de ieșire section */}
                    <section className="space-y-2">
                      <Skeleton className="h-5 w-28 bg-white/10" />
                      <div className="rounded-md border border-white/12 bg-[#161616] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full bg-white/10" />
                          <Skeleton className="h-4 w-4/6 bg-white/10" />
                        </div>
                      </div>
                    </section>

                    {/* Restricții section */}
                    <section className="space-y-2">
                      <Skeleton className="h-5 w-24 bg-white/10" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full bg-white/10" />
                        <Skeleton className="h-4 w-5/6 bg-white/10" />
                      </div>
                    </section>

                    {/* Exemple section */}
                    <section className="space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                        <Skeleton className="h-6 w-24 mb-4 bg-white/10" />
                        <div className="space-y-6">
                          {[1, 2].map((i) => (
                            <div key={i} className="space-y-3">
                              <Skeleton className="h-4 w-20 bg-white/10" />
                              <div className="space-y-2">
                                <Skeleton className="h-3 w-16 bg-white/10" />
                                <div className="rounded-lg border border-white/10 bg-black/40 p-4">
                                  <Skeleton className="h-16 w-full bg-white/10" />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Skeleton className="h-3 w-16 bg-white/10" />
                                <div className="rounded-lg border border-white/10 bg-black/40 p-4">
                                  <Skeleton className="h-16 w-full bg-white/10" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </ScrollArea>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-white/10 hover:bg-white/20 transition-colors max-md:hidden" />

            {/* Right Panel - IDE skeleton */}
            <ResizablePanel defaultSize={50} minSize={30} maxSize={70} className="max-md:!h-[50vh]">
              <div className="h-full overflow-hidden bg-black flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white mx-auto" />
                  <p className="text-sm text-white/60">Se încarcă IDE-ul...</p>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
      </div>
    </PlanckCodeSettingsProvider>
  )
}

