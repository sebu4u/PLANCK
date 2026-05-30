"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  getDefaultInteractiveItemContent,
  validateInteractiveItemContent,
  type LearningPathInteractiveItemType,
} from "@/lib/learning-path-interactive-items"
import { CardSortEditor } from "./interactive-item-editors/card-sort-editor"
import { CodeTraceEditor } from "./interactive-item-editors/code-trace-editor"
import { FillSlotEditor } from "./interactive-item-editors/fill-slot-editor"
import { FlowBuildEditor } from "./interactive-item-editors/flow-build-editor"
import { GraphBuildEditor } from "./interactive-item-editors/graph-build-editor"
import { MatchEditor } from "./interactive-item-editors/match-editor"
import { MemoryFlipEditor } from "./interactive-item-editors/memory-flip-editor"
import { RevealStepsEditor } from "./interactive-item-editors/reveal-steps-editor"
import { SliderExploreEditor } from "./interactive-item-editors/slider-explore-editor"
import { SpeedRoundEditor } from "./interactive-item-editors/speed-round-editor"
import { SwipeClassifyEditor } from "./interactive-item-editors/swipe-classify-editor"
import { TableFillEditor } from "./interactive-item-editors/table-fill-editor"
import { InteractiveItemEditorLayout } from "./interactive-item-editors/editor-layout"
import { InteractiveItemLivePreview } from "./interactive-item-editors/interactive-item-live-preview"
import { adminFieldClass } from "./interactive-item-editors/shared-fields"

function parseDraft(json: string, itemType: LearningPathInteractiveItemType): Record<string, unknown> {
  try {
    const p = JSON.parse(json || "{}") as unknown
    if (p && typeof p === "object" && !Array.isArray(p)) return p as Record<string, unknown>
  } catch {
    /* fallthrough */
  }
  return getDefaultInteractiveItemContent(itemType)
}

export function InteractiveItemContentEditor({
  itemType,
  formItemId,
  jsonValue,
  onJsonChange,
  remountNonce,
}: {
  itemType: LearningPathInteractiveItemType
  formItemId: string | undefined
  jsonValue: string
  onJsonChange: (next: string) => void
  remountNonce: number
}) {
  const initKey = `${formItemId ?? "new"}::${itemType}::${remountNonce}`

  const [draft, setDraft] = useState<Record<string, unknown>>(() => parseDraft(jsonValue, itemType))

  useEffect(() => {
    setDraft(parseDraft(jsonValue, itemType))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-sync only when editor identity / template reload changes
  }, [initKey])

  const commit = useCallback(
    (next: Record<string, unknown>) => {
      setDraft(next)
      onJsonChange(JSON.stringify(next))
    },
    [onJsonChange],
  )

  const validationError = useMemo(
    () => validateInteractiveItemContent(itemType, draft),
    [itemType, draft],
  )

  const editor = (() => {
    switch (itemType) {
      case "card_sort":
        return <CardSortEditor value={draft} onChange={commit} />
      case "fill_slot":
        return <FillSlotEditor value={draft} onChange={commit} />
      case "match":
        return <MatchEditor value={draft} onChange={commit} />
      case "graph_build":
        return <GraphBuildEditor value={draft} onChange={commit} />
      case "code_trace":
        return <CodeTraceEditor value={draft} onChange={commit} />
      case "swipe_classify":
        return <SwipeClassifyEditor value={draft} onChange={commit} />
      case "flow_build":
        return <FlowBuildEditor value={draft} onChange={commit} />
      case "slider_explore":
        return <SliderExploreEditor value={draft} onChange={commit} />
      case "table_fill":
        return <TableFillEditor value={draft} onChange={commit} />
      case "memory_flip":
        return <MemoryFlipEditor value={draft} onChange={commit} />
      case "speed_round":
        return <SpeedRoundEditor value={draft} onChange={commit} />
      case "reveal_steps":
        return <RevealStepsEditor value={draft} onChange={commit} />
      default:
        return null
    }
  })()

  const [rawText, setRawText] = useState("")

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-gray-400">
        Preview live în dreapta — același UI ca la elev. Editează câmpurile din stânga; preview-ul se actualizează
        instant când structura e validă.
      </p>
      <InteractiveItemEditorLayout
        editor={
          <>
            {editor}
            {validationError ? (
              <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                {validationError}
              </p>
            ) : (
              <p className="text-xs text-emerald-400/90">Structura respectă validarea pentru acest tip.</p>
            )}
          </>
        }
        preview={
          <InteractiveItemLivePreview
            itemType={itemType}
            draft={draft}
            validationError={validationError}
          />
        }
      />

      <details className="rounded-md border border-white/10 bg-black/20">
        <summary className="cursor-pointer select-none px-3 py-2 text-sm text-gray-300 hover:text-white">
          JSON avansat (import / editare manuală)
        </summary>
        <div className="space-y-2 border-t border-white/10 p-3">
          <p className="text-[11px] leading-snug text-gray-500">
            Lipește sau editează JSON-ul complet, apoi apasă „Aplică JSON”. Validarea folosește aceleași reguli ca la salvare.
          </p>
          <Textarea
            data-interactive-raw-json
            rows={12}
            spellCheck={false}
            className={`text-xs ${adminFieldClass}`}
            key={initKey}
            defaultValue={JSON.stringify(draft, null, 2)}
            onChange={(e) => setRawText(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/20 bg-white/5 text-gray-200 hover:bg-white/10"
            onClick={() => {
              const ta = document.querySelector<HTMLTextAreaElement>(
                "textarea[data-interactive-raw-json]",
              )
              const text = ta?.value ?? rawText
              try {
                const p = JSON.parse(text || "{}") as unknown
                if (!p || typeof p !== "object" || Array.isArray(p)) {
                  window.alert("JSON-ul trebuie să fie un obiect.")
                  return
                }
                const err = validateInteractiveItemContent(itemType, p)
                if (err) {
                  window.alert(err)
                  return
                }
                commit(p as Record<string, unknown>)
              } catch {
                window.alert("JSON invalid.")
              }
            }}
          >
            Aplică JSON
          </Button>
        </div>
      </details>
    </div>
  )
}
