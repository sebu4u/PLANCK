"use client"

import { Button } from "@/components/ui/button"
import { nextInteractiveEditorId } from "@/lib/interactive-item-editor-helpers"
import { AdminFieldLabel, AdminTextarea, AdminTextInput } from "./shared-fields"

type Card = { id: string; text: string }

export function CardSortEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const instructions = typeof value.instructions === "string" ? value.instructions : ""
  const cards: Card[] = Array.isArray(value.cards)
    ? value.cards.map((c) => {
        if (!c || typeof c !== "object") return { id: "", text: "" }
        const o = c as Record<string, unknown>
        return { id: typeof o.id === "string" ? o.id : "", text: typeof o.text === "string" ? o.text : "" }
      })
    : []

  const correctOrder: string[] = Array.isArray(value.correctOrder)
    ? value.correctOrder.map((x) => (typeof x === "string" ? x : ""))
    : []

  const idSet = new Set(cards.map((c) => c.id).filter(Boolean))

  const setCards = (next: Card[]) => {
    const ids = next.map((c) => c.id).filter(Boolean)
    const co = correctOrder.filter((id) => ids.includes(id))
    for (const id of ids) if (!co.includes(id)) co.push(id)
    onChange({ ...value, instructions, cards: next, correctOrder: co })
  }

  const setCorrectOrder = (co: string[]) => {
    onChange({ ...value, instructions, cards, correctOrder: co })
  }

  const moveCard = (from: number, dir: -1 | 1) => {
    const to = from + dir
    if (to < 0 || to >= cards.length) return
    const copy = [...cards]
    ;[copy[from], copy[to]] = [copy[to], copy[from]]
    setCards(copy)
  }

  const moveOrder = (from: number, dir: -1 | 1) => {
    const to = from + dir
    if (to < 0 || to >= correctOrder.length) return
    const copy = [...correctOrder]
    ;[copy[from], copy[to]] = [copy[to], copy[from]]
    setCorrectOrder(copy)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <AdminFieldLabel>Instrucțiuni (opțional)</AdminFieldLabel>
        <AdminTextarea
          rows={2}
          value={instructions}
          onChange={(e) => onChange({ ...value, instructions: e.target.value, cards, correctOrder })}
        />
      </div>
      <div className="space-y-2">
        <AdminFieldLabel>Carduri (id unic + text)</AdminFieldLabel>
        {cards.map((c, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-md border border-white/10 bg-black/30 p-3 lg:flex-row">
            <AdminTextInput
              className="lg:w-32"
              placeholder="id"
              value={c.id}
              onChange={(e) => {
                const oldId = c.id
                const newId = e.target.value.trim()
                const copy = [...cards]
                copy[i] = { ...copy[i], id: newId }
                const co = correctOrder.map((x) => (x === oldId ? newId : x))
                onChange({ ...value, instructions, cards: copy, correctOrder: co })
              }}
            />
            <AdminTextarea
              className="min-w-0 flex-1"
              rows={2}
              placeholder="Text card"
              value={c.text}
              onChange={(e) => {
                const copy = [...cards]
                copy[i] = { ...copy[i], text: e.target.value }
                setCards(copy)
              }}
            />
            <div className="flex shrink-0 gap-1">
              <Button type="button" size="sm" variant="ghost" className="text-gray-300" onClick={() => moveCard(i, -1)}>
                ↑
              </Button>
              <Button type="button" size="sm" variant="ghost" className="text-gray-300" onClick={() => moveCard(i, 1)}>
                ↓
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-red-300"
                onClick={() => {
                  const copy = cards.filter((_, j) => j !== i)
                  const co = correctOrder.filter((id) => id !== c.id)
                  onChange({ ...value, instructions, cards: copy, correctOrder: co })
                }}
              >
                Șterge
              </Button>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/20 bg-white/5 text-gray-200"
            onClick={() => {
              const id = nextInteractiveEditorId("c")
              setCards([...cards, { id, text: "" }])
            }}
          >
            Adaugă card
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/20 bg-white/5 text-gray-200"
            onClick={() => setCorrectOrder(cards.map((c) => c.id).filter(Boolean))}
          >
            Ordinea corectă = ordinea listei
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <AdminFieldLabel>Ordinea corectă (permutare de id-uri)</AdminFieldLabel>
        {correctOrder.map((id, i) => (
          <div key={`${id}-${i}`} className="flex items-center gap-2 rounded-md border border-white/10 bg-black/20 px-2 py-1">
            <span className="min-w-0 flex-1 truncate font-mono text-sm text-gray-200">{id || "(gol)"}</span>
            {!idSet.has(id) ? <span className="text-xs text-amber-400">id lipsă din carduri</span> : null}
            <Button type="button" size="sm" variant="ghost" className="text-gray-300" onClick={() => moveOrder(i, -1)}>
              ↑
            </Button>
            <Button type="button" size="sm" variant="ghost" className="text-gray-300" onClick={() => moveOrder(i, 1)}>
              ↓
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-red-300"
              onClick={() => setCorrectOrder(correctOrder.filter((_, j) => j !== i))}
            >
              ×
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
