"use client"

import { Input } from "@/components/ui/input"
import { LATE_POLICY_LABELS } from "@/lib/classrooms/constants"

interface AssignmentDraftFieldsProps {
  kind: "homework" | "test"
  status: "draft" | "published"
  latePolicy: "accept" | "mark_late" | "block"
  windowStart: string
  windowEnd: string
  timeLimitMinutes: string
  shuffleOptions: boolean
  onKind: (value: "homework" | "test") => void
  onStatus: (value: "draft" | "published") => void
  onLatePolicy: (value: "accept" | "mark_late" | "block") => void
  onWindowStart: (value: string) => void
  onWindowEnd: (value: string) => void
  onTimeLimit: (value: string) => void
  onShuffle: (value: boolean) => void
}

export function AssignmentDraftFields({
  kind,
  status,
  latePolicy,
  windowStart,
  windowEnd,
  timeLimitMinutes,
  shuffleOptions,
  onKind,
  onStatus,
  onLatePolicy,
  onWindowStart,
  onWindowEnd,
  onTimeLimit,
  onShuffle,
}: AssignmentDraftFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Tip</label>
          <select
            value={kind}
            onChange={(event) => onKind(event.target.value === "test" ? "test" : "homework")}
            className="h-10 w-full rounded-md border border-[#d1d5db] px-3 text-sm"
          >
            <option value="homework">Temă</option>
            <option value="test">Test</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Publicare</label>
          <select
            value={status}
            onChange={(event) => onStatus(event.target.value === "draft" ? "draft" : "published")}
            className="h-10 w-full rounded-md border border-[#d1d5db] px-3 text-sm"
          >
            <option value="published">Publică acum</option>
            <option value="draft">Salvează ciornă</option>
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Întârzieri</label>
        <select
          value={latePolicy}
          onChange={(event) =>
            onLatePolicy(
              event.target.value === "mark_late" || event.target.value === "block"
                ? event.target.value
                : "accept",
            )
          }
          className="h-10 w-full rounded-md border border-[#d1d5db] px-3 text-sm"
        >
          {Object.entries(LATE_POLICY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {kind === "test" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Fereastră start</label>
            <Input type="datetime-local" value={windowStart} onChange={(event) => onWindowStart(event.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Fereastră final</label>
            <Input type="datetime-local" value={windowEnd} onChange={(event) => onWindowEnd(event.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Minute</label>
            <Input type="number" min={1} value={timeLimitMinutes} onChange={(event) => onTimeLimit(event.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={shuffleOptions} onChange={(event) => onShuffle(event.target.checked)} />
            Amestecă variantele
          </label>
        </div>
      ) : null}
    </div>
  )
}
