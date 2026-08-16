"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Flag, Loader2, Upload, X } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "@/lib/sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
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
  CONTENT_REPORT_ALLOWED_MIME,
  CONTENT_REPORT_ISSUE_TYPE_LABELS,
  CONTENT_REPORT_ISSUE_TYPES,
  CONTENT_REPORT_MAX_SCREENSHOT_BYTES,
  CONTENT_REPORT_MIN_DESCRIPTION_LENGTH,
  type ContentReportIssueType,
  type ContentReportSourceMeta,
  type ContentReportSourceType,
} from "@/lib/content-reports"

export type ReportIssueContext = {
  sourceType: ContentReportSourceType
  sourceId: string
  sourceMeta?: ContentReportSourceMeta
}

function currentPageUrl() {
  if (typeof window === "undefined") return "/"
  return `${window.location.pathname}${window.location.search}`
}

export function ReportIssueDialog({
  open,
  onOpenChange,
  context,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  context: ReportIssueContext
}) {
  const { user } = useAuth()
  const [issueType, setIssueType] = useState<ContentReportIssueType | "">("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setIssueType("")
    setDescription("")
    setFile(null)
    setPreviewUrl(null)
    setError(null)
    setSubmitting(false)
  }, [open, context.sourceId, context.sourceType])

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const loginHref = useMemo(() => {
    const redirect = encodeURIComponent(currentPageUrl())
    return `/login?redirect=${redirect}`
  }, [open])

  const pickFile = (next: File | null) => {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl)
    if (!next) {
      setFile(null)
      setPreviewUrl(null)
      return
    }
    if (!CONTENT_REPORT_ALLOWED_MIME.has(next.type) || next.size > CONTENT_REPORT_MAX_SCREENSHOT_BYTES) {
      setError("Folosește JPEG, PNG sau WebP de maximum 8 MB.")
      setFile(null)
      setPreviewUrl(null)
      return
    }
    setError(null)
    setFile(next)
    setPreviewUrl(URL.createObjectURL(next))
  }

  const handleSubmit = async () => {
    if (!user) return
    if (!issueType) {
      setError("Alege tipul problemei.")
      return
    }
    if (description.trim().length < CONTENT_REPORT_MIN_DESCRIPTION_LENGTH) {
      setError("Descrierea trebuie să aibă cel puțin 10 caractere.")
      return
    }
    if (!file) {
      setError("Screenshot-ul este obligatoriu.")
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) {
        setError("Sesiune invalidă. Autentifică-te din nou.")
        return
      }

      const form = new FormData()
      form.set("issue_type", issueType)
      form.set("description", description.trim())
      form.set("source_type", context.sourceType)
      form.set("source_id", context.sourceId)
      form.set("source_url", currentPageUrl())
      form.set("source_meta", JSON.stringify(context.sourceMeta ?? {}))
      form.set("screenshot", file)

      const response = await fetch("/api/content-reports", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      })
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) {
        setError(payload?.error ?? "Nu am putut trimite raportul.")
        return
      }

      toast.success("Raportul a fost trimis. Mulțumim!")
      onOpenChange(false)
    } catch {
      setError("Nu am putut trimite raportul.")
    } finally {
      setSubmitting(false)
    }
  }

  const fieldClass =
    "h-11 rounded-2xl border-[#e5e5e5] bg-white text-[#111111] shadow-none transition-[border-color,box-shadow] hover:border-[#d4c4f0] focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="z-[420] max-h-[90vh] overflow-y-auto rounded-[24px] border-[#e5e5e5] bg-white p-6 text-[#111111] shadow-[0_16px_40px_-20px_rgba(82,44,111,0.35)] sm:max-w-md sm:rounded-[24px]"
        overlayClassName="z-[410] !bg-black/45"
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-[#4d4d4d] transition-colors hover:bg-[#f5f5f5] hover:text-[#111111]"
          aria-label="Închide"
        >
          <X className="h-5 w-5" />
        </button>

        <DialogHeader className="pr-8 text-left">
          <DialogTitle className="text-xl font-bold text-[#111111]">Raportează o problemă</DialogTitle>
          <DialogDescription className="text-sm text-[#6d6d6d]">
            Spune-ne ce nu e în regulă pe această pagină. Screenshot-ul ne ajută să o găsim rapid.
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="space-y-4">
            <p className="text-sm text-[#6d6d6d]">Trebuie să fii autentificat ca să trimiți un raport.</p>
            <Link
              href={loginHref}
              className="dashboard-start-glow inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-4 py-3 text-sm font-semibold text-white shadow-[0_3px_0_#5b21b6] transition-[transform,box-shadow] hover:translate-y-0.5 hover:shadow-[0_1px_0_#5b21b6]"
            >
              Autentifică-te
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-issue-type" className="text-sm font-semibold text-[#4d4d4d]">
                Tipul problemei
              </Label>
              <Select
                value={issueType}
                onValueChange={(value) => setIssueType(value as ContentReportIssueType)}
              >
                <SelectTrigger id="report-issue-type" className={fieldClass}>
                  <SelectValue placeholder="Alege tipul" />
                </SelectTrigger>
                <SelectContent className="z-[430] rounded-2xl border-[#e5e5e5]">
                  {CONTENT_REPORT_ISSUE_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="rounded-xl">
                      {CONTENT_REPORT_ISSUE_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-description" className="text-sm font-semibold text-[#4d4d4d]">
                Descriere
              </Label>
              <Textarea
                id="report-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Ce anume e greșit? Unde apare?"
                rows={4}
                className="min-h-[104px] rounded-2xl border-[#e5e5e5] bg-white text-[#111111] shadow-none transition-[border-color,box-shadow] hover:border-[#d4c4f0] focus-visible:border-[#8b5cf6] focus-visible:ring-2 focus-visible:ring-[#8b5cf6]/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[#4d4d4d]">Screenshot</Label>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
              />
              {previewUrl ? (
                <div className="relative overflow-hidden rounded-2xl border border-[#e5e5e5] bg-[#faf9f7]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Preview screenshot" className="max-h-48 w-full object-contain" />
                  <button
                    type="button"
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#4d4d4d] shadow-sm transition-colors hover:bg-white hover:text-[#111111]"
                    onClick={() => {
                      pickFile(null)
                      if (inputRef.current) inputRef.current.value = ""
                    }}
                    aria-label="Șterge screenshot-ul"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#e5e5e5] bg-[#faf9f7] px-4 py-6 text-sm font-medium text-[#6d6d6d] transition-[border-color,background-color,color] hover:border-[#c4b5fd] hover:bg-[#f5f3ff] hover:text-[#7c3aed]"
                >
                  <Upload className="h-5 w-5" />
                  Adaugă un screenshot (obligatoriu)
                </button>
              )}
            </div>

            {error ? <p className="text-sm font-medium text-red-500">{error}</p> : null}

            <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-full border border-[#e5e5e5] bg-white px-5 py-3 text-sm font-semibold text-[#4d4d4d] transition-[background-color,border-color,transform] hover:border-[#d4d4d4] hover:bg-[#f5f5f5] disabled:opacity-50"
              >
                Anulează
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting}
                className={cn(
                  "dashboard-start-glow inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] px-5 py-3 text-sm font-semibold text-white shadow-[0_3px_0_#5b21b6] transition-[transform,box-shadow,opacity] hover:translate-y-0.5 hover:shadow-[0_1px_0_#5b21b6] disabled:pointer-events-none disabled:opacity-60",
                )}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Flag className="mr-2 h-4 w-4" />
                )}
                Trimite raportul
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
