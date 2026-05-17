"use client"

import { Button } from "@/components/ui/button"
import { AdminFieldLabel, AdminTextarea, AdminTextInput } from "./shared-fields"

type CellForm = { kind: "text"; text: string } | { kind: "blank"; answer: string } | { kind: "null" }

function cellToForm(c: unknown): CellForm {
  if (c === null) return { kind: "null" }
  if (!c || typeof c !== "object") return { kind: "text", text: "" }
  const o = c as Record<string, unknown>
  if (o.blank === true) return { kind: "blank", answer: typeof o.answer === "string" ? o.answer : "" }
  return { kind: "text", text: typeof o.text === "string" ? o.text : "" }
}

function formToCell(f: CellForm): { text?: string; blank?: boolean; answer?: string } | null {
  if (f.kind === "null") return null
  if (f.kind === "blank") return { blank: true, answer: f.answer.trim() }
  return { text: f.text }
}

export function TableFillEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const instructions = typeof value.instructions === "string" ? value.instructions : ""

  const headers: string[] = Array.isArray(value.headers)
    ? value.headers.map((h) => (typeof h === "string" ? h : String(h)))
    : [""]

  const rowForms: CellForm[][] = Array.isArray(value.rows)
    ? value.rows.map((row) => {
        if (!row || typeof row !== "object") return headers.map(() => ({ kind: "null" as const }))
        const cells = (row as Record<string, unknown>).cells
        if (!Array.isArray(cells)) return headers.map(() => ({ kind: "null" as const }))
        return headers.map((_, i) => cellToForm(cells[i]))
      })
    : [headers.map(() => ({ kind: "null" as const }))]

  const emit = (nextHeaders: string[], nextRows: CellForm[][]) => {
    onChange({
      ...value,
      instructions,
      headers: nextHeaders,
      rows: nextRows.map((cells) => ({
        cells: cells.map((f) => formToCell(f)),
      })),
    })
  }

  const setHeader = (i: number, t: string) => {
    const h = [...headers]
    h[i] = t
    const rows = rowForms.map((r) => {
      const nr = [...r]
      while (nr.length < h.length) nr.push({ kind: "null" })
      if (nr.length > h.length) nr.length = h.length
      return nr
    })
    emit(h, rows)
  }

  const addColumn = () => {
    const h = [...headers, `Col${headers.length + 1}`]
    const rows = rowForms.map((r) => [...r, { kind: "null" as const }])
    emit(h, rows)
  }

  const removeColumn = (ci: number) => {
    if (headers.length <= 1) return
    const h = headers.filter((_, j) => j !== ci)
    const rows = rowForms.map((r) => r.filter((_, j) => j !== ci))
    emit(h, rows)
  }

  const setCell = (ri: number, ci: number, f: CellForm) => {
    const rows = rowForms.map((r) => [...r])
    while (rows.length <= ri) rows.push(headers.map(() => ({ kind: "null" as const })))
    while (rows[ri].length < headers.length) rows[ri].push({ kind: "null" })
    rows[ri][ci] = f
    emit(headers, rows)
  }

  const addRow = () => {
    emit(headers, [...rowForms, headers.map(() => ({ kind: "null" as const }))])
  }

  const removeRow = (ri: number) => {
    emit(headers, rowForms.filter((_, j) => j !== ri))
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <AdminFieldLabel>Instrucțiuni (opțional)</AdminFieldLabel>
        <AdminTextarea rows={2} value={instructions} onChange={(e) => onChange({ ...value, instructions: e.target.value, headers, rows: value.rows })} />
      </div>
      <p className="text-[11px] text-gray-500">Fiecare rând are exact câte celule câte antete. Tip: text fix, blank (răspuns), sau celulă goală.</p>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              {headers.map((h, ci) => (
                <th key={ci} className="border border-white/15 p-1 align-top">
                  <AdminTextInput value={h} onChange={(e) => setHeader(ci, e.target.value)} />
                  <Button type="button" variant="ghost" size="sm" className="mt-1 text-[11px] text-red-300" onClick={() => removeColumn(ci)}>
                    Șterge coloana
                  </Button>
                </th>
              ))}
              <th className="w-10 border border-white/15 p-1" />
            </tr>
          </thead>
          <tbody>
            {rowForms.map((row, ri) => (
              <tr key={ri}>
                {headers.map((_, ci) => {
                  const cell = row[ci] ?? { kind: "null" as const }
                  return (
                    <td key={ci} className="border border-white/15 p-1 align-top">
                      <select
                        className="mb-1 h-8 w-full rounded border border-white/20 bg-black/40 px-1 text-xs text-gray-100"
                        value={cell.kind}
                        onChange={(e) => {
                          const k = e.target.value
                          if (k === "text") setCell(ri, ci, { kind: "text", text: "" })
                          else if (k === "blank") setCell(ri, ci, { kind: "blank", answer: "" })
                          else setCell(ri, ci, { kind: "null" })
                        }}
                      >
                        <option value="null">Gol</option>
                        <option value="text">Text</option>
                        <option value="blank">Blank</option>
                      </select>
                      {cell.kind === "text" ? (
                        <AdminTextarea rows={2} value={cell.text} onChange={(e) => setCell(ri, ci, { kind: "text", text: e.target.value })} />
                      ) : null}
                      {cell.kind === "blank" ? (
                        <AdminTextInput placeholder="Răspuns corect" value={cell.answer} onChange={(e) => setCell(ri, ci, { kind: "blank", answer: e.target.value })} />
                      ) : null}
                    </td>
                  )
                })}
                <td className="border border-white/15 p-1 align-middle">
                  <Button type="button" variant="ghost" size="sm" className="text-red-300" onClick={() => removeRow(ri)}>
                    ×
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" className="border-white/20 text-gray-200" onClick={addColumn}>
          + coloană
        </Button>
        <Button type="button" size="sm" variant="outline" className="border-white/20 text-gray-200" onClick={addRow}>
          + rând
        </Button>
      </div>
    </div>
  )
}
