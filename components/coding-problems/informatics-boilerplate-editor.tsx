"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface InformaticsBoilerplateEditorProps {
  boilerplateCpp: string
  boilerplatePython: string
  onChange: (patch: { boilerplate_cpp?: string; boilerplate_python?: string }) => void
  disabled?: boolean
  theme?: "dark" | "light"
}

export function InformaticsBoilerplateEditor({
  boilerplateCpp,
  boilerplatePython,
  onChange,
  disabled = false,
  theme = "dark",
}: InformaticsBoilerplateEditorProps) {
  const isLight = theme === "light"
  const cardClass = isLight
    ? "rounded-2xl border border-[#e7dff0] bg-[#ffffff] p-6 shadow-[0_16px_40px_rgba(76,44,114,0.08)]"
    : "rounded-2xl border border-white/10 bg-white/[0.03] p-6"
  const headingClass = isLight ? "text-[#111111]" : "text-white"
  const labelClass = isLight ? "text-gray-700" : "text-white/70"
  const textareaClass = isLight
    ? "border-gray-300 bg-white font-mono text-xs text-gray-900"
    : "border-white/20 bg-black/40 font-mono text-xs text-white/90"

  return (
    <Card className={cardClass}>
      <h2 className={cn("mb-4 text-lg font-semibold", headingClass)}>Boilerplate</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className={labelClass} htmlFor="boilerplate-cpp">
            C++
          </Label>
          <Textarea
            id="boilerplate-cpp"
            rows={8}
            disabled={disabled}
            className={textareaClass}
            value={boilerplateCpp}
            onChange={(e) => onChange({ boilerplate_cpp: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className={labelClass} htmlFor="boilerplate-python">
            Python
          </Label>
          <Textarea
            id="boilerplate-python"
            rows={8}
            disabled={disabled}
            className={textareaClass}
            value={boilerplatePython}
            onChange={(e) => onChange({ boilerplate_python: e.target.value })}
          />
        </div>
      </div>
    </Card>
  )
}
