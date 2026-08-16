"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CONTENT_REPORT_ISSUE_TYPE_LABELS,
  CONTENT_REPORT_SOURCE_TYPE_LABELS,
  CONTENT_REPORT_SOURCE_TYPES,
  CONTENT_REPORT_STATUS_LABELS,
  CONTENT_REPORT_STATUSES,
  type ContentReportIssueType,
  type ContentReportSourceType,
  type ContentReportStatus,
} from "@/lib/content-reports"

type Reporter = {
  name: string | null
  nickname: string | null
  email: string | null
}

type AdminReport = {
  id: string
  user_id: string
  created_at: string
  issue_type: ContentReportIssueType
  description: string
  screenshot_path: string
  screenshot_url: string | null
  source_type: ContentReportSourceType
  source_id: string
  source_url: string
  source_meta: Record<string, unknown>
  status: ContentReportStatus
  admin_notes: string | null
  resolved_at: string | null
  resolved_by: string | null
  reporter: Reporter
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

function reporterLabel(reporter: Reporter) {
  return reporter.nickname || reporter.name || reporter.email || "Utilizator"
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString("ro-RO")
  } catch {
    return value
  }
}

export function ContentReportsManager() {
  const [reports, setReports] = useState<AdminReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("open")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState("")
  const [saving, setSaving] = useState(false)

  const loadReports = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getAccessToken()
      if (!token) {
        setError("Sesiune invalidă.")
        return
      }
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (sourceFilter !== "all") params.set("source_type", sourceFilter)
      const response = await fetch(`/api/admin/content-reports?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = (await response.json().catch(() => null)) as
        | { reports?: AdminReport[]; error?: string }
        | null
      if (!response.ok) {
        setError(payload?.error ?? "Nu am putut încărca rapoartele.")
        return
      }
      setReports(payload?.reports ?? [])
    } catch {
      setError("Nu am putut încărca rapoartele.")
    } finally {
      setLoading(false)
    }
  }, [statusFilter, sourceFilter])

  useEffect(() => {
    void loadReports()
  }, [loadReports])

  const selected = useMemo(
    () => reports.find((row) => row.id === selectedId) ?? reports[0] ?? null,
    [reports, selectedId],
  )

  useEffect(() => {
    if (selected) setNotesDraft(selected.admin_notes ?? "")
  }, [selected?.id])

  const patchReport = async (id: string, body: { status?: ContentReportStatus; admin_notes?: string | null }) => {
    setSaving(true)
    setError(null)
    try {
      const token = await getAccessToken()
      if (!token) {
        setError("Sesiune invalidă.")
        return
      }
      const response = await fetch("/api/admin/content-reports", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...body }),
      })
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) {
        setError(payload?.error ?? "Nu am putut actualiza raportul.")
        return
      }
      await loadReports()
    } catch {
      setError("Nu am putut actualiza raportul.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] border-white/20 bg-white/5 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate statusurile</SelectItem>
              {CONTENT_REPORT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {CONTENT_REPORT_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[200px] border-white/20 bg-white/5 text-white">
              <SelectValue placeholder="Sursă" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate sursele</SelectItem>
              {CONTENT_REPORT_SOURCE_TYPES.map((source) => (
                <SelectItem key={source} value={source}>
                  {CONTENT_REPORT_SOURCE_TYPE_LABELS[source]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Se încarcă...
          </div>
        ) : error && reports.length === 0 ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-gray-400">Nu există rapoarte pentru filtrele alese.</p>
        ) : (
          <div className="divide-y divide-white/10 rounded-xl border border-white/10">
            {reports.map((report) => {
              const isActive = selected?.id === report.id
              return (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => setSelectedId(report.id)}
                  className={`block w-full px-4 py-3 text-left transition ${
                    isActive ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">
                      {CONTENT_REPORT_ISSUE_TYPE_LABELS[report.issue_type]}
                    </p>
                    <span className="text-xs text-gray-400">
                      {CONTENT_REPORT_STATUS_LABELS[report.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {CONTENT_REPORT_SOURCE_TYPE_LABELS[report.source_type]} · {reporterLabel(report.reporter)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{formatDate(report.created_at)}</p>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {selected ? (
        <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5">
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">
                {CONTENT_REPORT_ISSUE_TYPE_LABELS[selected.issue_type]}
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                {CONTENT_REPORT_SOURCE_TYPE_LABELS[selected.source_type]} · {reporterLabel(selected.reporter)}
                {selected.reporter.email ? ` (${selected.reporter.email})` : ""}
              </p>
              <p className="mt-1 text-xs text-gray-500">{formatDate(selected.created_at)}</p>
            </div>
            <Select
              value={selected.status}
              onValueChange={(value) => void patchReport(selected.id, { status: value as ContentReportStatus })}
              disabled={saving}
            >
              <SelectTrigger className="w-[160px] border-white/20 bg-white/5 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_REPORT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {CONTENT_REPORT_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="whitespace-pre-wrap text-sm text-gray-200">{selected.description}</p>

          <div className="text-sm">
            <span className="text-gray-400">Pagină: </span>
            <Link href={selected.source_url} className="text-violet-300 underline hover:text-violet-200" target="_blank">
              {selected.source_url}
            </Link>
          </div>
          <p className="text-xs text-gray-500">ID conținut: {selected.source_id}</p>

          {selected.screenshot_url ? (
            <a href={selected.screenshot_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected.screenshot_url} alt="Screenshot raport" className="max-h-[420px] w-full object-contain bg-black" />
            </a>
          ) : (
            <p className="text-sm text-gray-400">Screenshot-ul nu a putut fi încărcat.</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="admin-notes">Note admin</Label>
            <Textarea
              id="admin-notes"
              value={notesDraft}
              onChange={(event) => setNotesDraft(event.target.value)}
              className="border-white/20 bg-black/30 text-white"
              rows={3}
            />
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => void patchReport(selected.id, { admin_notes: notesDraft.trim() || null })}
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvează notele
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
