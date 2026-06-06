"use client"

import { Button } from "@/components/ui/button"
import { AdminFieldLabel, AdminTextarea, AdminTextInput } from "./shared-fields"

type Step = {
  lineIndex: string
  prompt: string
  inputMode: "choice" | "text"
  optionsText: string
  answer: string
}

export function CodeTraceEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const language = typeof value.language === "string" ? value.language : "python"
  const imageUrl =
    typeof value.imageUrl === "string"
      ? value.imageUrl
      : typeof value.image_url === "string"
        ? value.image_url
        : ""
  const linesArr = Array.isArray(value.lines) ? value.lines.map((l) => (typeof l === "string" ? l : String(l))) : [""]
  const linesText = linesArr.join("\n")

  const steps: Step[] = Array.isArray(value.steps)
    ? value.steps.map((s) => {
        if (!s || typeof s !== "object") {
          return { lineIndex: "0", prompt: "", inputMode: "choice" as const, optionsText: "", answer: "" }
        }
        const o = s as Record<string, unknown>
        const opts = Array.isArray(o.options) ? o.options.map((x) => (typeof x === "string" ? x : String(x))) : []
        return {
          lineIndex: o.lineIndex != null ? String(o.lineIndex) : "0",
          prompt: typeof o.prompt === "string" ? o.prompt : "",
          inputMode: o.inputMode === "text" ? "text" : "choice",
          optionsText: opts.join("\n"),
          answer: typeof o.answer === "string" ? o.answer : "",
        }
      })
    : [{ lineIndex: "0", prompt: "", inputMode: "choice", optionsText: "A\nB", answer: "A" }]

  const commit = (lines: string[], st: Step[]) => {
    onChange({
      ...value,
      language,
      lines,
      steps: st.map((x) => {
        const lineIndex = Number.parseInt(x.lineIndex, 10)
        const options =
          x.inputMode === "choice"
            ? x.optionsText
                .split("\n")
                .map((o) => o.trim())
                .filter(Boolean)
            : undefined
        return {
          lineIndex: Number.isFinite(lineIndex) ? lineIndex : 0,
          prompt: x.prompt.trim(),
          inputMode: x.inputMode,
          options,
          answer: x.answer.trim(),
        }
      }),
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <AdminFieldLabel>Imagine deasupra codului (URL, opțional)</AdminFieldLabel>
        <AdminTextInput
          value={imageUrl}
          placeholder="https://..."
          onChange={(e) => {
            const next = e.target.value.trim()
            onChange({ ...value, imageUrl: next || undefined })
          }}
        />
        {imageUrl.trim().startsWith("http") ? (
          <img
            src={imageUrl.trim()}
            alt=""
            className="mt-2 h-24 max-w-full rounded-md border border-white/15 object-contain"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : null}
      </div>
      <div className="space-y-1">
        <AdminFieldLabel>Limbă (etichetă)</AdminFieldLabel>
        <AdminTextInput
          value={language}
          onChange={(e) => onChange({ ...value, language: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <AdminFieldLabel>Liniile de cod (una pe linie)</AdminFieldLabel>
        <AdminTextarea
          rows={8}
          value={linesText}
          onChange={(e) => {
            const lines = e.target.value.split("\n")
            commit(lines, steps)
          }}
        />
      </div>
      <div className="space-y-3">
        <AdminFieldLabel>Pași (în ordine)</AdminFieldLabel>
        {steps.map((st, i) => (
          <div key={i} className="space-y-2 rounded-md border border-white/10 bg-black/30 p-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <AdminFieldLabel>Linie (index 0-based)</AdminFieldLabel>
                <AdminTextInput
                  type="number"
                  min={0}
                  value={st.lineIndex}
                  onChange={(e) => {
                    const c = [...steps]
                    c[i] = { ...c[i], lineIndex: e.target.value }
                    commit(linesArr, c)
                  }}
                />
              </div>
              <div className="space-y-1">
                <AdminFieldLabel>Mod intrare</AdminFieldLabel>
                <select
                  className="h-9 w-full rounded-md border border-white/20 bg-black/40 px-2 text-sm text-gray-100"
                  value={st.inputMode}
                  onChange={(e) => {
                    const c = [...steps]
                    c[i] = { ...c[i], inputMode: e.target.value === "text" ? "text" : "choice" }
                    commit(linesArr, c)
                  }}
                >
                  <option value="choice">Variante</option>
                  <option value="text">Text liber</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <AdminFieldLabel>Întrebare (markdown)</AdminFieldLabel>
              <AdminTextarea
                rows={2}
                value={st.prompt}
                onChange={(e) => {
                  const c = [...steps]
                  c[i] = { ...c[i], prompt: e.target.value }
                  commit(linesArr, c)
                }}
              />
            </div>
            {st.inputMode === "choice" ? (
              <div className="space-y-1">
                <AdminFieldLabel>Opțiuni (una pe linie, minim 2)</AdminFieldLabel>
                <AdminTextarea
                  rows={3}
                  value={st.optionsText}
                  onChange={(e) => {
                    const c = [...steps]
                    c[i] = { ...c[i], optionsText: e.target.value }
                    commit(linesArr, c)
                  }}
                />
              </div>
            ) : null}
            <div className="space-y-1">
              <AdminFieldLabel>Răspuns corect</AdminFieldLabel>
              <AdminTextInput
                value={st.answer}
                onChange={(e) => {
                  const c = [...steps]
                  c[i] = { ...c[i], answer: e.target.value }
                  commit(linesArr, c)
                }}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-300"
              onClick={() => commit(linesArr, steps.filter((_, j) => j !== i))}
            >
              Șterge pasul
            </Button>
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-white/20 text-gray-200"
          onClick={() =>
            commit(linesArr, [
              ...steps,
              { lineIndex: "0", prompt: "", inputMode: "choice", optionsText: "A\nB", answer: "A" },
            ])
          }
        >
          Adaugă pas
        </Button>
      </div>
    </div>
  )
}
