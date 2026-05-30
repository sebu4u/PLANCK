"use client"

import { useEffect, useMemo, useRef } from "react"
import { InlineMath } from "react-katex"
import katex from "katex"
import { LatexRichText } from "@/components/classrooms/latex-rich-text"
import { hasMixedLatexDelimiters } from "@/lib/parse-mixed-latex"
import {
  FILL_SLOT_CHIP_DRAG_MIME,
  normalizeLatexSegment,
} from "@/lib/fill-slot-latex"
import { cn } from "@/lib/utils"

export function FillSlotLatex({ content, className }: { content: string; className?: string }) {
  const trimmed = content.trim()
  if (!trimmed) return null

  if (hasMixedLatexDelimiters(trimmed)) {
    return (
      <LatexRichText
        content={trimmed}
        className={cn("text-inherit [&_.katex]:text-inherit", className)}
      />
    )
  }

  return (
    <span className={cn("inline-block text-inherit [&_.katex]:text-inherit", className)}>
      <InlineMath math={normalizeLatexSegment(trimmed)} />
    </span>
  )
}

export function FillSlotFormula({
  latex,
  slotIds,
  autoResult,
  dragOverSlot,
  onSelectSlot,
  onDropChip,
  setDragOverSlot,
  interactive = true,
}: {
  latex: string
  slotIds: string[]
  autoResult: "ok" | "bad" | null
  dragOverSlot: string | null
  onSelectSlot: (slotId: string) => void
  onDropChip: (chip: string, slotId: string) => void
  setDragOverSlot: (slotId: string | null) => void
  interactive?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        trust: true,
        strict: "ignore",
        throwOnError: false,
        displayMode: true,
      })
    } catch {
      return ""
    }
  }, [latex])

  useEffect(() => {
    const root = containerRef.current
    if (!root || !interactive) return

    const cleanups: Array<() => void> = []

    for (const slotId of slotIds) {
      const el = root.querySelector(`#fill-slot-${slotId}`) as HTMLElement | null
      if (!el) continue

      el.setAttribute("role", "button")
      el.setAttribute("tabindex", autoResult === "ok" ? "-1" : "0")
      el.classList.add("fill-slot-target", "rounded-sm", "transition-shadow")
      el.style.cursor = autoResult === "ok" ? "default" : "pointer"
      el.classList.toggle("ring-2", dragOverSlot === slotId && autoResult !== "ok")
      el.classList.toggle("ring-violet-400", dragOverSlot === slotId && autoResult !== "ok")
      el.classList.toggle("ring-offset-2", dragOverSlot === slotId && autoResult !== "ok")

      const onClick = () => onSelectSlot(slotId)
      const onDragOver = (e: DragEvent) => {
        if (autoResult === "ok") return
        e.preventDefault()
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move"
        setDragOverSlot(slotId)
      }
      const onDragLeave = () => setDragOverSlot(null)
      const onDrop = (e: DragEvent) => {
        e.preventDefault()
        setDragOverSlot(null)
        if (autoResult === "ok") return
        const raw =
          e.dataTransfer?.getData(FILL_SLOT_CHIP_DRAG_MIME) || e.dataTransfer?.getData("text/plain")
        if (raw) onDropChip(raw, slotId)
      }

      el.addEventListener("click", onClick)
      el.addEventListener("dragover", onDragOver)
      el.addEventListener("dragleave", onDragLeave)
      el.addEventListener("drop", onDrop)

      cleanups.push(() => {
        el.removeEventListener("click", onClick)
        el.removeEventListener("dragover", onDragOver)
        el.removeEventListener("dragleave", onDragLeave)
        el.removeEventListener("drop", onDrop)
      })
    }

    return () => cleanups.forEach((fn) => fn())
  }, [html, slotIds, autoResult, dragOverSlot, onSelectSlot, onDropChip, setDragOverSlot, interactive])

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full max-w-4xl overflow-x-auto px-2 text-center text-[#1a1423]",
        "[&_.katex-display]:my-0 [&_.katex]:text-[1.35rem] sm:[&_.katex]:text-[1.65rem] md:[&_.katex]:text-[1.95rem]",
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
