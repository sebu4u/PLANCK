"use client"

import { Button } from "@/components/ui/button"
import { AdminFieldLabel, AdminTextarea } from "./shared-fields"

type Pair = { a: string; b: string }

export function MemoryFlipEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const instructions = typeof value.instructions === "string" ? value.instructions : ""
  const pairs: Pair[] = Array.isArray(value.pairs)
    ? value.pairs.map((p) => {
        if (!p || typeof p !== "object") return { a: "", b: "" }
        const o = p as Record<string, unknown>
        return { a: typeof o.a === "string" ? o.a : "", b: typeof o.b === "string" ? o.b : "" }
      })
    : [{ a: "", b: "" }]

  const setPairs = (next: Pair[]) => {
    onChange({ ...value, pairs: next })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <AdminFieldLabel>Instrucțiuni (opțional)</AdminFieldLabel>
        <AdminTextarea
          rows={3}
          value={instructions}
          onChange={(e) => onChange({ ...value, instructions: e.target.value })}
          placeholder="Text introductiv..."
        />
      </div>
      <div className="space-y-2">
        <AdminFieldLabel>Perechi (față A / față B)</AdminFieldLabel>
        {pairs.map((p, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-md border border-white/10 bg-black/30 p-3 sm:flex-row">
            <AdminTextarea
              rows={2}
              className="flex-1"
              value={p.a}
              onChange={(e) => {
                const copy = [...pairs]
                copy[i] = { ...copy[i], a: e.target.value }
                setPairs(copy)
              }}
              placeholder="Fața A (markdown/LaTeX)"
            />
            <AdminTextarea
              rows={2}
              className="flex-1"
              value={p.b}
              onChange={(e) => {
                const copy = [...pairs]
                copy[i] = { ...copy[i], b: e.target.value }
                setPairs(copy)
              }}
              placeholder="Fața B"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 text-red-300 hover:bg-red-500/10 hover:text-red-200"
              onClick={() => setPairs(pairs.filter((_, j) => j !== i))}
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
          onClick={() => setPairs([...pairs, { a: "", b: "" }])}
        >
          Adaugă pereche
        </Button>
      </div>
    </div>
  )
}
