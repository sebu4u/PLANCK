"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProblemStatementSection } from "@/components/coding-problems/problem-statement-section"
import type { CodingProblem, CodingProblemExample } from "@/components/coding-problems/types"
import { PlanckCodeSettingsProvider } from "@/components/planckcode-settings-provider"
import { CatalogThemeProvider, useCatalogTheme } from "@/components/catalog-theme-provider"
import { ProblemFeedbackBar } from "@/components/invata/problem-feedback-bar"
import { useRegisterLearningPathFixedBottomBar } from "@/components/invata/learning-path-item-chrome-context"
import { useLearningPathItemCompletion } from "@/hooks/use-learning-path-item-completion"
import { fireLearningPathCorrectConfetti } from "@/lib/learning-path-confetti"
import { cn } from "@/lib/utils"

const EmbeddedIDE = dynamic(() => import("@/components/coding-problems/embedded-ide"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-black text-white">
      <div className="text-center">
        <div className="mb-4 mx-auto h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        <p className="text-sm text-white/60">Se încarcă IDE-ul...</p>
      </div>
    </div>
  ),
})

function StatementPanelBackground({
  children,
  defaultBackgroundClass = "bg-[#121212]",
}: {
  children: React.ReactNode
  defaultBackgroundClass?: string
}) {
  const { themeImage, theme } = useCatalogTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const hasCustomTheme = mounted && themeImage && theme !== "default"

  if (hasCustomTheme) {
    return (
      <div className="relative h-full has-custom-theme">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${themeImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(8px)",
            transform: "scale(1.1)",
          }}
        />
        <div
          className="absolute inset-0 z-[1] bg-black/40"
          style={{ backdropFilter: "blur(2px)" }}
        />
        <div className="relative z-10 h-full">{children}</div>
      </div>
    )
  }

  return <div className={cn("relative h-full", defaultBackgroundClass)}>{children}</div>
}

interface LearningPathCodingProblemSectionProps {
  problem: CodingProblem
  examples: CodingProblemExample[]
  itemIndex: number
  lessonId: string
  currentItemId: string
  isLastItem: boolean
  nextItemHref: string
  initialCompleted?: boolean
}

export function LearningPathCodingProblemSection({
  problem,
  examples,
  itemIndex,
  lessonId,
  currentItemId,
  isLastItem,
  nextItemHref,
  initialCompleted = false,
}: LearningPathCodingProblemSectionProps) {
  const [solved, setSolved] = useState(initialCompleted)
  const markComplete = useLearningPathItemCompletion({
    itemId: currentItemId,
    lessonId,
    isLastItem,
  })

  const classLabel = useMemo(() => {
    return Number.isFinite(problem.class) ? `Clasa a ${problem.class}-a` : undefined
  }, [problem.class])

  const metaText = useMemo(() => {
    return [problem.difficulty, classLabel, problem.chapter]
      .filter((item): item is string => Boolean(item && String(item).trim().length > 0))
      .join(" • ")
  }, [problem.difficulty, problem.chapter, classLabel])

  const isPython = problem.language === "python"
  const showContinueBar = solved || !isPython

  const handleAcceptedSubmit = useCallback(async () => {
    setSolved(true)
    fireLearningPathCorrectConfetti()
    await markComplete()
  }, [markComplete])

  const handleContinueWithoutSubmit = useCallback(async () => {
    if (!solved) {
      await markComplete()
    }
  }, [markComplete, solved])

  useRegisterLearningPathFixedBottomBar(
    () =>
      showContinueBar ? (
        <ProblemFeedbackBar
          state="correct"
          hasAnswer
          nextItemHref={nextItemHref}
          onVerify={() => {}}
          onRetry={() => {}}
          onContinue={handleContinueWithoutSubmit}
          answerSlot={null}
        />
      ) : null,
    [showContinueBar, nextItemHref, solved]
  )

  return (
    <PlanckCodeSettingsProvider>
      <CatalogThemeProvider catalogType="info" pageType="detail">
        <div
          className={cn(
            "-mx-5 flex min-h-[calc(100dvh-3.5rem)] flex-col overflow-hidden sm:-mx-8 lg:-mx-12",
            showContinueBar && isPython && "pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]",
          )}
        >
          <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-1 max-md:flex-col">
            <ResizablePanel
              defaultSize={50}
              minSize={30}
              maxSize={70}
              className="max-md:!h-auto max-md:!min-h-[45vh]"
            >
              <StatementPanelBackground defaultBackgroundClass="bg-[#121212]">
                <ScrollArea className="h-full">
                  <div className="mx-auto max-w-4xl px-5 py-6 text-white sm:px-7 sm:py-8">
                    <div className="mb-6 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                        Pasul {itemIndex}
                      </span>
                      {metaText ? (
                        <span className="font-vt323 text-sm uppercase tracking-[0.18em] text-white/50">
                          {metaText}
                        </span>
                      ) : null}
                      {isPython ? (
                        <span className="font-vt323 rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.2em] text-amber-100">
                          Python
                        </span>
                      ) : (
                        <span className="font-vt323 rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.2em] text-sky-100/90">
                          C++
                        </span>
                      )}
                    </div>
                    <ProblemStatementSection problem={problem} examples={examples} />
                  </div>
                </ScrollArea>
              </StatementPanelBackground>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-[#e8e2ee] transition-colors max-md:hidden" />

            <ResizablePanel
              defaultSize={50}
              minSize={30}
              maxSize={70}
              className="max-md:!h-[min(55vh,520px)]"
            >
              <div className="h-full overflow-hidden bg-black">
                <EmbeddedIDE
                  defaultLanguage={isPython ? "python" : "cpp"}
                  initialCode={
                    isPython ? problem.boilerplate_python ?? undefined : problem.boilerplate_cpp ?? undefined
                  }
                  problemSlug={isPython ? problem.slug : undefined}
                  onAcceptedSubmit={handleAcceptedSubmit}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </CatalogThemeProvider>
    </PlanckCodeSettingsProvider>
  )
}
