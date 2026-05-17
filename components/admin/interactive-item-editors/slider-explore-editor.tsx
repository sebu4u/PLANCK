"use client"

import { Button } from "@/components/ui/button"
import { nextInteractiveEditorId } from "@/lib/interactive-item-editor-helpers"
import { AdminFieldLabel, AdminTextarea, AdminTextInput } from "./shared-fields"

type SliderRow = {
  id: string
  label: string
  min: string
  max: string
  step: string
  default: string
}

function num(s: string, fallback: number) {
  const n = Number.parseFloat(s)
  return Number.isFinite(n) ? n : fallback
}

export function SliderExploreEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const instructions = typeof value.instructions === "string" ? value.instructions : ""
  const formula = typeof value.formula === "string" ? value.formula : ""
  const targetMin = value.targetMin != null ? String(value.targetMin) : ""
  const targetMax = value.targetMax != null ? String(value.targetMax) : ""

  const sliders: SliderRow[] = Array.isArray(value.sliders)
    ? value.sliders.map((s) => {
        if (!s || typeof s !== "object") {
          return { id: "", label: "", min: "0", max: "10", step: "1", default: "0" }
        }
        const o = s as Record<string, unknown>
        return {
          id: typeof o.id === "string" ? o.id : "",
          label: typeof o.label === "string" ? o.label : "",
          min: o.min != null ? String(o.min) : "0",
          max: o.max != null ? String(o.max) : "10",
          step: o.step != null ? String(o.step) : "1",
          default: o.default != null ? String(o.default) : "0",
        }
      })
    : [{ id: "x", label: "x", min: "0", max: "10", step: "1", default: "1" }]

  const setSliders = (rows: SliderRow[]) => {
    onChange({
      ...value,
      sliders: rows.map((r) => ({
        id: r.id.trim(),
        label: r.label.trim(),
        min: num(r.min, 0),
        max: num(r.max, 1),
        step: num(r.step, 0.1),
        default: num(r.default, 0),
      })),
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <AdminFieldLabel>Instrucțiuni (opțional)</AdminFieldLabel>
        <AdminTextarea
          rows={2}
          value={instructions}
          onChange={(e) => onChange({ ...value, instructions: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <AdminFieldLabel>Formula (mathjs, variabile = id slider)</AdminFieldLabel>
        <AdminTextInput value={formula} onChange={(e) => onChange({ ...value, formula: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <AdminFieldLabel>Țintă min</AdminFieldLabel>
          <AdminTextInput
            value={targetMin}
            onChange={(e) => onChange({ ...value, targetMin: num(e.target.value, 0) })}
          />
        </div>
        <div className="space-y-1">
          <AdminFieldLabel>Țintă max</AdminFieldLabel>
          <AdminTextInput
            value={targetMax}
            onChange={(e) => onChange({ ...value, targetMax: num(e.target.value, 1) })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <AdminFieldLabel>Glisoare</AdminFieldLabel>
        {sliders.map((s, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 rounded-md border border-white/10 bg-black/30 p-3 lg:grid-cols-6">
            <AdminTextInput
              placeholder="id"
              value={s.id}
              onChange={(e) => {
                const c = [...sliders]
                c[i] = { ...c[i], id: e.target.value }
                setSliders(c)
              }}
            />
            <AdminTextInput
              placeholder="etichetă"
              value={s.label}
              onChange={(e) => {
                const c = [...sliders]
                c[i] = { ...c[i], label: e.target.value }
                setSliders(c)
              }}
            />
            <AdminTextInput
              placeholder="min"
              value={s.min}
              onChange={(e) => {
                const c = [...sliders]
                c[i] = { ...c[i], min: e.target.value }
                setSliders(c)
              }}
            />
            <AdminTextInput
              placeholder="max"
              value={s.max}
              onChange={(e) => {
                const c = [...sliders]
                c[i] = { ...c[i], max: e.target.value }
                setSliders(c)
              }}
            />
            <AdminTextInput
              placeholder="step"
              value={s.step}
              onChange={(e) => {
                const c = [...sliders]
                c[i] = { ...c[i], step: e.target.value }
                setSliders(c)
              }}
            />
            <div className="flex items-center gap-2 lg:col-span-1">
              <AdminTextInput
                placeholder="default"
                value={s.default}
                onChange={(e) => {
                  const c = [...sliders]
                  c[i] = { ...c[i], default: e.target.value }
                  setSliders(c)
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 text-red-300"
                onClick={() => setSliders(sliders.filter((_, j) => j !== i))}
              >
                ×
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
            setSliders([
              ...sliders,
              { id: nextInteractiveEditorId("sl"), label: "Nou", min: "0", max: "10", step: "1", default: "0" },
            ])
          }
        >
          Adaugă slider
        </Button>
      </div>
    </div>
  )
}
