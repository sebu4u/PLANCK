"use client"

import { Button } from "@/components/ui/button"
import { nextInteractiveEditorId } from "@/lib/interactive-item-editor-helpers"
import { AdminFieldLabel, AdminTextarea, AdminTextInput } from "./shared-fields"

const NODE_KINDS = ["start", "process", "decision", "end"] as const

type NodeRow = { id: string; kind: (typeof NODE_KINDS)[number]; label: string }
type EdgeRow = { from: string; to: string }

export function FlowBuildEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const instructions = typeof value.instructions === "string" ? value.instructions : ""

  const nodes: NodeRow[] = Array.isArray(value.nodes)
    ? value.nodes.map((n) => {
        if (!n || typeof n !== "object") return { id: "", kind: "process", label: "" }
        const o = n as Record<string, unknown>
        const kind = NODE_KINDS.includes(o.kind as (typeof NODE_KINDS)[number])
          ? (o.kind as (typeof NODE_KINDS)[number])
          : "process"
        return { id: typeof o.id === "string" ? o.id : "", kind, label: typeof o.label === "string" ? o.label : "" }
      })
    : [
        { id: "s", kind: "start", label: "Start" },
        { id: "e", kind: "end", label: "End" },
      ]

  const edges: EdgeRow[] = Array.isArray(value.correctEdges)
    ? value.correctEdges.map((e) => {
        if (!e || typeof e !== "object") return { from: "", to: "" }
        const o = e as Record<string, unknown>
        return { from: typeof o.from === "string" ? o.from : "", to: typeof o.to === "string" ? o.to : "" }
      })
    : [{ from: "s", to: "e" }]

  const ids = nodes.map((n) => n.id).filter(Boolean)

  const commit = (n: NodeRow[], e: EdgeRow[]) => {
    onChange({
      ...value,
      instructions,
      nodes: n.map((x) => ({ id: x.id.trim(), kind: x.kind, label: x.label.trim() })),
      correctEdges: e.map((x) => ({ from: x.from.trim(), to: x.to.trim() })),
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <AdminFieldLabel>Instrucțiuni (opțional)</AdminFieldLabel>
        <AdminTextarea rows={2} value={instructions} onChange={(e) => onChange({ ...value, instructions: e.target.value, nodes, correctEdges: edges })} />
      </div>
      <div className="space-y-2">
        <AdminFieldLabel>Noduri (minim 2)</AdminFieldLabel>
        {nodes.map((node, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-md border border-white/10 bg-black/30 p-3 lg:flex-row lg:items-center">
            <AdminTextInput
              className="lg:w-28"
              placeholder="id"
              value={node.id}
              onChange={(e) => {
                const c = [...nodes]
                c[i] = { ...c[i], id: e.target.value }
                commit(c, edges)
              }}
            />
            <select
              className="h-9 rounded-md border border-white/20 bg-black/40 px-2 text-sm text-gray-100 lg:w-36"
              value={node.kind}
              onChange={(e) => {
                const c = [...nodes]
                c[i] = { ...c[i], kind: e.target.value as NodeRow["kind"] }
                commit(c, edges)
              }}
            >
              {NODE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <AdminTextInput
              className="min-w-0 flex-1"
              placeholder="etichetă"
              value={node.label}
              onChange={(e) => {
                const c = [...nodes]
                c[i] = { ...c[i], label: e.target.value }
                commit(c, edges)
              }}
            />
            <Button type="button" variant="ghost" size="sm" className="text-red-300" onClick={() => commit(nodes.filter((_, j) => j !== i), edges)}>
              Șterge
            </Button>
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-white/20 text-gray-200"
          onClick={() =>
            commit([...nodes, { id: nextInteractiveEditorId("n"), kind: "process", label: "" }], edges)
          }
        >
          Adaugă nod
        </Button>
      </div>
      <div className="space-y-2">
        <AdminFieldLabel>Muchii corecte (from → to)</AdminFieldLabel>
        {edges.map((ed, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <select
              className="h-9 min-w-[7rem] rounded-md border border-white/20 bg-black/40 px-2 text-sm text-gray-100"
              value={ed.from}
              onChange={(e) => {
                const c = [...edges]
                c[i] = { ...c[i], from: e.target.value }
                commit(nodes, c)
              }}
            >
              <option value="">—</option>
              {ids.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
            <span className="text-gray-500">→</span>
            <select
              className="h-9 min-w-[7rem] rounded-md border border-white/20 bg-black/40 px-2 text-sm text-gray-100"
              value={ed.to}
              onChange={(e) => {
                const c = [...edges]
                c[i] = { ...c[i], to: e.target.value }
                commit(nodes, c)
              }}
            >
              <option value="">—</option>
              {ids.map((id) => (
                <option key={`t-${id}`} value={id}>
                  {id}
                </option>
              ))}
            </select>
            <Button type="button" variant="ghost" size="sm" className="text-red-300" onClick={() => commit(nodes, edges.filter((_, j) => j !== i))}>
              ×
            </Button>
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" className="border-white/20 text-gray-200" onClick={() => commit(nodes, [...edges, { from: "", to: "" }])}>
          Adaugă muchie
        </Button>
      </div>
    </div>
  )
}
