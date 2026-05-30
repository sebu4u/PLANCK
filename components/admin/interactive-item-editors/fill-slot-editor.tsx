"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { nextInteractiveEditorId } from "@/lib/interactive-item-editor-helpers"
import {
  extractFillSlotPlaceholderIds,
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

function FillSlotAlignmentHints({
  latexTemplate,
  slots,
  chips,
}: {
  latexTemplate: string
  slots: Slot[]
  chips: string[]
}) {
  const slotIds = slots.map((s) => s.id.trim()).filter(Boolean)
  const placeholderIds = extractFillSlotPlaceholderIds(latexTemplate)
  const chipSet = new Set(chips.map((c) => c.trim()).filter(Boolean))
  const missingInSlots = placeholderIds.filter((id) => !slotIds.includes(id))
  const orphanSlots = slotIds.filter((id) => !placeholderIds.includes(id))
  const answersMissingFromChips = slots
    .map((s) => s.answer.trim())
    .filter((answer) => answer && !chipSet.has(answer))

  if (
    missingInSlots.length === 0 &&
    orphanSlots.length === 0 &&
    answersMissingFromChips.length === 0
  ) {
    return (
      <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
        Șablon, sloturi și chip-uri sunt aliniate.
      </p>
    )
  }

  return (
    <div className="space-y-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
      {missingInSlots.length > 0 ? (
        <p>Placeholder-e fără slot: {missingInSlots.map((id) => `{{${id}}}`).join(", ")}</p>
      ) : null}
      {orphanSlots.length > 0 ? <p>Sloturi fără placeholder în șablon: {orphanSlots.join(", ")}</p> : null}
      {answersMissingFromChips.length > 0 ? (
        <p>Răspunsuri corecte care lipsesc din chip-uri: {answersMissingFromChips.join(", ")}</p>
      ) : null}
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
    <div className="space-y-5">
      <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2.5 text-xs leading-relaxed text-violet-100">
        <strong>Flux rapid:</strong> scrie șablonul LaTeX cu {"{{id}}"} → „Extrage sloturi din șablon” → completează
        răspunsurile → adaugă chip-uri distractor → testează în preview live (dreapta).
      </div>

      <FillSlotAlignmentHints latexTemplate={latexTemplate} slots={slots} chips={chips} />

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
            <div key={`${slot.id}-${i}`} className="space-y-2 rounded-md border border-white/10 bg-black/30 p-3">
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
  )
}
