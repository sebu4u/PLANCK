"use client"

import { Button } from "@/components/ui/button"
import { AdminFieldLabel, AdminTextarea, AdminTextInput } from "./shared-fields"

type Q = { prompt: string; options: string[]; correctIndex: number }

export function SpeedRoundEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const secondsTotal =
    typeof value.secondsTotal === "number" && Number.isFinite(value.secondsTotal)
      ? value.secondsTotal
      : 60

  const questions: Q[] = Array.isArray(value.questions)
    ? value.questions.map((q) => {
        if (!q || typeof q !== "object") return { prompt: "", options: ["", ""], correctIndex: 0 }
        const o = q as Record<string, unknown>
        const opts = Array.isArray(o.options) ? o.options.map((x) => (typeof x === "string" ? x : String(x))) : ["", ""]
        const correctIndex = typeof o.correctIndex === "number" ? o.correctIndex : 0
        return {
          prompt: typeof o.prompt === "string" ? o.prompt : "",
          options: opts.length >= 2 ? opts : ["", ""],
          correctIndex: Math.min(Math.max(0, correctIndex), Math.max(0, opts.length - 1)),
        }
      })
    : [{ prompt: "", options: ["A", "B"], correctIndex: 0 }]

  const setQuestions = (qs: Q[]) => {
    onChange({
      ...value,
      secondsTotal,
      questions: qs.map((q) => ({
        prompt: q.prompt.trim(),
        options: q.options.map((x) => x.trim()).filter(Boolean).length >= 2
          ? q.options.map((x) => x.trim())
          : [...q.options.map((x) => x.trim()), "", ""].slice(0, Math.max(2, q.options.length)),
        correctIndex: Math.min(q.correctIndex, Math.max(0, q.options.length - 1)),
      })),
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <AdminFieldLabel>Timp total (secunde, 10–600)</AdminFieldLabel>
        <AdminTextInput
          type="number"
          min={10}
          max={600}
          value={secondsTotal}
          onChange={(e) =>
            onChange({
              ...value,
              secondsTotal: Math.min(600, Math.max(10, Number.parseInt(e.target.value || "60", 10) || 60)),
              questions,
            })
          }
        />
      </div>
      <div className="space-y-3">
        <AdminFieldLabel>Întrebări</AdminFieldLabel>
        {questions.map((q, qi) => (
          <div key={qi} className="space-y-2 rounded-md border border-white/10 bg-black/30 p-3">
            <AdminTextarea
              rows={2}
              placeholder="Enunț"
              value={q.prompt}
              onChange={(e) => {
                const c = [...questions]
                c[qi] = { ...c[qi], prompt: e.target.value }
                setQuestions(c)
              }}
            />
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex gap-2">
                <AdminTextInput
                  className="flex-1"
                  placeholder={`Variantă ${oi + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const c = [...questions]
                    const opts = [...c[qi].options]
                    opts[oi] = e.target.value
                    c[qi] = { ...c[qi], options: opts }
                    setQuestions(c)
                  }}
                />
                <label className="flex shrink-0 items-center gap-1 text-xs text-gray-400">
                  <input
                    type="radio"
                    name={`speed-correct-${qi}`}
                    checked={q.correctIndex === oi}
                    onChange={() => {
                      const c = [...questions]
                      c[qi] = { ...c[qi], correctIndex: oi }
                      setQuestions(c)
                    }}
                  />
                  corect
                </label>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-white/20 text-gray-200"
                onClick={() => {
                  const c = [...questions]
                  c[qi] = { ...c[qi], options: [...c[qi].options, ""] }
                  setQuestions(c)
                }}
              >
                + variantă
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-red-300"
                onClick={() => setQuestions(questions.filter((_, j) => j !== qi))}
              >
                Șterge întrebarea
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
            setQuestions([...questions, { prompt: "", options: ["", ""], correctIndex: 0 }])
          }
        >
          Adaugă întrebare
        </Button>
      </div>
    </div>
  )
}
