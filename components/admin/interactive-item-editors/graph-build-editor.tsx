"use client"

import { Button } from "@/components/ui/button"
import { nextInteractiveEditorId } from "@/lib/interactive-item-editor-helpers"
import { AdminFieldLabel, AdminTextarea, AdminTextInput } from "./shared-fields"

type CurveOpt = { id: string; label: string; svgPath: string }
type Pt = { x: string; y: string }

function str(v: unknown): string {
  return typeof v === "string" ? v : ""
}

export function GraphBuildEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const mode = str(value.mode) === "plot_points" ? "plot_points" : "pick_curve"
  const prompt = str(value.prompt)

  if (mode === "pick_curve") {
    const options: CurveOpt[] = Array.isArray(value.options)
      ? value.options.map((o) => {
          if (!o || typeof o !== "object") return { id: "", label: "", svgPath: "" }
          const r = o as Record<string, unknown>
          return { id: str(r.id), label: str(r.label), svgPath: str(r.svgPath) }
        })
      : [
          { id: "a", label: "A", svgPath: "M 5 30 L 95 30" },
          { id: "b", label: "B", svgPath: "M 5 35 L 95 5" },
        ]
    const correctOptionId = str(value.correctOptionId) || options[0]?.id || ""

    const emitPick = (next: { prompt?: string; options?: CurveOpt[]; correctOptionId?: string }) => {
      const opts = (next.options ?? options).map((o) => ({
        id: o.id.trim(),
        label: o.label.trim() || undefined,
        svgPath: o.svgPath.trim(),
      }))
      let cor = (next.correctOptionId ?? correctOptionId).trim()
      if (!opts.some((o) => o.id === cor)) cor = opts[0]?.id ?? ""
      onChange({
        mode: "pick_curve",
        prompt: (next.prompt ?? prompt).trim(),
        options: opts,
        correctOptionId: cor,
      })
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="default">
            Alegere curbă
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/20 text-gray-200"
            onClick={() =>
              onChange({
                mode: "plot_points",
                prompt: prompt.trim() || "Plasează punctele.",
                tolerance: 1,
                correctPoints: [{ x: 1, y: 1 }],
              })
            }
          >
            Plasare puncte
          </Button>
        </div>
        <div className="space-y-1">
          <AdminFieldLabel>Prompt</AdminFieldLabel>
          <AdminTextarea rows={2} value={prompt} onChange={(e) => emitPick({ prompt: e.target.value })} />
        </div>
        <div className="space-y-1">
          <AdminFieldLabel>Răspuns corect (id opțiune)</AdminFieldLabel>
          <select
            className="h-9 w-full max-w-xs rounded-md border border-white/20 bg-black/40 px-2 text-sm text-gray-100"
            value={correctOptionId}
            onChange={(e) => emitPick({ correctOptionId: e.target.value })}
          >
            {options.map((o) => (
              <option key={o.id || `opt-${o.svgPath.slice(0, 8)}`} value={o.id}>
                {o.id || "(fără id)"}
              </option>
            ))}
          </select>
        </div>
        {options.map((o, i) => (
          <div key={i} className="space-y-2 rounded-md border border-white/10 bg-black/30 p-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <AdminTextInput
                className="sm:w-36"
                placeholder="id"
                value={o.id}
                onChange={(e) => {
                  const c = [...options]
                  c[i] = { ...c[i], id: e.target.value }
                  emitPick({ options: c })
                }}
              />
              <AdminTextInput
                className="min-w-0 flex-1"
                placeholder="etichetă (opțional)"
                value={o.label}
                onChange={(e) => {
                  const c = [...options]
                  c[i] = { ...c[i], label: e.target.value }
                  emitPick({ options: c })
                }}
              />
            </div>
            <div className="space-y-1">
              <AdminFieldLabel>SVG path</AdminFieldLabel>
              <AdminTextarea
                rows={2}
                value={o.svgPath}
                onChange={(e) => {
                  const c = [...options]
                  c[i] = { ...c[i], svgPath: e.target.value }
                  emitPick({ options: c })
                }}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-300"
              onClick={() => emitPick({ options: options.filter((_, j) => j !== i) })}
            >
              Șterge opțiune
            </Button>
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-white/20 text-gray-200"
          onClick={() =>
            emitPick({
              options: [...options, { id: nextInteractiveEditorId("g"), label: "", svgPath: "M 0 20 L 100 20" }],
            })
          }
        >
          Adaugă opțiune
        </Button>
      </div>
    )
  }

  const toleranceStr = value.tolerance != null ? String(value.tolerance) : "1"
  const g = value.grid && typeof value.grid === "object" && !Array.isArray(value.grid) ? (value.grid as Record<string, unknown>) : {}

  const correctPoints: Pt[] = Array.isArray(value.correctPoints)
    ? value.correctPoints.map((p) => {
        if (!p || typeof p !== "object") return { x: "0", y: "0" }
        const r = p as Record<string, unknown>
        return { x: r.x != null ? String(r.x) : "0", y: r.y != null ? String(r.y) : "0" }
      })
    : [{ x: "1", y: "1" }]

  const buildGrid = (): { xMin: number; xMax: number; yMin: number; yMax: number } | undefined => {
    const xMin = Number.parseFloat(g.xMin != null ? String(g.xMin) : "")
    const xMax = Number.parseFloat(g.xMax != null ? String(g.xMax) : "")
    const yMin = Number.parseFloat(g.yMin != null ? String(g.yMin) : "")
    const yMax = Number.parseFloat(g.yMax != null ? String(g.yMax) : "")
    if (![xMin, xMax, yMin, yMax].every(Number.isFinite) || xMax <= xMin || yMax <= yMin) return undefined
    return { xMin, xMax, yMin, yMax }
  }

  const emitPlot = (partial: {
    prompt?: string
    tolerance?: number
    correctPoints?: Pt[]
    grid?: Record<string, unknown>
  }) => {
    const tol = partial.tolerance ?? (Number.parseFloat(toleranceStr) || 0.1)
    const ptsSrc = partial.correctPoints ?? correctPoints
    const pts = ptsSrc.map((p) => ({ x: Number.parseFloat(p.x) || 0, y: Number.parseFloat(p.y) || 0 }))
    const gridObj = partial.grid ?? g
    const xMin = Number.parseFloat(gridObj.xMin != null ? String(gridObj.xMin) : "")
    const xMax = Number.parseFloat(gridObj.xMax != null ? String(gridObj.xMax) : "")
    const yMin = Number.parseFloat(gridObj.yMin != null ? String(gridObj.yMin) : "")
    const yMax = Number.parseFloat(gridObj.yMax != null ? String(gridObj.yMax) : "")
    const grid =
      [xMin, xMax, yMin, yMax].every(Number.isFinite) && xMax > xMin && yMax > yMin
        ? { xMin, xMax, yMin, yMax }
        : undefined
    onChange({
      mode: "plot_points",
      prompt: (partial.prompt ?? prompt).trim() || "Plasează punctele.",
      tolerance: tol > 0 ? tol : 0.1,
      correctPoints: pts,
      ...(grid ? { grid } : {}),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-white/20 text-gray-200"
          onClick={() =>
            onChange({
              mode: "pick_curve",
              prompt: prompt.trim() || "Alege curba.",
              options: [
                { id: "a", label: "A", svgPath: "M 5 30 L 95 30" },
                { id: "b", label: "B", svgPath: "M 5 35 L 95 5" },
              ],
              correctOptionId: "a",
            })
          }
        >
          Alegere curbă
        </Button>
        <Button type="button" size="sm" variant="default">
          Plasare puncte
        </Button>
      </div>
      <div className="space-y-1">
        <AdminFieldLabel>Prompt</AdminFieldLabel>
        <AdminTextarea rows={2} value={prompt} onChange={(e) => emitPlot({ prompt: e.target.value })} />
      </div>
      <p className="text-[11px] text-gray-500">Grid opțional: toate cele 4 valori, cu xMin &lt; xMax și yMin &lt; yMax.</p>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {(["xMin", "xMax", "yMin", "yMax"] as const).map((k) => (
          <div key={k} className="space-y-1">
            <AdminFieldLabel>{k}</AdminFieldLabel>
            <AdminTextInput
              value={g[k] != null ? String(g[k]) : ""}
              onChange={(e) => {
                const next = { ...g, [k]: e.target.value }
                emitPlot({ grid: next })
              }}
            />
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <AdminFieldLabel>Toleranță</AdminFieldLabel>
        <AdminTextInput
          value={toleranceStr}
          onChange={(e) => emitPlot({ tolerance: Number.parseFloat(e.target.value) || 0.1 })}
        />
      </div>
      <div className="space-y-2">
        <AdminFieldLabel>Puncte corecte (x, y)</AdminFieldLabel>
        {correctPoints.map((p, i) => (
          <div key={i} className="flex gap-2">
            <AdminTextInput
              placeholder="x"
              value={p.x}
              onChange={(e) => {
                const c = [...correctPoints]
                c[i] = { ...c[i], x: e.target.value }
                emitPlot({ correctPoints: c })
              }}
            />
            <AdminTextInput
              placeholder="y"
              value={p.y}
              onChange={(e) => {
                const c = [...correctPoints]
                c[i] = { ...c[i], y: e.target.value }
                emitPlot({ correctPoints: c })
              }}
            />
            <Button
              type="button"
              variant="ghost"
              className="text-red-300"
              onClick={() => emitPlot({ correctPoints: correctPoints.filter((_, j) => j !== i) })}
            >
              ×
            </Button>
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-white/20 text-gray-200"
          onClick={() => emitPlot({ correctPoints: [...correctPoints, { x: "0", y: "0" }] })}
        >
          + punct
        </Button>
      </div>
    </div>
  )
}
