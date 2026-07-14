"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import {
  initialInformaticsTestRow,
  type InformaticsTestRow,
} from "@/lib/informatics-problem-content"
import { cn } from "@/lib/utils"

interface InformaticsTestsEditorProps {
  tests: InformaticsTestRow[]
  onChange: (tests: InformaticsTestRow[]) => void
  disabled?: boolean
  theme?: "dark" | "light"
}

export function InformaticsTestsEditor({
  tests,
  onChange,
  disabled = false,
  theme = "dark",
}: InformaticsTestsEditorProps) {
  const isLight = theme === "light"
  const cardClass = isLight
    ? "rounded-2xl border border-amber-200 bg-amber-50/60 p-6"
    : "rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6"
  const headingClass = isLight ? "text-gray-800" : "text-amber-100"
  const rowClass = isLight
    ? "rounded-lg border border-gray-200 bg-white p-3"
    : "rounded-lg border border-white/10 bg-black/30 p-3"
  const labelClass = isLight ? "text-gray-700" : "text-white/70"
  const subLabelClass = isLight ? "text-gray-800" : "text-white/80"
  const textareaClass = isLight
    ? "border-gray-300 bg-white font-mono text-xs text-gray-900"
    : "border-white/20 bg-black/40 font-mono text-xs text-white/90"

  return (
    <Card className={cardClass}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className={cn("text-lg font-semibold", headingClass)}>Teste judge</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onChange([...tests, initialInformaticsTestRow(false)])}
          className={isLight ? undefined : "border-white/20 text-white hover:bg-white/10"}
        >
          <Plus className="mr-1 h-4 w-4" />
          Adaugă test
        </Button>
      </div>

      <div className="space-y-4">
        {tests.map((test, index) => (
          <div key={index} className={rowClass}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className={cn("text-xs font-semibold", subLabelClass)}>Test #{index + 1}</p>
              <div className="flex flex-wrap items-center gap-3">
                <label className={cn("flex items-center gap-2 text-xs", labelClass)}>
                  <Checkbox
                    checked={test.is_sample}
                    disabled={disabled}
                    onCheckedChange={(checked) =>
                      onChange(
                        tests.map((row, i) =>
                          i === index ? { ...row, is_sample: checked === true } : row
                        )
                      )
                    }
                  />
                  Exemplu
                </label>
                <label className={cn("flex items-center gap-2 text-xs", labelClass)}>
                  Pondere
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    disabled={disabled}
                    className={cn("h-8 w-20", isLight ? undefined : "border-white/20 bg-black/40 text-white")}
                    value={test.weight}
                    onChange={(e) =>
                      onChange(
                        tests.map((row, i) =>
                          i === index
                            ? { ...row, weight: Number.parseFloat(e.target.value) || 0 }
                            : row
                        )
                      )
                    }
                  />
                </label>
                {tests.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    className="h-8 text-red-500 hover:text-red-400"
                    onClick={() => onChange(tests.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={labelClass}>Intrare (stdin)</Label>
                <Textarea
                  rows={4}
                  disabled={disabled}
                  className={textareaClass}
                  value={test.stdin}
                  onChange={(e) =>
                    onChange(
                      tests.map((row, i) => (i === index ? { ...row, stdin: e.target.value } : row))
                    )
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className={labelClass}>Ieșire așteptată</Label>
                <Textarea
                  rows={4}
                  disabled={disabled}
                  className={textareaClass}
                  value={test.expected_stdout}
                  onChange={(e) =>
                    onChange(
                      tests.map((row, i) =>
                        i === index ? { ...row, expected_stdout: e.target.value } : row
                      )
                    )
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
