"use client"

import { useCallback, useState } from "react"
import dynamic from "next/dynamic"
import { ProblemStatementSection } from "@/components/coding-problems/problem-statement-section"
import type { CodingProblem, CodingProblemExample } from "@/components/coding-problems/types"
import { PlanckCodeSettingsProvider } from "@/components/planckcode-settings-provider"
import { ProblemFeedbackBar } from "@/components/invata/problem-feedback-bar"
import { useRegisterLearningPathFixedBottomBar } from "@/components/invata/learning-path-item-chrome-context"
import { useNavigateToNextLearningPathItem } from "@/components/invata/learning-path-item-navigation-context"
import { useLearningPathItemCompletion } from "@/hooks/use-learning-path-item-completion"
import { fireLearningPathCorrectConfetti } from "@/lib/learning-path-confetti"
import { cn } from "@/lib/utils"

const EmbeddedIDE = dynamic(() => import("@/components/coding-problems/embedded-ide"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[420px] items-center justify-center rounded-2xl bg-black text-white">
      <div className="text-center">
        <div className="mb-4 mx-auto h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        <p className="text-sm text-white/60">Se încarcă IDE-ul...</p>
      </div>
    </div>
  ),
})

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
  const navigateToNextItem = useNavigateToNextLearningPathItem(nextItemHref)

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

  const handleAcceptedContinue = useCallback(async () => {
    await navigateToNextItem()
  }, [navigateToNextItem])

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
      <div
        className={cn(
          "-mx-5 bg-[#ffffff] px-4 py-4 sm:-mx-8 sm:px-8 sm:py-7 lg:-mx-12 lg:min-h-[calc(100dvh-3.5rem)] lg:px-12",
          showContinueBar && "pb-[calc(6rem+env(safe-area-inset-bottom,0px))]",
        )}
      >
        <div className="mx-auto grid w-full max-w-[1800px] gap-4 sm:gap-5 max-xl:grid-cols-1 xl:min-h-[calc(100dvh-7rem)] xl:grid-cols-[minmax(0,0.92fr)_minmax(620px,1.08fr)]">
          <section className="min-w-0 rounded-[22px] border border-[#ebe4f1] bg-[#ffffff] shadow-[0_12px_32px_rgba(76,44,114,0.06)] sm:rounded-[30px] sm:shadow-[0_18px_50px_rgba(76,44,114,0.08)]">
            <div className="px-4 py-5 sm:px-7 sm:py-8">
              <ProblemStatementSection problem={problem} examples={examples} theme="light" />
            </div>
          </section>

          <section className="min-w-0 max-xl:min-h-0 xl:sticky xl:top-4 xl:h-[calc(100dvh-8rem)] xl:min-h-[760px]">
            <EmbeddedIDE
              presentation="learning-path"
              defaultLanguage={isPython ? "python" : "cpp"}
              initialCode={
                isPython ? problem.boilerplate_python ?? undefined : problem.boilerplate_cpp ?? undefined
              }
              problemSlug={isPython ? problem.slug : undefined}
              onAcceptedSubmit={handleAcceptedSubmit}
              onAcceptedContinue={handleAcceptedContinue}
            />
          </section>
        </div>
      </div>
    </PlanckCodeSettingsProvider>
  )
}
