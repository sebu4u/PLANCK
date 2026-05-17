"use client"

import { Button } from "@/components/ui/button"
import { nextInteractiveEditorId } from "@/lib/interactive-item-editor-helpers"
import { AdminFieldLabel, AdminTextarea, AdminTextInput } from "./shared-fields"

type MatchRow = { leftId: string; leftText: string; rightId: string; rightText: string }

export function MatchEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const instructions = typeof value.instructions === "string" ? value.instructions : ""

  const leftRaw = Array.isArray(value.left) ? value.left : []
  const rightRaw = Array.isArray(value.right) ? value.right : []
  const n = Math.max(leftRaw.length, rightRaw.length, 1)

  const rows: MatchRow[] = []
  for (let i = 0; i < n; i += 1) {
    const L = leftRaw[i] && typeof leftRaw[i] === "object" ? (leftRaw[i] as Record<string, unknown>) : {}
    const R = rightRaw[i] && typeof rightRaw[i] === "object" ? (rightRaw[i] as Record<string, unknown>) : {}
    rows.push({
      leftId: typeof L.id === "string" ? L.id : "",
      leftText: typeof L.text === "string" ? L.text : "",
      rightId: typeof R.id === "string" ? R.id : "",
      rightText: typeof R.text === "string" ? R.text : "",
    })
  }

  const commitRows = (next: MatchRow[]) => {
    const left = next.map((r) => ({ id: r.leftId.trim(), text: r.leftText }))
    const right = next.map((r) => ({ id: r.rightId.trim(), text: r.rightText }))
    const pairs = next.map((r) => ({ leftId: r.leftId.trim(), rightId: r.rightId.trim() }))
    onChange({ ...value, instructions, left, right, pairs })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <AdminFieldLabel>Instrucțiuni (opțional)</AdminFieldLabel>
        <AdminTextarea
          rows={2}
          value={instructions}
          onChange={(e) => onChange({ ...value, instructions: e.target.value, left: rows.map((r) => ({ id: r.leftId, text: r.leftText })), right: rows.map((r) => ({ id: r.rightId, text: r.rightText })), pairs: rows.map((r) => ({ leftId: r.leftId, rightId: r.rightId })) })}
        />
      </div>
      <p className="text-[11px] text-gray-500">Fiecare rând = o pereche (stânga ↔ dreapta). Id-urile trebuie să fie unice în coloană.</p>
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-1 gap-3 rounded-md border border-white/10 bg-black/30 p-3 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase text-gray-500">Stânga</p>
            <AdminTextInput
              placeholder="id stânga"
              value={row.leftId}
              onChange={(e) => {
                const c = [...rows]
                c[i] = { ...c[i], leftId: e.target.value }
                commitRows(c)
              }}
            />
            <AdminTextarea
              rows={2}
              placeholder="Text"
              value={row.leftText}
              onChange={(e) => {
                const c = [...rows]
                c[i] = { ...c[i], leftText: e.target.value }
                commitRows(c)
              }}
            />
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase text-gray-500">Dreapta</p>
            <AdminTextInput
              placeholder="id dreapta"
              value={row.rightId}
              onChange={(e) => {
                const c = [...rows]
                c[i] = { ...c[i], rightId: e.target.value }
                commitRows(c)
              }}
            />
            <AdminTextarea
              rows={2}
              placeholder="Text"
              value={row.rightText}
              onChange={(e) => {
                const c = [...rows]
                c[i] = { ...c[i], rightText: e.target.value }
                commitRows(c)
              }}
            />
          </div>
          <div className="lg:col-span-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-300"
              onClick={() => commitRows(rows.filter((_, j) => j !== i))}
            >
              Șterge rândul
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="border-white/20 bg-white/5 text-gray-200"
        onClick={() =>
          commitRows([
            ...rows,
            {
              leftId: nextInteractiveEditorId("l"),
              leftText: "",
              rightId: nextInteractiveEditorId("r"),
              rightText: "",
            },
          ])
        }
      >
        Adaugă rând
      </Button>
    </div>
  )
}
