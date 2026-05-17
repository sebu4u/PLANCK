"use client"

import { Button } from "@/components/ui/button"
import { AdminFieldLabel, AdminTextarea, AdminTextInput } from "./shared-fields"

type Card = { text: string; side: "left" | "right" }

export function SwipeClassifyEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const prompt = typeof value.prompt === "string" ? value.prompt : ""
  const leftLabel = typeof value.leftLabel === "string" ? value.leftLabel : ""
  const rightLabel = typeof value.rightLabel === "string" ? value.rightLabel : ""
  const cards: Card[] = Array.isArray(value.cards)
    ? value.cards.map((c) => {
        if (!c || typeof c !== "object") return { text: "", side: "left" as const }
        const o = c as Record<string, unknown>
        const side = o.side === "right" ? "right" : "left"
        return { text: typeof o.text === "string" ? o.text : "", side }
      })
    : [{ text: "", side: "left" }]

  const setCards = (next: Card[]) => onChange({ ...value, cards: next })

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <AdminFieldLabel>Întrebare / intro (opțional)</AdminFieldLabel>
        <AdminTextarea rows={2} value={prompt} onChange={(e) => onChange({ ...value, prompt: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <AdminFieldLabel>Etichetă stânga</AdminFieldLabel>
          <AdminTextInput value={leftLabel} onChange={(e) => onChange({ ...value, leftLabel: e.target.value })} />
        </div>
        <div className="space-y-1">
          <AdminFieldLabel>Etichetă dreapta</AdminFieldLabel>
          <AdminTextInput value={rightLabel} onChange={(e) => onChange({ ...value, rightLabel: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <AdminFieldLabel>Carduri (text + parte corectă)</AdminFieldLabel>
        {cards.map((c, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-md border border-white/10 bg-black/30 p-3 sm:flex-row sm:items-start">
            <AdminTextarea
              rows={2}
              className="min-w-0 flex-1"
              value={c.text}
              onChange={(e) => {
                const copy = [...cards]
                copy[i] = { ...copy[i], text: e.target.value }
                setCards(copy)
              }}
              placeholder="Text afirmație"
            />
            <select
              className="h-10 shrink-0 rounded-md border border-white/20 bg-black/40 px-2 text-sm text-gray-100"
              value={c.side}
              onChange={(e) => {
                const copy = [...cards]
                copy[i] = { ...copy[i], side: e.target.value === "right" ? "right" : "left" }
                setCards(copy)
              }}
            >
              <option value="left">{leftLabel || "Stânga"}</option>
              <option value="right">{rightLabel || "Dreapta"}</option>
            </select>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-300 hover:bg-red-500/10"
              onClick={() => setCards(cards.filter((_, j) => j !== i))}
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
          onClick={() => setCards([...cards, { text: "", side: "left" }])}
        >
          Adaugă card
        </Button>
      </div>
    </div>
  )
}
