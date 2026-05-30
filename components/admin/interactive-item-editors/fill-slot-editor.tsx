"use client"

import { useCallback, useMemo, useState } from "react"
import { LessonRichContent } from "@/components/lesson-rich-content"
import { FillSlotFormula, FillSlotLatex } from "@/components/invata/fill-slot-formula"
import { Button } from "@/components/ui/button"
import { nextInteractiveEditorId } from "@/lib/interactive-item-editor-helpers"
import {
  buildFillSlotLatex,
  extractFillSlotPlaceholderIds,
  FILL_SLOT_CHIP_DRAG_MIME,
  FILL_SLOT_CHIP_SELECTED,
  FILL_SLOT_TEMPLATE_PRESETS,
} from "@/lib/fill-slot-latex"
import { cn } from "@/lib/utils"
import { AdminFieldLabel, AdminTextarea, AdminTextInput } from "./shared-fields"

type Slot = { id: string; answer: string }

function parseSlots(value: Record<string, unknown>): Slot[] {
  if (!Array.isArray(value.slots)) return []
  return value.slots.map((s) => {
    if (!s || typeof s !== "object") return { id: "", answer: "" }
    const o = s as Record<string, unknown>
    return { id: typeof o.id === "string" ? o.id : "", answer: typeof o.answer === "string" ? o.answer : "" }
  })
}

function parseChips(value: Record<string, unknown>): string[] {
  if (!Array.isArray(value.chips)) return []
  return value.chips.map((c) => (typeof c === "string" ? c : String(c)))
}

function commitValue(
  value: Record<string, unknown>,
  onChange: (next: Record<string, unknown>) => void,
  patch: {
    instructions?: string
    latexTemplate?: string
    slots?: Slot[]
    chips?: string[]
  },
) {
  onChange({
    ...value,
    instructions: patch.instructions ?? (typeof value.instructions === "string" ? value.instructions : ""),
    latexTemplate: patch.latexTemplate ?? (typeof value.latexTemplate === "string" ? value.latexTemplate : ""),
    slots: patch.slots ?? parseSlots(value),
    chips: patch.chips ?? parseChips(value),
  })
}

function ensureChipPresent(chips: string[], answer: string): string[] {
  const trimmed = answer.trim()
  if (!trimmed || chips.some((c) => c.trim() === trimmed)) return chips
  return [...chips, trimmed]
}

function FillSlotLivePreview({
  instructions,
  latexTemplate,
  slots,
  chips,
}: {
  instructions: string
  latexTemplate: string
  slots: Slot[]
  chips: string[]
}) {
  const slotIds = useMemo(() => slots.map((s) => s.id.trim()).filter(Boolean), [slots])
  const validSlots = useMemo(
    () => slots.filter((s) => s.id.trim()).map((s) => ({ id: s.id.trim(), answer: s.answer })),
    [slots],
  )
  const chipSet = useMemo(() => new Set(chips.map((c) => c.trim()).filter(Boolean)), [chips])
  const previewChips = useMemo(() => chips.map((c) => c.trim()).filter(Boolean), [chips])

  const [assign, setAssign] = useState<Record<string, string | null>>({})
  const [active, setActive] = useState<string | null>(null)
  const [selectedChip, setSelectedChip] = useState<string | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null)
  const [showAnswers, setShowAnswers] = useState(false)
  const [verifyResult, setVerifyResult] = useState<"ok" | "bad" | null>(null)

  const effectiveAssign = useMemo(() => {
    if (!showAnswers) return assign
    const next: Record<string, string | null> = {}
    for (const slot of validSlots) next[slot.id] = slot.answer.trim() || null
    return next
  }, [assign, showAnswers, validSlots])

  const renderedLatex = useMemo(
    () => buildFillSlotLatex(latexTemplate, effectiveAssign, active, verifyResult, validSlots),
    [latexTemplate, effectiveAssign, active, verifyResult, validSlots],
  )

  const used = new Set(Object.values(effectiveAssign).filter(Boolean) as string[])

  const placeChipInSlot = useCallback(
    (chip: string, slotId: string) => {
      const trimmed = chip.trim()
      if (!trimmed || !chipSet.has(trimmed) || showAnswers) return
      setVerifyResult(null)
      setSelectedChip(trimmed)
      setAssign((prev) => {
        const next: Record<string, string | null> = { ...prev }
        for (const id of slotIds) {
          if (next[id] === trimmed) next[id] = null
        }
        next[slotId] = trimmed
        return next
      })
      setActive(slotId)
    },
    [chipSet, showAnswers, slotIds],
  )

  const handleVerify = () => {
    if (showAnswers) return
    const allFilled = slotIds.length > 0 && slotIds.every((id) => effectiveAssign[id])
    if (!allFilled) return
    const allOk = validSlots.every((s) => (effectiveAssign[s.id] || "").trim() === s.answer.trim())
    setVerifyResult(allOk ? "ok" : "bad")
  }

  const handleResetPreview = () => {
    setAssign({})
    setActive(slotIds[0] ?? null)
    setSelectedChip(null)
    setVerifyResult(null)
    setShowAnswers(false)
  }

  const placeholderIds = extractFillSlotPlaceholderIds(latexTemplate)
  const missingInSlots = placeholderIds.filter((id) => !slotIds.includes(id))
  const orphanSlots = slotIds.filter((id) => !placeholderIds.includes(id))
  const answersMissingFromChips = validSlots
    .map((s) => s.answer.trim())
    .filter((answer) => answer && !chipSet.has(answer))

  return (
    <div className="rounded-xl border border-white/15 bg-[#faf8fc] text-[#1a1423] shadow-inner">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ece6f2] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6f657b]">Preview live</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 border-[#cfc3dc] bg-white text-xs text-[#2a2433] hover:bg-[#f5f0fa]"
            onClick={() => {
              setShowAnswers((prev) => !prev)
              setVerifyResult(null)
            }}
          >
            {showAnswers ? "Ascunde răspunsuri" : "Arată răspunsuri corecte"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 border-[#cfc3dc] bg-white text-xs text-[#2a2433] hover:bg-[#f5f0fa]"
            onClick={handleResetPreview}
          >
            Reset preview
          </Button>
        </div>
      </div>

      <div className="space-y-4 px-4 py-5">
        {instructions.trim() ? (
          <div className="prose prose-sm mx-auto max-w-none text-center text-[#2a2433]">
            <LessonRichContent content={instructions} theme="light" />
          </div>
        ) : (
          <p className="text-center text-xs italic text-[#9a8fb0]">Fără instrucțiuni</p>
        )}

        {latexTemplate.trim() ? (
          <FillSlotFormula
            latex={renderedLatex}
            slotIds={slotIds}
            autoResult={verifyResult}
            dragOverSlot={dragOverSlot}
            onSelectSlot={(slotId) => {
              if (showAnswers) return
              setActive(slotId)
              setSelectedChip(effectiveAssign[slotId] ?? null)
            }}
            onDropChip={placeChipInSlot}
            setDragOverSlot={setDragOverSlot}
            interactive={!showAnswers}
          />
        ) : (
          <p className="text-center text-sm text-amber-700">Adaugă un șablon LaTeX cu placeholder-e {"{{id}}"}.</p>
        )}

        {previewChips.length > 0 ? (
          <div className="mx-auto flex w-full max-w-3xl flex-wrap justify-center gap-2">
            {previewChips.map((chip) => {
              const taken = used.has(chip)
              return (
                <button
                  type="button"
                  key={chip}
                  draggable={!showAnswers}
                  onDragStart={(e) => {
                    setSelectedChip(chip)
                    e.dataTransfer.setData(FILL_SLOT_CHIP_DRAG_MIME, chip)
                    e.dataTransfer.setData("text/plain", chip)
                    e.dataTransfer.effectAllowed = "move"
                  }}
                  disabled={showAnswers}
                  onClick={() => {
                    if (showAnswers) return
                    setSelectedChip(chip)
                    if (!active) return
                    placeChipInSlot(chip, active)
                  }}
                  className={cn(
                    "rounded-lg border-[2.5px] bg-white px-2.5 py-2 text-center shadow-[0_3px_0_#9d8ab3] transition-[border-color,opacity] border-[#cfc3dc]",
                    !showAnswers && "cursor-grab active:cursor-grabbing hover:border-[#a898bc]",
                    showAnswers && "cursor-default opacity-80",
                    taken && !selectedChip && "opacity-90",
                    selectedChip === chip && FILL_SLOT_CHIP_SELECTED,
                  )}
                >
                  <FillSlotLatex content={chip} className="text-[#222] [&_.katex]:text-xs" />
                </button>
              )
            })}
          </div>
        ) : (
          <p className="text-center text-xs italic text-[#9a8fb0]">Adaugă cel puțin un chip.</p>
        )}

        {!showAnswers && slotIds.length > 0 ? (
          <div className="flex justify-center">
            <Button
              type="button"
              size="sm"
              className="bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
              onClick={handleVerify}
            >
              Verifică (preview)
            </Button>
          </div>
        ) : null}

        {verifyResult === "ok" ? (
          <p className="text-center text-sm font-medium text-emerald-700">Răspuns corect în preview.</p>
        ) : null}
        {verifyResult === "bad" ? (
          <p className="text-center text-sm font-medium text-red-600">Răspuns greșit în preview.</p>
        ) : null}
      </div>

      <div className="space-y-1 border-t border-[#ece6f2] px-4 py-3 text-[11px] leading-snug text-[#6f657b]">
        {missingInSlots.length > 0 ? (
          <p className="text-amber-700">
            Placeholder-e fără slot definit: {missingInSlots.map((id) => `{{${id}}}`).join(", ")}
          </p>
        ) : null}
        {orphanSlots.length > 0 ? (
          <p className="text-amber-700">Sloturi fără placeholder în șablon: {orphanSlots.join(", ")}</p>
        ) : null}
        {answersMissingFromChips.length > 0 ? (
          <p className="text-amber-700">
            Răspunsuri corecte care lipsesc din chip-uri: {answersMissingFromChips.join(", ")}
          </p>
        ) : null}
        {missingInSlots.length === 0 && orphanSlots.length === 0 && answersMissingFromChips.length === 0 ? (
          <p className="text-emerald-700">Șablon, sloturi și chip-uri sunt aliniate.</p>
        ) : null}
      </div>
    </div>
  )
}

export function FillSlotEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const instructions = typeof value.instructions === "string" ? value.instructions : ""
  const latexTemplate = typeof value.latexTemplate === "string" ? value.latexTemplate : ""
  const slots = parseSlots(value)
  const chips = parseChips(value)

  const placeholderIds = useMemo(() => extractFillSlotPlaceholderIds(latexTemplate), [latexTemplate])

  const syncSlotsFromTemplate = () => {
    const ids = extractFillSlotPlaceholderIds(latexTemplate)
    const byId = new Map(slots.map((s) => [s.id.trim(), s]))
    const nextSlots = ids.map((id) => byId.get(id) ?? { id, answer: "" })
    let nextChips = [...chips]
    for (const slot of nextSlots) nextChips = ensureChipPresent(nextChips, slot.answer)
    commitValue(value, onChange, { instructions, latexTemplate, slots: nextSlots, chips: nextChips })
  }

  const syncChipsFromAnswers = () => {
    let nextChips = [...chips]
    for (const slot of slots) nextChips = ensureChipPresent(nextChips, slot.answer)
    commitValue(value, onChange, { instructions, latexTemplate, slots, chips: nextChips })
  }

  const addSlot = () => {
    const id = nextInteractiveEditorId("s")
    const token = `{{${id}}}`
    const nextTemplate =
      latexTemplate.trim().length === 0
        ? token
        : latexTemplate + (latexTemplate.endsWith(" ") ? "" : " ") + token
    commitValue(value, onChange, {
      instructions,
      latexTemplate: nextTemplate,
      slots: [...slots, { id, answer: "" }],
      chips,
    })
  }

  const updateSlot = (index: number, patch: Partial<Slot>) => {
    const next = [...slots]
    const prev = next[index]
    if (!prev) return
    const updated = { ...prev, ...patch }
    if (patch.id && patch.id !== prev.id) {
      const oldToken = `{{${prev.id}}}`
      const newToken = `{{${updated.id}}}`
      const nextTemplate = latexTemplate.includes(oldToken)
        ? latexTemplate.replaceAll(oldToken, newToken)
        : latexTemplate
      next[index] = updated
      let nextChips = chips
      if (patch.answer !== undefined) nextChips = ensureChipPresent(chips, updated.answer)
      commitValue(value, onChange, { instructions, latexTemplate: nextTemplate, slots: next, chips: nextChips })
      return
    }
    next[index] = updated
    let nextChips = chips
    if (patch.answer !== undefined) nextChips = ensureChipPresent(chips, updated.answer)
    commitValue(value, onChange, { instructions, latexTemplate, slots: next, chips: nextChips })
  }

  const removeSlot = (index: number) => {
    const slot = slots[index]
    if (!slot) return
    const token = `{{${slot.id}}}`
    const nextTemplate = latexTemplate.replaceAll(token, "").replace(/\s{2,}/g, " ").trim()
    commitValue(value, onChange, {
      instructions,
      latexTemplate: nextTemplate,
      slots: slots.filter((_, i) => i !== index),
      chips,
    })
  }

  const insertPlaceholder = (slotId: string) => {
    const token = `{{${slotId}}}`
    if (latexTemplate.includes(token)) return
    const nextTemplate =
      latexTemplate + (latexTemplate.endsWith(" ") || latexTemplate.length === 0 ? "" : " ") + token
    commitValue(value, onChange, { instructions, latexTemplate: nextTemplate, slots, chips })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <div className="space-y-5">
        <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2.5 text-xs leading-relaxed text-violet-100">
          <strong>Flux rapid:</strong> scrie șablonul LaTeX cu {"{{id}}"} → „Extrage sloturi din șablon” → completează
          răspunsurile → adaugă chip-uri distractor → verifică în preview live.
        </div>

        <div className="space-y-1">
          <AdminFieldLabel>Instrucțiuni (afișate elevului)</AdminFieldLabel>
          <AdminTextarea
            rows={2}
            value={instructions}
            placeholder="Ex: Completează spațiile goale trăgând valorile corecte."
            onChange={(e) => commitValue(value, onChange, { instructions: e.target.value, latexTemplate, slots, chips })}
          />
        </div>

        <div className="space-y-2">
          <AdminFieldLabel>Șablon LaTeX</AdminFieldLabel>
          <AdminTextarea
            rows={4}
            value={latexTemplate}
            placeholder="F = {{m}} \\cdot a"
            onChange={(e) =>
              commitValue(value, onChange, { instructions, latexTemplate: e.target.value, slots, chips })
            }
          />
          <div className="flex flex-wrap gap-2">
            {FILL_SLOT_TEMPLATE_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                size="sm"
                variant="outline"
                className="h-8 border-white/20 bg-white/5 text-xs text-gray-200"
                onClick={() =>
                  commitValue(value, onChange, { instructions, latexTemplate: preset.template, slots, chips })
                }
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-white/20 bg-white/5 text-gray-200"
              onClick={syncSlotsFromTemplate}
            >
              Extrage sloturi din șablon
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-white/20 bg-white/5 text-gray-200"
              onClick={syncChipsFromAnswers}
            >
              Adaugă răspunsurile în chip-uri
            </Button>
          </div>
          {placeholderIds.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {placeholderIds.map((id) => {
                const slot = slots.find((s) => s.id.trim() === id)
                const ok = Boolean(slot?.answer.trim())
                return (
                  <span
                    key={id}
                    className={cn(
                      "rounded-full px-2 py-0.5 font-mono text-[11px]",
                      ok ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-100",
                    )}
                  >
                    {`{{${id}}}`}
                  </span>
                )
              })}
            </div>
          ) : (
            <p className="text-[11px] text-gray-500">Niciun placeholder detectat. Folosește sintaxa {"{{idSlot}}"}.</p>
          )}
        </div>

        <div className="space-y-2">
          <AdminFieldLabel>Sloturi (id + răspuns corect LaTeX/text)</AdminFieldLabel>
          {slots.length === 0 ? (
            <p className="text-xs text-gray-500">Niciun slot. Adaugă manual sau extrage din șablon.</p>
          ) : null}
          {slots.map((slot, i) => {
            const inTemplate = placeholderIds.includes(slot.id.trim())
            return (
              <div
                key={`${slot.id}-${i}`}
                className="space-y-2 rounded-md border border-white/10 bg-black/30 p-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <AdminTextInput
                    className="sm:w-36 font-mono"
                    placeholder="id slot"
                    value={slot.id}
                    onChange={(e) => updateSlot(i, { id: e.target.value.trim() })}
                  />
                  <AdminTextInput
                    className="min-w-0 flex-1 font-mono"
                    placeholder="Răspuns corect (ex: 2 sau \\frac{1}{2})"
                    value={slot.answer}
                    onChange={(e) => updateSlot(i, { answer: e.target.value })}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {!inTemplate && slot.id.trim() ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-gray-200"
                      onClick={() => insertPlaceholder(slot.id.trim())}
                    >
                      Inserează {"{{"}{slot.id.trim()}{"}}"} în șablon
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-300"
                    onClick={() => removeSlot(i)}
                  >
                    Șterge slot
                  </Button>
                </div>
              </div>
            )
          })}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/20 bg-white/5 text-gray-200"
            onClick={addSlot}
          >
            Adaugă slot
          </Button>
        </div>

        <div className="space-y-2">
          <AdminFieldLabel>Chip-uri (valori de ales — include răspunsurile corecte + distractori)</AdminFieldLabel>
          {chips.map((chip, i) => (
            <div key={i} className="flex gap-2">
              <AdminTextInput
                className="flex-1 font-mono"
                placeholder="Valoare chip"
                value={chip}
                onChange={(e) => {
                  const next = [...chips]
                  next[i] = e.target.value
                  commitValue(value, onChange, { instructions, latexTemplate, slots, chips: next })
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-300"
                onClick={() =>
                  commitValue(value, onChange, {
                    instructions,
                    latexTemplate,
                    slots,
                    chips: chips.filter((_, j) => j !== i),
                  })
                }
              >
                ×
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-white/20 text-gray-200"
              onClick={() => commitValue(value, onChange, { instructions, latexTemplate, slots, chips: [...chips, ""] })}
            >
              Adaugă chip
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-white/20 text-gray-200"
              onClick={syncChipsFromAnswers}
            >
              + răspunsuri corecte
            </Button>
          </div>
        </div>
      </div>

      <div className="xl:sticky xl:top-4 xl:self-start">
        <FillSlotLivePreview
          instructions={instructions}
          latexTemplate={latexTemplate}
          slots={slots}
          chips={chips}
        />
      </div>
    </div>
  )
}
