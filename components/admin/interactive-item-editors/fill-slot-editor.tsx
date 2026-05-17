"use client"

import { Button } from "@/components/ui/button"
import { nextInteractiveEditorId } from "@/lib/interactive-item-editor-helpers"
import { AdminFieldLabel, AdminTextarea, AdminTextInput } from "./shared-fields"

type Slot = { id: string; answer: string }

export function FillSlotEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const instructions = typeof value.instructions === "string" ? value.instructions : ""
  const latexTemplate = typeof value.latexTemplate === "string" ? value.latexTemplate : ""

  const slots: Slot[] = Array.isArray(value.slots)
    ? value.slots.map((s) => {
        if (!s || typeof s !== "object") return { id: "", answer: "" }
        const o = s as Record<string, unknown>
        return { id: typeof o.id === "string" ? o.id : "", answer: typeof o.answer === "string" ? o.answer : "" }
      })
    : []

  const chips: string[] = Array.isArray(value.chips)
    ? value.chips.map((c) => (typeof c === "string" ? c : String(c)))
    : []

  const setSlots = (next: Slot[]) => onChange({ ...value, instructions, latexTemplate, slots: next, chips })
  const setChips = (next: string[]) => onChange({ ...value, instructions, latexTemplate, slots, chips: next })

  const insertPlaceholder = (slotId: string) => {
    const token = `{{${slotId}}}`
    onChange({
      ...value,
      instructions,
      latexTemplate: latexTemplate + (latexTemplate.endsWith(" ") || latexTemplate.length === 0 ? "" : " ") + token,
      slots,
      chips,
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <AdminFieldLabel>Instrucțiuni (opțional)</AdminFieldLabel>
        <AdminTextarea rows={2} value={instructions} onChange={(e) => onChange({ ...value, instructions: e.target.value, latexTemplate, slots, chips })} />
      </div>
      <div className="space-y-1">
        <AdminFieldLabel>Șablon LaTeX (folosește {"{{id}}"} pentru sloturi)</AdminFieldLabel>
        <AdminTextarea rows={3} value={latexTemplate} onChange={(e) => onChange({ ...value, instructions, latexTemplate: e.target.value, slots, chips })} />
      </div>
      <div className="space-y-2">
        <AdminFieldLabel>Sloturi (id + răspuns corect)</AdminFieldLabel>
        {slots.map((s, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-md border border-white/10 bg-black/30 p-3 sm:flex-row sm:items-center">
            <AdminTextInput
              className="sm:w-36"
              placeholder="id slot"
              value={s.id}
              onChange={(e) => {
                const c = [...slots]
                c[i] = { ...c[i], id: e.target.value.trim() }
                setSlots(c)
              }}
            />
            <AdminTextInput
              className="min-w-0 flex-1"
              placeholder="Răspuns corect"
              value={s.answer}
              onChange={(e) => {
                const c = [...slots]
                c[i] = { ...c[i], answer: e.target.value }
                setSlots(c)
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0 border-white/20 text-gray-200"
              onClick={() => insertPlaceholder(s.id || `slot${i}`)}
            >
              Inserează placeholder în șablon
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-300"
              onClick={() => setSlots(slots.filter((_, j) => j !== i))}
            >
              Șterge
            </Button>
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-white/20 bg-white/5 text-gray-200"
          onClick={() => setSlots([...slots, { id: nextInteractiveEditorId("s"), answer: "" }])}
        >
          Adaugă slot
        </Button>
      </div>
      <div className="space-y-2">
        <AdminFieldLabel>Chip-uri (valori de ales)</AdminFieldLabel>
        {chips.map((ch, i) => (
          <div key={i} className="flex gap-2">
            <AdminTextInput
              className="flex-1"
              value={ch}
              onChange={(e) => {
                const c = [...chips]
                c[i] = e.target.value
                setChips(c)
              }}
            />
            <Button type="button" variant="ghost" size="sm" className="text-red-300" onClick={() => setChips(chips.filter((_, j) => j !== i))}>
              ×
            </Button>
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" className="border-white/20 text-gray-200" onClick={() => setChips([...chips, ""])}>
          Adaugă chip
        </Button>
      </div>
    </div>
  )
}
