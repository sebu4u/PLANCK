"use client"

import { useCallback, useMemo } from "react"
import { LearningPathExplainChatProvider } from "@/components/invata/learning-path-explain-chat-context"
import { LearningPathFlashcardFlowProvider } from "@/components/invata/learning-path-flashcard-flow-context"
import {
  LearningPathItemChromeProvider,
  useLearningPathItemChrome,
} from "@/components/invata/learning-path-item-chrome-context"
import { LearningPathInteractiveLessonItem } from "@/components/invata/learning-path-interactive-lesson-item"
import {
  parseInteractiveItemContent,
  type LearningPathInteractiveItemType,
} from "@/lib/learning-path-interactive-items"
import { cn } from "@/lib/utils"

const PREVIEW_STYLE = `
  .lp-interactive-preview [class*="min-h-[calc(100dvh"] {
    min-height: unset !important;
  }
  .lp-interactive-preview .fixed.bottom-0 {
    position: static !important;
    inset: auto !important;
    width: 100% !important;
    transform: none !important;
    border-top-width: 1px !important;
    box-shadow: none !important;
  }
  .lp-interactive-preview .fixed.bottom-0 > div {
    padding-left: 0.75rem !important;
    padding-right: 0.75rem !important;
  }
`

function PreviewChromeBody({ children }: { children: React.ReactNode }) {
  const chrome = useLearningPathItemChrome()

  return (
    <div className="flex min-h-[420px] flex-col">
      <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      {chrome?.fixedBottomBar ? (
        <div className="shrink-0 border-t border-[#ece6f2] bg-white/95">{chrome.fixedBottomBar}</div>
      ) : null}
    </div>
  )
}

function InteractiveItemPreviewRuntime({
  itemType,
  draft,
}: {
  itemType: LearningPathInteractiveItemType
  draft: Record<string, unknown>
}) {
  const parsed = useMemo(() => parseInteractiveItemContent(itemType, draft), [itemType, draft])
  const noop = useCallback(async () => {}, [])

  if (!parsed.ok) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm font-medium text-amber-800">Preview indisponibil</p>
        <p className="mt-2 text-xs leading-relaxed text-amber-700/90">{parsed.error}</p>
        <p className="mt-3 text-[11px] text-[#6f657b]">
          Completează câmpurile obligatorii — preview-ul se actualizează automat când structura devine validă.
        </p>
      </div>
    )
  }

  return (
    <LearningPathExplainChatProvider currentItemId="preview">
      <LearningPathItemChromeProvider>
        <LearningPathFlashcardFlowProvider currentItemId="preview" goToNextItem={noop}>
          <PreviewChromeBody>
            <div className="bg-[#faf8fc] px-2 py-4 sm:px-4">
              <LearningPathInteractiveLessonItem
                parsed={parsed.value}
                itemId=""
                lessonId=""
                nextItemHref="#preview"
                isLastItem={false}
                chapterSlug="preview"
                lessonSlug="preview"
                itemTitle="Preview"
                itemType={itemType}
              />
            </div>
          </PreviewChromeBody>
        </LearningPathFlashcardFlowProvider>
      </LearningPathItemChromeProvider>
    </LearningPathExplainChatProvider>
  )
}

export function InteractiveItemLivePreview({
  itemType,
  draft,
  validationError,
  className,
}: {
  itemType: LearningPathInteractiveItemType
  draft: Record<string, unknown>
  validationError: string | null
  className?: string
}) {
  return (
    <div
      className={cn(
        "lp-interactive-preview overflow-hidden rounded-xl border border-white/15 bg-[#faf8fc] text-[#1a1423] shadow-inner",
        className,
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: PREVIEW_STYLE }} />
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ece6f2] bg-white/80 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6f657b]">Preview live</p>
        {validationError ? (
          <span className="text-[11px] font-medium text-amber-700">Structură incompletă</span>
        ) : (
          <span className="text-[11px] font-medium text-emerald-700">Interactiv — ca la elev</span>
        )}
      </div>
      <InteractiveItemPreviewRuntime itemType={itemType} draft={draft} />
      {validationError ? (
        <p className="border-t border-[#ece6f2] px-4 py-2.5 text-[11px] leading-snug text-amber-800">{validationError}</p>
      ) : null}
    </div>
  )
}
