"use client"

import { Button } from "@/components/ui/button"
import { AdminFieldLabel, AdminTextarea, AdminTextInput } from "./shared-fields"

type StepForm =
  | { kind: "markdown"; content: string }
  | { kind: "quiz"; content: string; optionsText: string; correctIndex: string }

export function RevealStepsEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const instructions = typeof value.instructions === "string" ? value.instructions : ""

  const steps: StepForm[] = Array.isArray(value.steps)
    ? value.steps.map((b) => {
        if (!b || typeof b !== "object") return { kind: "markdown" as const, content: "" }
        const o = b as Record<string, unknown>
        if (o.kind === "quiz") {
          const opts = Array.isArray(o.options) ? o.options.map((x) => (typeof x === "string" ? x : String(x))) : []
          return {
            kind: "quiz" as const,
            content: typeof o.content === "string" ? o.content : "",
            optionsText: opts.join("\n"),
            correctIndex: o.correctIndex != null ? String(o.correctIndex) : "0",
          }
        }
        return { kind: "markdown" as const, content: typeof o.content === "string" ? o.content : "" }
      })
    : [{ kind: "markdown", content: "" }]

  const commit = (next: StepForm[]) => {
    const out = next.map((s) => {
      if (s.kind === "markdown") return { kind: "markdown" as const, content: s.content.trim() }
      const options = s.optionsText
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean)
      const correctIndex = Number.parseInt(s.correctIndex, 10)
      return {
        kind: "quiz" as const,
        content: s.content.trim() || undefined,
        options,
        correctIndex: Number.isFinite(correctIndex) ? correctIndex : 0,
      }
    })
    onChange({ ...value, instructions, steps: out })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <AdminFieldLabel>Instrucțiuni (opțional)</AdminFieldLabel>
        <AdminTextarea rows={2} value={instructions} onChange={(e) => onChange({ ...value, instructions: e.target.value, steps: value.steps })} />
      </div>
      <div className="space-y-3">
        <AdminFieldLabel>Pași demonstrație</AdminFieldLabel>
        {steps.map((s, i) => (
          <div key={i} className="space-y-2 rounded-md border border-white/10 bg-black/30 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <AdminFieldLabel>Tip pas</AdminFieldLabel>
              <select
                className="h-9 rounded-md border border-white/20 bg-black/40 px-2 text-sm text-gray-100"
                value={s.kind}
                onChange={(e) => {
                  const c = [...steps]
                  if (e.target.value === "quiz") {
                    c[i] = { kind: "quiz", content: "", optionsText: "A\nB", correctIndex: "0" }
                  } else {
                    c[i] = { kind: "markdown", content: "" }
                  }
                  commit(c)
                }}
              >
                <option value="markdown">Markdown</option>
                <option value="quiz">Quiz</option>
              </select>
              <Button type="button" variant="ghost" size="sm" className="text-red-300" onClick={() => commit(steps.filter((_, j) => j !== i))}>
                Șterge pasul
              </Button>
            </div>
            {s.kind === "markdown" ? (
              <AdminTextarea rows={4} value={s.content} onChange={(e) => {
                const c = [...steps]
                c[i] = { kind: "markdown", content: e.target.value }
                commit(c)
              }} />
            ) : (
              <>
                <AdminTextarea rows={2} placeholder="Întrebare (opțional)" value={s.content} onChange={(e) => {
                  const c = [...steps]
                  const cur = c[i]
                  if (cur.kind === "quiz") c[i] = { ...cur, content: e.target.value }
                  commit(c)
                }} />
                <AdminFieldLabel>Opțiuni (una pe linie)</AdminFieldLabel>
                <AdminTextarea rows={3} value={s.optionsText} onChange={(e) => {
                  const c = [...steps]
                  const cur = c[i]
                  if (cur.kind === "quiz") c[i] = { ...cur, optionsText: e.target.value }
                  commit(c)
                }} />
                <div className="space-y-1">
                  <AdminFieldLabel>Index răspuns corect (0-based)</AdminFieldLabel>
                  <AdminTextInput type="number" min={0} value={s.correctIndex} onChange={(e) => {
                    const c = [...steps]
                    const cur = c[i]
                    if (cur.kind === "quiz") c[i] = { ...cur, correctIndex: e.target.value }
                    commit(c)
                  }} />
                </div>
              </>
            )}
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" className="border-white/20 text-gray-200" onClick={() => commit([...steps, { kind: "markdown", content: "" }])}>
          Adaugă pas markdown
        </Button>
        <Button type="button" size="sm" variant="outline" className="ml-2 border-white/20 text-gray-200" onClick={() => commit([...steps, { kind: "quiz", content: "", optionsText: "A\nB", correctIndex: "0" }])}>
          Adaugă pas quiz
        </Button>
      </div>
    </div>
  )
}
